import { useState, useRef, useEffect } from 'react';
import { useStatsStore, usePlayerStore } from '../../../store'; // Store yolunu kontrol et
import { useCasinoGame } from '../../../hooks/useCasinoGame'; // Mevcut hook'un
import { SLOT_CONFIG, SlotVariant, SlotConfig } from './slotsData';

export type Grid = [string, string, string][];

// Helper: Grid Oluşturucu
const generateGrid = (symbols: string[]): Grid => {
  const roll = () => symbols[Math.floor(Math.random() * symbols.length)];
  return Array.from({ length: 3 }, () => [roll(), roll(), roll()]) as Grid;
};

// Helper: Bet Sınırlandırma
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useSlotsLogic = (variant: SlotVariant, initialBet?: number) => {
  const config = SLOT_CONFIG[variant];
  const { casinoReputation, setCasinoReputation, money } = useStatsStore();
  const { hidden } = usePlayerStore();
  const luck = hidden.luck;

  // Mevcut hook'u kullanıyoruz (RNG ve bakiye kontrolü için)
  const { playRound, lastResult, clearResult } = useCasinoGame();

  // State
  const [grid, setGrid] = useState<Grid>(() => generateGrid(config.symbols));
  const [bet, setBet] = useState<number>(initialBet ?? config.minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Ready to spin');
  const [showResult, setShowResult] = useState(false);

  const lossStreak = useRef(0);

  // Variant değişirse grid'i sıfırla
  useEffect(() => {
    setGrid(generateGrid(config.symbols));
  }, [variant]);

  // --- Reputation Helpers ---
  const reputationUp = (delta: number) => {
    setCasinoReputation(clamp(Math.round(casinoReputation + delta), 0, 100));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
      lossStreak.current = 0;
    }
  };

  // --- Görsel Sonuç Oluşturucu ---
  // Hook'tan gelen "KAZANDIN" sonucunu görsel bir grid'e çevirir.
  const generateOutcomeGrid = (isWin: boolean): Grid => {
    const syms = config.symbols;
    if (isWin) {
      // Kazanırsa: Orta satırda aynı semboller olsun
      const winner = syms[Math.floor(Math.random() * syms.length)];
      return [
        [syms[0], syms[1], syms[2]], // Üst (Rastgele)
        [winner, winner, winner],    // ORTA (Kazanan)
        [syms[2], syms[0], syms[1]], // Alt (Rastgele)
      ];
    } else {
      // Kaybederse: Orta satırda eşleşme olmasın
      return [
        [syms[0], syms[1], syms[2]],
        [syms[0], syms[1], syms[2]], // Hepsi farklı
        [syms[2], syms[0], syms[1]],
      ];
    }
  };

  // --- ANA FONKSİYON: SPIN ---
  const handleSpin = () => {
    if (isSpinning) return;

    // 1. Mantıksal Oynama (Logic)
    const odds = 0.3 + (luck / 200);
    const { success, result } = playRound(bet, odds, 3); // 3x payout generic

    if (!success || !result) return; // Bakiye yetersizse çık

    // 2. Animasyon Başlat
    setIsSpinning(true);
    setShowResult(false);
    setMessage('Spinning...');

    // Görsel Dönme Efekti
    const interval = setInterval(() => {
      setGrid(generateGrid(config.symbols));
    }, 90);

    const spinDuration = 700 + Math.random() * 300;

    // 3. Sonuç Gösterme
    setTimeout(() => {
      clearInterval(interval);

      const isWin = result.type === 'win';
      const finalGrid = generateOutcomeGrid(isWin);
      setGrid(finalGrid);

      if (isWin) {
        lossStreak.current = 0;
        reputationUp(1);
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

  const adjustBet = (delta: number) => {
    const next = clamp(bet + delta, config.minBet, config.maxBet);
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
      config // UI konfigürasyonu buradan alacak
    },
    actions: {
      handleSpin,
      adjustBet,
      hideResult
    }
  };
};