import React, {useMemo, useRef, useState} from 'react';
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

type RoundState = 'idle' | 'player' | 'done';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['♠', '♥', '♦', '♣'] as const;

const rankValue = (rank: string) => {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
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

const BlackjackGameScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasinoStackParamList, 'BlackjackGame'>>();
  const {money, setField, casinoReputation, setCasinoReputation} = useStatsStore();
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [bet, setBet] = useState(5000);
  const [roundState, setRoundState] = useState<RoundState>('idle');
  const [status, setStatus] = useState('Place your bet and deal.');
  const lossStreak = useRef(0);

  const handTotal = (cards: Card[]) => {
    let total = cards.reduce((sum, card) => sum + card.value, 0);
    let aces = cards.filter(card => card.rank === 'A').length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    const isBlackjack = cards.length === 2 && total === 21;
    return {total, isBlackjack};
  };

  const reputationUp = (delta: number) => {
    setCasinoReputation(clamp(casinoReputation + delta, 0, 100));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
      lossStreak.current = 0;
    }
  };

  const deal = () => {
    if (roundState === 'player') {
      return;
    }
    if (money < bet) {
      Alert.alert('Not enough cash', 'Lower your bet or build more bankroll.');
      return;
    }
    const freshDeck = createDeck();
    const nextPlayer = [freshDeck.pop()!, freshDeck.pop()!];
    const nextDealer = [freshDeck.pop()!, freshDeck.pop()!];
    setPlayerCards(nextPlayer);
    setDealerCards(nextDealer);
    setDeck(freshDeck);
    setRoundState('player');
    setStatus('Your move: HIT or STAND.');

    const player = handTotal(nextPlayer);
    const dealer = handTotal(nextDealer);
    if (player.isBlackjack || dealer.isBlackjack) {
      const outcome =
        player.isBlackjack && dealer.isBlackjack
          ? 'push'
          : player.isBlackjack
          ? 'blackjack'
          : 'lose';
      resolveRound(outcome);
    }
  };

  const resolveRound = (outcome: 'win' | 'lose' | 'push' | 'blackjack') => {
    let winnings = 0;
    if (outcome === 'win') {
      winnings = bet * 2;
      reputationUp(1);
      lossStreak.current = 0;
      setStatus(`You win ${winnings.toLocaleString()}!`);
    } else if (outcome === 'blackjack') {
      winnings = Math.round(bet * 2.5);
      reputationUp(2);
      lossStreak.current = 0;
      setStatus('Blackjack! Premium payout.');
    } else if (outcome === 'push') {
      winnings = bet;
      setStatus('Push. Bet returned.');
    } else {
      lossStreak.current += 1;
      reputationDownSmall();
      setStatus('Bust or dealer wins.');
    }

    const nextMoney = money - bet + winnings;
    setField('money', nextMoney);
    setRoundState('done');
  };

  const handleHit = () => {
    if (roundState !== 'player') return;
    const nextDeck = [...deck];
    const card = nextDeck.pop();
    if (!card) return;
    const nextHand = [...playerCards, card];
    setPlayerCards(nextHand);
    setDeck(nextDeck);
    const {total} = handTotal(nextHand);
    if (total > 21) {
      resolveRound('lose');
    }
  };

  const handleStand = () => {
    if (roundState !== 'player') return;
    let nextDeck = [...deck];
    let nextDealer = [...dealerCards];
    while (handTotal(nextDealer).total < 17) {
      const draw = nextDeck.pop();
      if (!draw) break;
      nextDealer = [...nextDealer, draw];
    }
    setDealerCards(nextDealer);
    setDeck(nextDeck);
    const player = handTotal(playerCards);
    const dealer = handTotal(nextDealer);

    if (dealer.total > 21) {
      resolveRound('win');
      return;
    }
    if (player.total > dealer.total) {
      resolveRound('win');
      return;
    }
    if (dealer.total > player.total) {
      resolveRound('lose');
      return;
    }
    resolveRound('push');
  };

  const adjustBet = (delta: number) => {
    const next = clamp(bet + delta, 1000, 20000);
    setBet(next);
  };

  const renderCard = (card: Card, idx: number) => (
    <View key={`${card.rank}${card.suit}-${idx}`} style={styles.card}>
      <Text style={styles.cardRank}>{card.rank}</Text>
      <Text style={styles.cardSuit}>{card.suit}</Text>
    </View>
  );

  const playerTotal = useMemo(() => handTotal(playerCards).total, [playerCards]);
  const dealerTotal = useMemo(() => handTotal(dealerCards).total, [dealerCards]);
  const hideDealerHole = roundState === 'player';

  return (
    <AppScreen
      title="Blackjack"
      subtitle="Beat the dealer to 21"
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
            <Text style={styles.betLabel}>Bet</Text>
            <Text style={styles.betValue}>${bet.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.handCard}>
          <Text style={styles.handLabel}>Dealer</Text>
          <View style={styles.cardRow}>
            {dealerCards.map((card, idx) => {
              if (idx === 1 && hideDealerHole) {
                return (
                  <View key={`hidden-${idx}`} style={[styles.card, styles.hiddenCard]}>
                    <Text style={styles.cardRank}>?</Text>
                  </View>
                );
              }
              return renderCard(card, idx);
            })}
          </View>
          {!hideDealerHole && <Text style={styles.totalText}>Total: {dealerTotal}</Text>}
        </View>

        <View style={styles.handCard}>
          <Text style={styles.handLabel}>You</Text>
          <View style={styles.cardRow}>{playerCards.map(renderCard)}</View>
          <Text style={styles.totalText}>Total: {playerTotal}</Text>
        </View>

        <View style={styles.betControls}>
          <Pressable
            onPress={() => adjustBet(-1000)}
            style={({pressed}) => [styles.betButton, pressed && styles.betButtonPressed]}>
            <Text style={styles.betButtonText}>-</Text>
          </Pressable>
          <Pressable
            onPress={() => adjustBet(1000)}
            style={({pressed}) => [styles.betButton, pressed && styles.betButtonPressed]}>
            <Text style={styles.betButtonText}>+</Text>
          </Pressable>
          <Pressable
            onPress={deal}
            style={({pressed}) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryText}>DEAL</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleHit}
            disabled={roundState !== 'player'}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              roundState !== 'player' && styles.disabledButton,
            ]}>
            <Text style={styles.secondaryText}>HIT</Text>
          </Pressable>
          <Pressable
            onPress={handleStand}
            disabled={roundState !== 'player'}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              roundState !== 'player' && styles.disabledButton,
            ]}>
            <Text style={styles.secondaryText}>STAND</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

export default BlackjackGameScreen;

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
  handCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  handLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  cardRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  hiddenCard: {
    backgroundColor: theme.colors.background,
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
  totalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  betControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  betButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardSoft,
  },
  betButtonPressed: {
    transform: [{scale: 0.97}],
  },
  betButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
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
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    transform: [{scale: 0.98}],
  },
  secondaryText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
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
