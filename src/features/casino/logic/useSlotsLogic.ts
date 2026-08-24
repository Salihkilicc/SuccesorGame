import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { SLOT_CONFIG, SlotVariant, miniOdds, symbolByIcon, iconStrip } from './slotsData';
import { REPUTATION_CEILING, reputationForBet } from '../data/casinoData';

export type Grid = [string, string, string][];

// Helper to get random item safely
const getRandomSymbol = (symbols: string[]) => {
  if (!symbols || symbols.length === 0) return '🍒';
  return symbols[Math.floor(Math.random() * symbols.length)] || symbols[0];
};

// Helper to generate a completely random grid (for animation)
const generateRandomGrid = (symbols: string[]): Grid => {
  return Array.from({ length: 3 }, () => [
    getRandomSymbol(symbols),
    getRandomSymbol(symbols),
    getRandomSymbol(symbols)
  ]) as Grid;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type OutcomeTier = 'JACKPOT' | 'MINI' | 'LOSS';

export const useSlotsLogic = (variant: SlotVariant, initialBet?: number, customMaxBet?: number) => {
  const config = SLOT_CONFIG[variant];
  const maxBetLimit = customMaxBet ?? config.maxBet;

  const { money, spendMoney, earnMoney } = useStatsStore();
  const { reputation, updateReputation } = usePlayerStore();
  const casinoReputation = reputation.casino;

  const [grid, setGrid] = useState<Grid>(() => generateRandomGrid(iconStrip(config)));
  const [bet, setBet] = useState<number>(() => clamp(initialBet ?? config.minBet, config.minBet, maxBetLimit));

  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Ready to spin');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ type: 'win' | 'loss' | 'push', amount: number } | null>(null);

  const lossStreak = useRef(0);
  /** The grid that actually landed, for the payout to read. */
  const targetGridRef = useRef<Grid | null>(null);

  useEffect(() => {
    setGrid(generateRandomGrid(iconStrip(config)));
  }, [variant]);

  useEffect(() => {
    if (bet > maxBetLimit) setBet(maxBetLimit);
  }, [maxBetLimit]);

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
    updateReputation('casino', clamp(casinoReputation - 1, 0, REPUTATION_CEILING));
  };

  // ------------------------------------------------------------------
  //  THE ODDS COME FROM THE MACHINE, NOT FROM THIS FILE
  // ------------------------------------------------------------------
  //  They were 1/14 and 1/6 here, the same for all three machines, while
  //  each machine carried its own payout table that nothing read. So the
  //  three differed only in which pictures went past, and the pair of them
  //  together returned 0.548 of the stake - a forty five per cent house
  //  edge nobody had multiplied out. See logic/slotsData.ts.
  // ------------------------------------------------------------------
  const ODDS = {
    JACKPOT: config.jackpotOdds,
    MINI: miniOdds(config),
  };

  // Step 1: Determine Outcome (The Math)
  const determineOutcome = (): OutcomeTier => {
    const r = Math.random();

    // Tier 1: Jackpot
    if (r < ODDS.JACKPOT) return 'JACKPOT';

    // Tier 2: Mini Win (Cumulative)
    if (r < ODDS.JACKPOT + ODDS.MINI) return 'MINI';

    // Tier 3: Loss
    return 'LOSS';
  };

  // Step 2: Generate the Grid (The Visual)
  const generateForcedGrid = (outcome: OutcomeTier): Grid => {
    // Robust symbol getter
    const getSafeSymbol = (): string => {
      const syms = iconStrip(config);
      if (!syms || syms.length === 0) return iconStrip(config)[0] ?? 'help-circle-outline';
      return syms[Math.floor(Math.random() * syms.length)] || syms[0];
    };

    // Safe helper to pick a DIFFERENT valid symbol
    const getDifferentSymbol = (exclude: string[]): string => {
      const syms = iconStrip(config);
      if (!syms || syms.length < 2) return getSafeSymbol(); // Not enough symbols to diff

      // Filter out excluded items
      const candidates = syms.filter(s => !exclude.includes(s));

      // If no candidates (rare), just pick random valid one
      if (candidates.length === 0) return getSafeSymbol();

      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const syms = iconStrip(config);
    // Safety check: ensure we have symbols
    if (!syms || syms.length === 0) {
      return [['?', '?', '?'], ['?', '?', '?'], ['?', '?', '?']];
    }

    let payline: [string, string, string];

    if (outcome === 'JACKPOT') {
      // 3 Matches
      const symbol = getSafeSymbol();
      payline = [symbol, symbol, symbol];
    } else if (outcome === 'MINI') {
      // 2 Matches (Force 3rd to differ)
      const A = getSafeSymbol();
      // B must be different from A
      let B = getDifferentSymbol([A]);

      // Randomly position the mismatch
      const pattern = Math.random();
      if (pattern < 0.33) payline = [A, A, B];
      else if (pattern < 0.66) payline = [A, B, A];
      else payline = [B, A, A];
    } else {
      // LOSS LOGIC (Strictly Unique / No Win)
      let s1 = getSafeSymbol();

      // Ensure s2 != s1
      let s2 = getDifferentSymbol([s1]);

      // Ensure s3 != s1 AND s3 != s2 (Strictly 3 different symbols for visual clarity)
      let s3 = getDifferentSymbol([s1, s2]);

      payline = [s1, s2, s3];
    }

    // Decoration Rows (Pure Random)
    return [
      [getSafeSymbol(), getSafeSymbol(), getSafeSymbol()],
      payline,
      [getSafeSymbol(), getSafeSymbol(), getSafeSymbol()],
    ];
  };

  const handleSpin = () => {
    if (bet <= 0) return Alert.alert('Place Bet', 'Select a chip to play!');
    if (isSpinning) return;
    if (!spendMoney(bet)) return Alert.alert('Funds', "You don't have enough cash!");

    // 1. Decide Outcome
    const outcome = determineOutcome();
    // 2. Prepare Visuals
    const targetGrid = generateForcedGrid(outcome);
    // And remember it, because the payout is now decided by which symbol
    // came up rather than by a flat multiple. The ref rather than state
    // because processResult runs from a timer, after this closure is gone.
    targetGridRef.current = targetGrid;

    setIsSpinning(true);
    setShowResult(false);
    setMessage('Spinning...');
    setLastResult(null);

    // Animation loop (visual only)
    const interval = setInterval(() => {
      setGrid(generateRandomGrid(iconStrip(config)));
    }, 90);

    const spinDuration = 2000;

    // 3. Execute Spin Sequence
    setTimeout(() => {
      clearInterval(interval);

      // STOP: Show forced grid
      setGrid(targetGrid);
      setIsSpinning(false);

      // DELAY: Suspense
      setTimeout(() => {
        // PROCESS RESULT (Based on Outcome, not grid reading)
        processResult(outcome);
      }, 1140);

    }, spinDuration);
  };

  const processResult = (outcome: OutcomeTier) => {
    let winAmount = 0;
    let resultType: 'win' | 'loss' = 'loss';

    // Harcama bazlı reputation: minimum 1 + her $10K bahis = +1 rep
    const spendingRep = reputationForBet(bet);
    reputationUp(spendingRep);

    if (outcome === 'JACKPOT') {
      // ------------------------------------------------------------
      //  WHAT LANDED IS WHAT IT PAYS
      // ------------------------------------------------------------
      //  This was `bet * 3` whatever the reels showed, which made the
      //  payout table - eighteen hand-written numbers across three
      //  machines - decoration, and made the reels decoration with it.
      //  Three crowns is a hundred times the stake now, and three
      //  bears is three, because that is what the machine says.
      // ------------------------------------------------------------
      const landed = symbolByIcon(config, targetGridRef.current?.[1]?.[0] ?? '');
      const multiple = landed?.payout ?? config.symbols[0].payout;
      winAmount = Math.round(bet * multiple);
      resultType = 'win';
      lossStreak.current = 0;
      reputationUp(3);
      setMessage(`JACKPOT! +$${winAmount.toLocaleString()}`);
    } else if (outcome === 'MINI') {
      winAmount = Math.round(bet * config.twoKindMultiplier);
      resultType = 'win';
      lossStreak.current = 0;
      reputationUp(1);
      setMessage(`MINI WIN! +$${winAmount.toLocaleString()}`);
    } else {
      // LOSS
      winAmount = 0;
      resultType = 'loss';
      lossStreak.current += 1;
      reputationDownSmall();
      setMessage('No match.');
    }

    if (winAmount > 0) {
      earnMoney(winAmount);
    }

    // Show Popup
    setLastResult({ type: resultType, amount: winAmount });
    setShowResult(true);
  };

  const setBetAmount = (val: number) => {
    setBet(clamp(val, config.minBet, maxBetLimit));
  };

  const hideResult = () => {
    setShowResult(false);
    setLastResult(null);
  };

  return {
    state: { grid, bet, isSpinning, message, showResult, lastResult, money, config: { ...config, maxBet: maxBetLimit } },
    actions: { handleSpin, setBetAmount, hideResult }
  };
};