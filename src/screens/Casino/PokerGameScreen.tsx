import React, {useRef, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import {theme} from '../../theme';
import {useStatsStore} from '../../store';
import type {CasinoStackParamList} from '../../navigation';

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
      deck.push({rank, suit, value: rankValue(rank)});
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

const PokerGameScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasinoStackParamList, 'PokerGame'>>();
  const {money, setField, casinoReputation, setCasinoReputation} = useStatsStore();
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [status, setStatus] = useState('2-player Hold’em lite. Tap play to deal a hand.');
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

  const playHand = () => {
    if (money < BASE_BET) {
      Alert.alert('Not enough cash', 'You need at least 5K to take a seat.');
      return;
    }
    const deck = createDeck();
    const nextPlayer = [deck.pop()!, deck.pop()!];
    const nextDealer = [deck.pop()!, deck.pop()!];
    const nextBoard = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

    setPlayerHand(nextPlayer);
    setDealerHand(nextDealer);
    setBoard(nextBoard);

    const playerScore = scoreHand(nextPlayer, nextBoard);
    const dealerScore = scoreHand(nextDealer, nextBoard);

    let outcome: 'win' | 'lose' | 'push' = 'push';
    if (playerScore > dealerScore) {
      outcome = 'win';
    } else if (dealerScore > playerScore) {
      outcome = 'lose';
    }

    let winnings = 0;
    if (outcome === 'win') {
      winnings = BASE_BET * 2;
      reputationUp(1);
      lossStreak.current = 0;
      setStatus(`You win with ${playerScore} vs ${dealerScore}.`);
    } else if (outcome === 'lose') {
      lossStreak.current += 1;
      reputationDownSmall();
      setStatus(`Dealer wins ${dealerScore} vs ${playerScore}.`);
    } else {
      winnings = BASE_BET;
      setStatus('Push. Bets returned.');
    }

    const nextMoney = money - BASE_BET + winnings;
    setField('money', nextMoney);
  };

  const renderCard = (card: Card, idx: number) => (
    <View key={`${card.rank}${card.suit}-${idx}`} style={styles.card}>
      <Text style={styles.cardRank}>{card.rank}</Text>
      <Text style={styles.cardSuit}>{card.suit}</Text>
    </View>
  );

  return (
    <AppScreen
      title="Texas Shuffle"
      subtitle="Heads-up Hold’em"
      leftNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.betBox}>
            <Text style={styles.betLabel}>Bet / Hand</Text>
            <Text style={styles.betValue}>${BASE_BET.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.sectionLabel}>Dealer</Text>
          <View style={styles.cardRow}>{dealerHand.map(renderCard)}</View>
        </View>

        <View style={styles.boardCard}>
          <Text style={styles.sectionLabel}>Board</Text>
          <View style={styles.cardRow}>{board.map(renderCard)}</View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.sectionLabel}>You</Text>
          <View style={styles.cardRow}>{playerHand.map(renderCard)}</View>
        </View>

        <Pressable
          onPress={playHand}
          style={({pressed}) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.primaryText}>PLAY HAND</Text>
        </Pressable>
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
    transform: [{scale: 0.98}],
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
    transform: [{scale: 0.96}],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
});
