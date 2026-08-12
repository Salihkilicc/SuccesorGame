// src/features/casino/logic/useRouletteLogic.ts
import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';

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

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Helper Fonksiyonlar
const isRed = (value: number) => RED_NUMBERS.includes(value);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Get the color of a roulette number */
export const getNumberColor = (n: number): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';
  return isRed(n) ? 'red' : 'black';
};

/** Evaluate if a single bet wins for a given result */
const evaluateBet = (result: number, betType: BetType): { won: boolean; multiplier: number } => {
  // Straight number bet
  if (betType.startsWith('S')) {
    const num = parseInt(betType.slice(1), 10);
    return { won: result === num, multiplier: 35 };
  }

  // Area bets
  switch (betType) {
    case 'RED':
      return { won: result !== 0 && isRed(result), multiplier: 2 };
    case 'BLACK':
      return { won: result !== 0 && !isRed(result), multiplier: 2 };
    case 'EVEN':
      return { won: result !== 0 && result % 2 === 0, multiplier: 2 };
    case 'ODD':
      return { won: result % 2 === 1, multiplier: 2 };
    case 'LOW':
      return { won: result >= 1 && result <= 18, multiplier: 2 };
    case 'HIGH':
      return { won: result >= 19 && result <= 36, multiplier: 2 };
    case '1ST12':
      return { won: result >= 1 && result <= 12, multiplier: 3 };
    case '2ND12':
      return { won: result >= 13 && result <= 24, multiplier: 3 };
    case '3RD12':
      return { won: result >= 25 && result <= 36, multiplier: 3 };
    default:
      return { won: false, multiplier: 0 };
  }
};

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
    updateReputation('casino', clamp(casinoReputation + delta, 0, 1000));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      updateReputation('casino', clamp(casinoReputation - 1, 0, 1000));
      lossStreak.current = 0;
    }
  };

  // --- AKSİYONLAR ---

  /** Place a chip on the table at a given position */
  const placeBet = (type: BetType) => {
    if (isSpinning) return;
    if (selectedChip <= 0) return;
    if (money < totalBetAmount + selectedChip) {
      Alert.alert('Not enough cash', 'You don\'t have enough to place this bet.');
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
      Alert.alert('Place Bet', 'Place your chips on the table first.');
      return;
    }
    if (money < totalBetAmount) {
      Alert.alert('Not enough cash', 'You don\'t have enough to cover your bets.');
      return;
    }

    // Deduct total bet
    const afterDeduct = money - totalBetAmount;
    setField('money', afterDeduct);

    setIsSpinning(true);
    setSpinResult(null);
    setStatus('Spinning...');

    // 3 second spin delay
    setTimeout(() => {
      // RNG
      const result = Math.floor(Math.random() * 37); // 0-36
      const color = getNumberColor(result);

      // Evaluate all bets
      let totalWinnings = 0;
      for (const bet of bets) {
        const { won, multiplier } = evaluateBet(result, bet.type);
        if (won) {
          totalWinnings += bet.amount * multiplier;
        }
      }

      // Harcama bazlı reputation: minimum 1 + her $10K bahis = +1 rep
      const spendingRep = Math.max(1, Math.floor(totalBetAmount / 10000));
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