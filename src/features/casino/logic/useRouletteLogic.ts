// src/features/casino/logic/useRouletteLogic.ts
import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { REPUTATION_CEILING, reputationForBet } from '../data/casinoData';
import { casinoAlert } from '../../../data/i18n/casinoText';
import { colourOf, spinRoulette } from '../../../core/casino/roulette';

// --- TİPLER VE SABİTLER ---

/** Straight bets: 'S0'...'S36', Area bets: 'RED','BLACK','EVEN','ODD','LOW','HIGH','1ST12','2ND12','3RD12' */
export type BetType =
  | `S${number}`
  | 'RED' | 'BLACK'
  | 'EVEN' | 'ODD'
  | 'LOW' | 'HIGH'
  | '1ST12' | '2ND12' | '3RD12';

export type ResultEntry = {
  value: number;
  color: 'red' | 'black' | 'green';
};

/** A single bet placed on the table: which position and how much */
export type PlacedBet = {
  type: BetType;
  amount: number;
};

// ============================================================================
//  THE RULE LIVES IN core/casino/roulette.ts NOW
// ============================================================================
//  The wheel, the colours, the payouts and the spin were all in this file,
//  wrapped inside a `setTimeout(3000)` - so the number that decides who wins
//  could not be tested without waiting three seconds for it, and changing how
//  long the wheel spins meant editing the file that decides the result.
//
//  This hook keeps what a hook should keep: the money, the stores and the
//  clock. Re-exported rather than re-declared, because two copies of a payout
//  table is how the last four bugs in this codebase happened.
// ============================================================================

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Get the color of a roulette number. See core/casino/roulette.ts. */
export const getNumberColor = colourOf;

export const useRouletteLogic = (initialChip?: number) => {
  const { money, setField } = useStatsStore();
  const { reputation, updateReputation } = usePlayerStore();
  const casinoReputation = reputation.casino;

  // State
  const [selectedChip, setSelectedChip] = useState<number>(initialChip ?? 1000);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [lastResult, setLastResult] = useState<ResultEntry | null>(null);
  const [history, setHistory] = useState<ResultEntry[]>([]);
  const [status, setStatus] = useState('Place your chips on the table.');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  /**
   * THE NUMBER THE WHEEL IS AIMING AT.
   *
   * Set the instant the spin is decided rather than when it is revealed, so
   * the animation has somewhere to arrive. `spinResult` stays what it was -
   * the number the player has been SHOWN - and the two are different things
   * for exactly as long as the ball is in the air.
   * See core/casino/roulette.ts and components/RouletteWheel.tsx.
   */
  const [pendingResult, setPendingResult] = useState<number | null>(null);
  const [lastWinnings, setLastWinnings] = useState<number>(0);
  const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss', amount: number } | null>(null);
  const lossStreak = useRef(0);

  // --- COMPUTED ---
  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  /** Get total amount bet on a specific position */
  const getBetOnPosition = useCallback((type: BetType): number => {
    return bets.filter(b => b.type === type).reduce((sum, b) => sum + b.amount, 0);
  }, [bets]);

  // --- OYUN MOTORU ---
  const reputationUp = (delta: number) => {
    // ------------------------------------------------------------------
    //  THE ONLY PLACE THE COMPANY FINDS OUT YOU WERE HERE
    // ------------------------------------------------------------------
    //  The casino has been in this game since before any of the story and it
    //  has never cost the chief executive anything except money - a player
    //  could be at a table every week for nine years and nothing in the
    //  company would know. This marks the quarter. See
    //  core/store/useCasinoRiskStore.ts for why it is a boolean rather than a
    //  tally, and data/events/casino.ts for what three in a row does.
    // ------------------------------------------------------------------
    try {
        require('../../../core/store/useCasinoRiskStore')
            .useCasinoRiskStore.getState().recordVisit();
    } catch { /* risk store not ready */ }

    // ------------------------------------------------------------------
    //  AND THE QUARTER ONLY HAS SO MUCH STANDING IN IT
    // ------------------------------------------------------------------
    //  Nothing limits how long a player sits here - no energy, no cap on
    //  hands - so without this the seven room ladder falls in one evening.
    //  `bankReputation` returns what was actually allowed, which is 0 once
    //  the quarter is spent. See MAX_REP_PER_QUARTER.
    // ------------------------------------------------------------------
    const allowed = (() => {
        try {
            return require('../../../core/store/useCasinoRiskStore')
                .useCasinoRiskStore.getState().bankReputation(delta);
        } catch {
            return delta;
        }
    })();
    if (allowed <= 0) return;

    updateReputation('casino', clamp(Math.round(casinoReputation + allowed), 0, REPUTATION_CEILING));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      updateReputation('casino', clamp(casinoReputation - 1, 0, REPUTATION_CEILING));
      lossStreak.current = 0;
    }
  };

  // --- AKSİYONLAR ---

  /** Place a chip on the table at a given position */
  const placeBet = (type: BetType) => {
    if (isSpinning) return;
    if (selectedChip <= 0) return;
    if (money < totalBetAmount + selectedChip) {
      casinoAlert('Not enough cash', 'You don\'t have enough to place this bet.');
      return;
    }

    setBets(prev => [...prev, { type, amount: selectedChip }]);
    setResultPopup(null);
    setSpinResult(null);
  };

  /** Clear all bets */
  const clearBets = () => {
    if (isSpinning) return;
    setBets([]);
    setResultPopup(null);
    setSpinResult(null);
  };

  /** Select chip value */
  const selectChip = (value: number) => {
    setSelectedChip(value);
    setResultPopup(null);
  };

  /** Spin the wheel */
  const handleSpin = () => {
    if (isSpinning) return;
    setResultPopup(null);

    if (bets.length === 0) {
      casinoAlert('Place Bet', 'Place your chips on the table first.');
      return;
    }
    if (money < totalBetAmount) {
      casinoAlert('Not enough cash', 'You don\'t have enough to cover your bets.');
      return;
    }

    // Deduct total bet
    const afterDeduct = money - totalBetAmount;
    setField('money', afterDeduct);

    // DECIDED HERE, BEFORE ANYTHING TURNS. The three seconds below are the
    // telling of it. This is the whole engine and show split.
    const settlement = spinRoulette(bets);
    setPendingResult(settlement.result);

    setIsSpinning(true);
    setSpinResult(null);
    setStatus('Spinning...');

    // 3 second spin delay
    setTimeout(() => {
      // ONE CALL, and it is synchronous. The three seconds above are the
      // SHOW; this is the result, and it could have been produced before the
      // wheel started turning. See core/casino/roulette.ts.
      const result = settlement.result;
      const color = settlement.colour;
      const totalWinnings = settlement.returned;

      // Harcama bazlı reputation: minimum 1 + her $10K bahis = +1 rep
      const spendingRep = reputationForBet(totalBetAmount);
      reputationUp(spendingRep);

      // Apply winnings
      if (totalWinnings > 0) {
        setField('money', afterDeduct + totalWinnings);
        lossStreak.current = 0;
        reputationUp(1);
        setLastWinnings(totalWinnings);
        setStatus(`Won $${totalWinnings.toLocaleString()}!`);
        setResultPopup({ type: 'win', amount: totalWinnings - totalBetAmount });
      } else {
        lossStreak.current += 1;
        reputationDownSmall();
        setLastWinnings(0);
        setStatus('No luck this time.');
        setResultPopup({ type: 'loss', amount: totalBetAmount });
      }

      const entry: ResultEntry = { value: result, color };
      setLastResult(entry);
      setSpinResult(result);
      setHistory(prev => [entry, ...prev].slice(0, 8));
      setIsSpinning(false);
      setPendingResult(null);

      // Clear bets for next round
      setBets([]);
    }, 3000);
  };

  const closePopup = () => setResultPopup(null);

  return {
    state: {
      money,
      selectedChip,
      bets,
      totalBetAmount,
      lastResult,
      history,
      status,
      isSpinning,
      spinResult,
      pendingResult,
      lastWinnings,
      resultPopup,
    },
    actions: {
      placeBet,
      clearBets,
      selectChip,
      handleSpin,
      closePopup,
      getBetOnPosition,
    }
  };
};