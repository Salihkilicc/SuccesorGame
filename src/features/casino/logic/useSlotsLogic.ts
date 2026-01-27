// src/features/casino/logic/useSlotsLogic.ts
import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { useCasinoGame } from '../hooks/useCasinoGame';
import { SLOT_CONFIG, SlotVariant } from './slotsData';

export type Grid = [string, string, string][];

// Helper
const generateGrid = (symbols: string[]): Grid => {
  const roll = () => symbols[Math.floor(Math.random() * symbols.length)];
  return Array.from({ length: 3 }, () => [roll(), roll(), roll()]) as Grid;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useSlotsLogic = (variant: SlotVariant, initialBet?: number, customMaxBet?: number) => {
  const config = SLOT_CONFIG[variant];
  // Priority: Custom Max Bet > Config Max Bet
  const maxBetLimit = customMaxBet ?? config.maxBet;

  const { money } = useStatsStore();
  const { hidden, reputation, updateReputation } = usePlayerStore();
  const luck = hidden.luck;
  const casinoReputation = reputation.casino;

  const { playRound, lastResult, clearResult } = useCasinoGame();

  const [grid, setGrid] = useState<Grid>(() => generateGrid(config.symbols));
  // Ensure initial bet is within new limits
  const [bet, setBet] = useState<number>(() => clamp(initialBet ?? config.minBet, config.minBet, maxBetLimit));

  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Ready to spin');
  const [showResult, setShowResult] = useState(false);

  const lossStreak = useRef(0);

  useEffect(() => {
    setGrid(generateGrid(config.symbols));
  }, [variant]);

  // Update bet if max limit changes dynamically (e.g. location switch)
  useEffect(() => {
    if (bet > maxBetLimit) {
      setBet(maxBetLimit);
    }
  }, [maxBetLimit]);

  // --- Reputation ---
  const reputationUp = (delta: number) => {
    updateReputation('casino', clamp(Math.round(casinoReputation + delta), 0, 1000));
  };
  const reputationDownSmall = () => {
    updateReputation('casino', clamp(casinoReputation - 1, 0, 1000));
  };

  const generateOutcomeGrid = (isWin: boolean): Grid => {
    const syms = config.symbols;
    if (isWin) {
      const winner = syms[Math.floor(Math.random() * syms.length)];
      return [
        [syms[0], syms[1], syms[2]],
        [winner, winner, winner],
        [syms[2], syms[0], syms[1]],
      ];
    } else {
      return [
        [syms[0], syms[1], syms[2]],
        [syms[1], syms[2], syms[0]], // Ensure shifting/diff
        [syms[2], syms[0], syms[1]],
      ];
    }
  };

  const handleSpin = () => {
    if (bet <= 0) {
      Alert.alert('Place Bet', 'Select a chip to play!');
      return;
    }
    if (isSpinning) return;
    const odds = 0.3 + (luck / 200);
    const { success, result } = playRound(bet, odds, 3);

    if (!success || !result) return;

    setIsSpinning(true);
    setShowResult(false);
    setMessage('Spinning...');

    const interval = setInterval(() => {
      setGrid(generateGrid(config.symbols));
    }, 90);

    const spinDuration = 2500; // Fixed duration for animations to sync

    setTimeout(() => {
      clearInterval(interval);
      const isWin = result.type === 'win';
      const finalGrid = generateOutcomeGrid(isWin);
      setGrid(finalGrid);

      if (isWin) {
        lossStreak.current = 0;
        reputationUp(2); // Higher rep gain
        setMessage(`WIN!`);
      } else {
        lossStreak.current += 1;
        reputationDownSmall();
        setMessage('No match.');
      }

      setIsSpinning(false);
      setShowResult(true);
    }, spinDuration);
  };

  // Direct Bet Setter
  const setBetAmount = (val: number) => {
    const next = clamp(val, config.minBet, maxBetLimit);
    setBet(next);
  };

  const hideResult = () => {
    setShowResult(false);
    clearResult();
  };

  return {
    state: {
      grid,
      bet,
      isSpinning,
      message,
      showResult,
      lastResult,
      money,
      config: { ...config, maxBet: maxBetLimit }
    },
    actions: {
      handleSpin,
      setBetAmount,
      hideResult
    }
  };
};