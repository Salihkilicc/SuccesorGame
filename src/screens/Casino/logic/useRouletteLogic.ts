import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../store'; // Store yolunu kontrol et

// --- TİPLER VE SABİTLER ---
export type BetType = 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH';

export type ResultEntry = {
  value: number;
  color: 'red' | 'black' | 'green';
};

const CHIP_VALUES = [1000, 5000, 10000, 50000];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Helper Fonksiyonlar
const isRed = (value: number) => RED_NUMBERS.includes(value);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useRouletteLogic = (initialBet?: number) => {
  const { money, setField, casinoReputation, setCasinoReputation } = useStatsStore();

  // State
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [chip, setChip] = useState<number>(initialBet ?? CHIP_VALUES[0]);
  const [lastResult, setLastResult] = useState<ResultEntry | null>(null);
  const [history, setHistory] = useState<ResultEntry[]>([]);
  const [status, setStatus] = useState('Pick a bet and spin the wheel.');
  const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss', amount: number } | null>(null);
  const lossStreak = useRef(0);

  // --- OYUN MOTORU ---
  const reputationUp = (delta: number) => {
    setCasinoReputation(clamp(casinoReputation + delta, 0, 100));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
      lossStreak.current = 0;
    }
  };

  const evaluateWin = (result: number, bet: BetType) => {
    if (bet === 'RED') return result !== 0 && isRed(result);
    if (bet === 'BLACK') return result !== 0 && !isRed(result);
    if (bet === 'EVEN') return result !== 0 && result % 2 === 0;
    if (bet === 'ODD') return result % 2 === 1;
    if (bet === 'LOW') return result >= 1 && result <= 18;
    if (bet === 'HIGH') return result >= 19 && result <= 36;
    return false;
  };

  // --- AKSİYONLAR ---
  const handleSpin = () => {
    setResultPopup(null);
    
    if (!selectedBet) {
      Alert.alert('Pick a bet', 'Select RED, BLACK, EVEN, ODD, LOW, or HIGH first.');
      return;
    }
    if (money < chip) {
      Alert.alert('Not enough cash', 'Lower your chip size or refill elsewhere.');
      return;
    }

    // RNG
    const result = Math.floor(Math.random() * 37); // 0-36
    const color: ResultEntry['color'] = result === 0 ? 'green' : isRed(result) ? 'red' : 'black';
    
    // Kazanma Kontrolü
    const win = evaluateWin(result, selectedBet);
    const winnings = win ? chip * 2 : 0;
    
    // Para Güncelleme
    const nextMoney = money - chip + winnings;
    setField('money', nextMoney);

    if (win) {
      lossStreak.current = 0;
      reputationUp(1);
      setStatus(`You win ${winnings.toLocaleString()}!`);
      setResultPopup({ type: 'win', amount: chip }); // Net kar değil, kazanılan miktar
    } else {
      lossStreak.current += 1;
      reputationDownSmall();
      setStatus('Missed this spin.');
      setResultPopup({ type: 'loss', amount: chip });
    }

    const entry = { value: result, color };
    setLastResult(entry);
    setHistory(prev => [entry, ...prev].slice(0, 5)); // Son 5 geçmişi tutalım
  };

  const selectBet = (type: BetType) => {
    setSelectedBet(type);
    setResultPopup(null);
  };

  const selectChip = (value: number) => {
    setChip(value);
    setResultPopup(null);
  };

  const closePopup = () => setResultPopup(null);

  return {
    state: {
      money,
      chip,
      selectedBet,
      lastResult,
      history,
      status,
      resultPopup,
      CHIP_VALUES // Sabitleri de UI'a gönderelim
    },
    actions: {
      handleSpin,
      selectBet,
      selectChip,
      closePopup
    }
  };
};