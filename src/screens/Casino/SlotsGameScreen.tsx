import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import {theme} from '../../theme';
import {useStatsStore} from '../../store';
import type {CasinoStackParamList} from '../../navigation';

type SlotsRouteProp = RouteProp<CasinoStackParamList, 'SlotsGame'>;
type SlotsNavProp = NativeStackNavigationProp<CasinoStackParamList, 'SlotsGame'>;
type SlotVariant = CasinoStackParamList['SlotsGame']['variant'];

type SlotConfig = {
  title: string;
  icon: string;
  subtitle: string;
  symbols: string[];
  multipliers: Record<string, number>;
  twoKindMultiplier: number;
  minBet: number;
  maxBet: number;
};

const SLOT_CONFIG: Record<SlotVariant, SlotConfig> = {
  street_fighter: {
    title: 'Street Fighter Slots',
    icon: '🎮',
    subtitle: 'Arcade wilds & bonus spins',
    symbols: ['🥊', '🔥', '💰', '⭐', '⚡'],
    multipliers: {
      '🥊': 5,
      '🔥': 6,
      '💰': 8,
      '⭐': 9,
      '⚡': 10,
    },
    twoKindMultiplier: 1.6,
    minBet: 1000,
    maxBet: 30000,
  },
  poseidon: {
    title: "Poseidon's Fortune",
    icon: '🌊',
    subtitle: 'Tidal multipliers & treasure chests',
    symbols: ['⚓', '🌊', '🐚', '🐙', '💎'],
    multipliers: {
      '⚓': 5,
      '🌊': 6,
      '🐚': 7,
      '🐙': 8,
      '💎': 11,
    },
    twoKindMultiplier: 1.8,
    minBet: 1000,
    maxBet: 35000,
  },
  high_roller: {
    title: 'High Roller Deluxe',
    icon: '💎',
    subtitle: 'Premium stakes and luxe jackpots',
    symbols: ['💎', '7️⃣', '🍀', '💰', '👑'],
    multipliers: {
      '💎': 10,
      '7️⃣': 9,
      '🍀': 7,
      '💰': 8,
      '👑': 12,
    },
    twoKindMultiplier: 2,
    minBet: 5000,
    maxBet: 50000,
  },
};

type Grid = [string, string, string][];

const generateGrid = (symbols: string[]): Grid => {
  const roll = () => symbols[Math.floor(Math.random() * symbols.length)];
  return Array.from({length: 3}, () => [roll(), roll(), roll()]) as Grid;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const SlotsGameScreen = () => {
  const navigation = useNavigation<SlotsNavProp>();
  const {params} = useRoute<SlotsRouteProp>();
  const config = SLOT_CONFIG[params.variant];
  const {money, casinoReputation, setCasinoReputation, setField, luck} = useStatsStore();
  const [grid, setGrid] = useState<Grid>(() => generateGrid(config.symbols));
  const [bet, setBet] = useState<number>(config.minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Ready to spin');
  const lossStreak = useRef(0);

  useEffect(() => {
    setBet(config.minBet);
    setGrid(generateGrid(config.symbols));
  }, [config]);

  const reputationUp = (delta: number) => {
    setCasinoReputation(clamp(Math.round(casinoReputation + delta), 0, 100));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
      lossStreak.current = 0;
    }
  };

  const evaluateGrid = (resultGrid: Grid) => {
    let winnings = 0;
    const lines = [
      resultGrid[0],
      resultGrid[1],
      resultGrid[2],
    ];

    lines.forEach(line => {
      const [a, b, c] = line;
      if (a === b && b === c) {
        const baseMultiplier = config.multipliers[a] ?? 5;
        const luckBoost = luck > 70 ? 0.5 : 0;
        winnings += Math.round(bet * (baseMultiplier + luckBoost));
        return;
      }
      if (a === b || b === c || a === c) {
        winnings += Math.round(bet * config.twoKindMultiplier);
      }
    });

    return winnings;
  };

  const handleSpin = () => {
    if (isSpinning) {
      return;
    }
    if (money < bet) {
      Alert.alert('Not enough cash', 'Increase your bankroll or lower your bet.');
      return;
    }

    setIsSpinning(true);
    setMessage('Spinning...');
    const interval = setInterval(() => {
      setGrid(generateGrid(config.symbols));
    }, 90);

    const spinDuration = 700 + Math.random() * 300;
    setTimeout(() => {
      clearInterval(interval);
      const finalGrid = generateGrid(config.symbols);
      setGrid(finalGrid);
      const winnings = evaluateGrid(finalGrid);
      const net = winnings - bet;
      const nextMoney = money + net;
      setField('money', nextMoney);
      setLastWin(winnings);

      if (winnings > 0) {
        lossStreak.current = 0;
        if (winnings >= bet * 5) {
          reputationUp(3);
        } else if (winnings >= bet * 3) {
          reputationUp(2);
        } else {
          reputationUp(1);
        }
        setMessage(`Win ${winnings.toLocaleString()}!`);
      } else {
        lossStreak.current += 1;
        reputationDownSmall();
        setMessage('No match, try again.');
      }
      setIsSpinning(false);
    }, spinDuration);
  };

  const adjustBet = (delta: number) => {
    const next = clamp(bet + delta, config.minBet, config.maxBet);
    setBet(next);
  };

  const renderCell = (symbol: string, idx: number) => (
    <View key={`${symbol}-${idx}`} style={styles.cell}>
      <Text style={styles.symbol}>{symbol}</Text>
    </View>
  );

  return (
    <AppScreen
      title="Slots"
      subtitle={config.subtitle}
      leftNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Bankroll</Text>
            <Text style={styles.pillValue}>${money.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.gridWrapper}>
          <View style={styles.reelRow}>
            {grid.map((line, lineIdx) => (
              <View key={lineIdx} style={styles.column}>
                {line.map(renderCell)}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Bet</Text>
          <View style={styles.betControls}>
            <Pressable
              onPress={() => adjustBet(-1000)}
              disabled={isSpinning}
              style={({pressed}) => [
                styles.betButton,
                pressed && styles.betButtonPressed,
                isSpinning && styles.disabledButton,
              ]}>
              <Text style={styles.betButtonText}>-</Text>
            </Pressable>
            <Text style={styles.betValue}>${bet.toLocaleString()}</Text>
            <Pressable
              onPress={() => adjustBet(1000)}
              disabled={isSpinning}
              style={({pressed}) => [
                styles.betButton,
                pressed && styles.betButtonPressed,
                isSpinning && styles.disabledButton,
              ]}>
              <Text style={styles.betButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.betHint}>
            {`Limits ${config.minBet.toLocaleString()} - ${config.maxBet.toLocaleString()}`}
          </Text>
        </View>

        <Pressable
          onPress={handleSpin}
          disabled={isSpinning}
          style={({pressed}) => [
            styles.spinButton,
            pressed && styles.spinButtonPressed,
            isSpinning && styles.disabledButton,
          ]}>
          <Text style={styles.spinText}>{isSpinning ? 'SPINNING...' : 'SPIN'}</Text>
          <Text style={styles.spinSub}>
            {lastWin > 0 ? `Last win: $${lastWin.toLocaleString()}` : 'Try for a streak'}
          </Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
};

export default SlotsGameScreen;

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  headerRow: {
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
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs / 2,
  },
  pillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  pillValue: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body + 1,
  },
  gridWrapper: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  reelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  column: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cell: {
    height: 68,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  symbol: {
    fontSize: 28,
  },
  betRow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  betLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  betControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  betButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  betButtonPressed: {
    transform: [{scale: 0.97}],
  },
  betButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  betValue: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  betHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  spinButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  spinButtonPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.9,
  },
  spinText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  spinSub: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
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
  disabledButton: {
    opacity: 0.55,
  },
});
