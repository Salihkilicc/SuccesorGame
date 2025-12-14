import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import { theme } from '../../theme';
import { useStatsStore } from '../../store';
import type { CasinoStackParamList } from '../../navigation';

type Card = {
  rank: string;
  suit: string;
  value: number;
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['♠', '♥', '♦', '♣'] as const;
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
const BASE_BET = 5000;

import type { RouteProp } from '@react-navigation/native';
import GameResultPopup from './components/GameResultPopup';

type PokerRouteProp = RouteProp<CasinoStackParamList, 'PokerGame'>;

const PokerGameScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasinoStackParamList, 'PokerGame'>>();
  const route = useRoute<PokerRouteProp>();
  const initialBet = route.params?.betAmount ?? 10_000;

  const { money, setField, casinoReputation, setCasinoReputation } = useStatsStore();
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [revealedBoard, setRevealedBoard] = useState<number>(0); // 0, 3, 4, 5
  // Dealer cards hidden from UI entirely, handled in background
  const [status, setStatus] = useState('2-player Hold’em. Progressive betting.');
  const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss', amount: number } | null>(null);
  const [gamePhase, setGamePhase] = useState<'idle' | 'flop' | 'turn' | 'river' | 'showdown'>('idle');
  const [currentBet, setCurrentBet] = useState(initialBet);
  const lossStreak = useRef(0);

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
    const topBoard = [...community]
      .map(card => card.value)
      .sort((a, b) => b - a)
      .slice(0, 3);
    const hole = hand.map(card => card.value);
    const total = hole.reduce((sum, v) => sum + v, 0) + topBoard.reduce((sum, v) => sum + v, 0);
    return total;
  };

  const handleRegame = () => {
    // Acts as Fold / Resign
    lossStreak.current += 1;
    reputationDownSmall();
    const lostAmount = currentBet;

    // Show Lost Screen
    setResultPopup({ type: 'loss', amount: lostAmount });
    setStatus(`Folded. You lost $${lostAmount.toLocaleString()}.`);

    // Reset for new hand
    setGamePhase('idle');
    setRevealedBoard(0);
    setPlayerHand([]);
    setDealerHand([]);
    setBoard([]);
    // Don't reset currentBet yet? No, next deal handles it.
    // Ensure playHand will reset it.
    setCurrentBet(initialBet);
  };

  const playHand = () => {
    if (gamePhase === 'idle') {
      // Phase 1: Deal (Bet 1x)
      setResultPopup(null);
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need ' + initialBet + ' to start.');
        return;
      }

      // Deduct initial bet
      setField('money', money - initialBet);
      setCurrentBet(initialBet);

      const deck = createDeck();
      const nextPlayer = [deck.pop()!, deck.pop()!];
      const nextDealer = [deck.pop()!, deck.pop()!];
      const nextBoard = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

      setPlayerHand(nextPlayer);
      setDealerHand(nextDealer);
      setBoard(nextBoard);
      setRevealedBoard(3); // Show flop immediately? Or wait for next click?
      // "everytime a card opening the bet must be double"
      // User likely means: Deal Hole Cards -> Bet 1x.
      // Click Continue -> Show Flop -> Bet becomes 2x.
      // Let's reveal FLOP immediately logic or progressive?
      // "first 3 can be visible"
      setRevealedBoard(3);
      setGamePhase('flop');
      setStatus('Flop dealt. Continue to double bet.');
    } else if (gamePhase === 'flop') {
      // Phase 2: Turn (Bet 2x)
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need more funds to continue.');
        return;
      }
      setField('money', money - initialBet); // Add 1x to pot
      setCurrentBet(currentBet + initialBet);

      setRevealedBoard(4);
      setGamePhase('turn');
      setStatus('Turn revealed. Continue to triple bet.');
    } else if (gamePhase === 'turn') {
      // Phase 3: River (Bet 3x)
      if (money < initialBet) {
        Alert.alert('Not enough cash', 'You need more funds to continue.');
        return;
      }
      setField('money', money - initialBet); // Add 1x to pot
      setCurrentBet(currentBet + initialBet);

      setRevealedBoard(5);
      setGamePhase('river');
      setStatus('River revealed. Showdown!');
      // Auto showdown or specific click? "continue" logic suggests next step.
      // Let's do instant showdown or one more click? 
      // User says "when you press regame... new game begins".
      // Let's transition to showdown immediately after paying for River?
      // Or 1 more click for suspense? Let's do 1 more click.
    } else if (gamePhase === 'river') {
      // Showdown
      setGamePhase('showdown');

      const playerScore = scoreHand(playerHand, board);
      const dealerScore = scoreHand(dealerHand, board);

      let outcome: 'win' | 'lose' | 'push' = 'push';
      if (playerScore > dealerScore) {
        outcome = 'win';
      } else if (dealerScore > playerScore) {
        outcome = 'lose';
      }

      let winnings = 0;
      if (outcome === 'win') {
        winnings = currentBet * 2; // Return stake + equal profit
        reputationUp(1);
        lossStreak.current = 0;
        setStatus(`You win! Score: ${playerScore} vs ${dealerScore}`);
        setResultPopup({ type: 'win', amount: winnings - currentBet }); // Net profit
      } else if (outcome === 'lose') {
        lossStreak.current += 1;
        reputationDownSmall();
        setStatus(`Dealer wins. Score: ${dealerScore} vs ${playerScore}`);
        setResultPopup({ type: 'loss', amount: currentBet });
      } else {
        winnings = currentBet;
        setStatus('Push. Bets returned.');
      }

      const nextMoney = money + winnings; // money was already deducted incrementally
      setField('money', nextMoney);
    } else {
      // Reset for new hand (from Showdown)
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

  const renderCard = (card: Card, idx: number, hidden: boolean = false) => (
    <View key={`${card.rank}${card.suit}-${idx}`} style={[styles.card, hidden && styles.cardHidden]}>
      {hidden ? (
        <Text style={styles.cardBack}>🂠</Text>
      ) : (
        <>
          <Text style={styles.cardRank}>{card.rank}</Text>
          <Text style={[styles.cardSuit, { color: ['♥', '♦'].includes(card.suit) ? '#ef4444' : '#e2e8f0' }]}>
            {card.suit}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <AppScreen
      title="Texas Shuffle"
      subtitle="Progressive Hold’em"
      leftNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }
      rightNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.exitButton, pressed && styles.exitButtonPressed]}>
          <Text style={styles.exitText}>EXIT</Text>
        </Pressable>
      }>

      <GameResultPopup result={resultPopup} onHide={() => setResultPopup(null)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.betBox}>
            <Text style={styles.betLabel}>Total Bet</Text>
            <Text style={styles.betValue}>${currentBet.toLocaleString()}</Text>
          </View>
        </View>

        {/* Dealer UI Removed as requested */}

        <View style={styles.boardCard}>
          <Text style={styles.sectionLabel}>Board</Text>
          <View style={styles.cardRow}>
            {board.slice(0, revealedBoard).map((card, idx) => renderCard(card, idx))}
            {board.slice(revealedBoard).map((card, idx) => renderCard(card, idx + revealedBoard, true))}
          </View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.sectionLabel}>You</Text>
          <View style={styles.cardRow}>{playerHand.map((card, idx) => renderCard(card, idx))}</View>
        </View>

        <View style={styles.buttonRow}>
          {gamePhase !== 'idle' && gamePhase !== 'showdown' && (
            <Pressable
              onPress={handleRegame}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryText}>REGAME (FOLD)</Text>
            </Pressable>
          )}

          <Pressable
            onPress={playHand}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, { flex: 1 }]}>
            <Text style={styles.primaryText}>
              {gamePhase === 'idle' ? 'DEAL HAND' : gamePhase === 'showdown' ? 'NEW HAND' : 'CONTINUE'}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </AppScreen>
  );
};

export default PokerGameScreen;

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  betBox: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  betLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  betValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  boardCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  cardRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  card: {
    width: 60,
    height: 84,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  cardHidden: {
    backgroundColor: '#2A2D3A',
  },
  cardBack: {
    fontSize: 40,
    color: theme.colors.textMuted,
  },
  cardRank: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  cardSuit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  primaryText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body + 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardSoft,
  },
  backButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  exitButtonPressed: {
    opacity: 0.7,
  },
  exitText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  secondaryButton: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  secondaryText: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
});
