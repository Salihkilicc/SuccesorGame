import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../store'; // Store yolunu kontrol et

// --- TİPLER ---
export type Card = {
  rank: string;
  suit: string;
  value: number;
};

type GamePhase = 'idle' | 'flop' | 'turn' | 'river' | 'showdown';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['♠', '♥', '♦', '♣'] as const;

// --- YARDIMCI FONKSİYONLAR ---
const rankValue = (rank: string) => {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank, 10);
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ rank, suit, value: rankValue(rank) });
    });
  });
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const usePokerLogic = (initialBet: number = 10000) => {
  const { money, setField, casinoReputation, setCasinoReputation } = useStatsStore();
  
  // States
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [revealedBoard, setRevealedBoard] = useState<number>(0); 
  const [status, setStatus] = useState('2-player Hold’em. Progressive betting.');
  const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss', amount: number } | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [currentBet, setCurrentBet] = useState(initialBet);
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

  const scoreHand = (hand: Card[], community: Card[]) => {
    // Basitleştirilmiş skorlama (sadece yüksek kart toplamı)
    // Gerçek bir poker mantığı çok uzundur, mevcut kodundaki mantığı korudum.
    const topBoard = [...community]
      .map(card => card.value)
      .sort((a, b) => b - a)
      .slice(0, 3);
    const hole = hand.map(card => card.value);
    const total = hole.reduce((sum, v) => sum + v, 0) + topBoard.reduce((sum, v) => sum + v, 0);
    return total;
  };

  // --- ACTIONS ---

  const handleRegame = () => {
    // Fold / Çekilme Mantığı
    lossStreak.current += 1;
    reputationDownSmall();
    const lostAmount = currentBet;

    setResultPopup({ type: 'loss', amount: lostAmount });
    setStatus(`Folded. You lost $${lostAmount.toLocaleString()}.`);

    // Reset
    setGamePhase('idle');
    setRevealedBoard(0);
    setPlayerHand([]);
    setDealerHand([]);
    setBoard([]);
    setCurrentBet(initialBet);
  };

  const playHand = () => {
    if (gamePhase === 'idle') {
      // 1. AŞAMA: Kart Dağıt
      setResultPopup(null);
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need ' + initialBet + ' to start.');
        return;
      }

      setField('money', money - initialBet);
      setCurrentBet(initialBet);

      const deck = createDeck();
      const nextPlayer = [deck.pop()!, deck.pop()!];
      const nextDealer = [deck.pop()!, deck.pop()!];
      const nextBoard = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

      setPlayerHand(nextPlayer);
      setDealerHand(nextDealer);
      setBoard(nextBoard);
      
      setRevealedBoard(3); // Flop hemen açılıyor
      setGamePhase('flop');
      setStatus('Flop dealt. Continue to double bet.');

    } else if (gamePhase === 'flop') {
      // 2. AŞAMA: Turn (Bahis 2x)
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need more funds to continue.');
        return;
      }
      setField('money', money - initialBet);
      setCurrentBet(currentBet + initialBet);

      setRevealedBoard(4);
      setGamePhase('turn');
      setStatus('Turn revealed. Continue to triple bet.');

    } else if (gamePhase === 'turn') {
      // 3. AŞAMA: River (Bahis 3x)
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need more funds to continue.');
        return;
      }
      setField('money', money - initialBet);
      setCurrentBet(currentBet + initialBet);

      setRevealedBoard(5);
      setGamePhase('river');
      setStatus('River revealed. Showdown!');

    } else if (gamePhase === 'river') {
      // 4. AŞAMA: Showdown (Sonuç)
      setGamePhase('showdown');

      const playerScore = scoreHand(playerHand, board);
      const dealerScore = scoreHand(dealerHand, board);

      let outcome: 'win' | 'lose' | 'push' = 'push';
      if (playerScore > dealerScore) outcome = 'win';
      else if (dealerScore > playerScore) outcome = 'lose';

      let winnings = 0;
      if (outcome === 'win') {
        winnings = currentBet * 2;
        reputationUp(1);
        lossStreak.current = 0;
        setStatus(`You win! Score: ${playerScore} vs ${dealerScore}`);
        setResultPopup({ type: 'win', amount: winnings - currentBet });
      } else if (outcome === 'lose') {
        lossStreak.current += 1;
        reputationDownSmall();
        setStatus(`Dealer wins. Score: ${dealerScore} vs ${playerScore}`);
        setResultPopup({ type: 'loss', amount: currentBet });
      } else {
        winnings = currentBet;
        setStatus('Push. Bets returned.');
      }

      const nextMoney = money + winnings;
      setField('money', nextMoney);

    } else {
      // Yeni el için temizlik
      setResultPopup(null);
      setGamePhase('idle');
      setRevealedBoard(0);
      setPlayerHand([]);
      setDealerHand([]);
      setBoard([]);
      setCurrentBet(initialBet);
      setStatus('Ready for next hand.');
    }
  };

  const closePopup = () => setResultPopup(null);

  return {
    state: {
      playerHand,
      board,
      revealedBoard,
      status,
      resultPopup,
      gamePhase,
      currentBet,
      money
    },
    actions: {
      playHand,
      handleRegame,
      closePopup
    }
  };
};