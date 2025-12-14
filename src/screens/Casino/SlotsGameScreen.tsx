import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import { theme } from '../../theme';
import { useStatsStore } from '../../store';
import type { CasinoStackParamList } from '../../navigation';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import GameResultPopup from './components/GameResultPopup';

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
    maxBet: 100_000,
  },
};

type Grid = [string, string, string][];

const generateGrid = (symbols: string[]): Grid => {
  const roll = () => symbols[Math.floor(Math.random() * symbols.length)];
  return Array.from({ length: 3 }, () => [roll(), roll(), roll()]) as Grid;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const SlotsGameScreen = () => {
  const navigation = useNavigation<SlotsNavProp>();
  const { params } = useRoute<SlotsRouteProp>();
  const config = SLOT_CONFIG[params.variant];

  // Game Logic Hook
  const { playRound, lastResult, clearResult, money } = useCasinoGame();

  // Local Stats (reputation logic stays local or moves to hook? Staying local for complexity separation)
  const { casinoReputation, setCasinoReputation, luck } = useStatsStore();

  const [grid, setGrid] = useState<Grid>(() => generateGrid(config.symbols));
  // Initialize bet from params or default min
  const [bet, setBet] = useState<number>(params.betAmount ?? config.minBet);

  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Ready to spin');
  const lossStreak = useRef(0);

  useEffect(() => {
    // If variant changes, reset? Usually unmounts.
    // Ensure bet is within limits if config changes (unlikely)
    setGrid(generateGrid(config.symbols));
  }, [config]);

  const [showResult, setShowResult] = useState(false);

  const reputationUp = (delta: number) => {
    setCasinoReputation(clamp(Math.round(casinoReputation + delta), 0, 100));
  };

  const reputationDownSmall = () => {
    if (lossStreak.current >= 3) {
      setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
      lossStreak.current = 0;
    }
  };

  // Simplified visual evaluator to match the hook result logic?
  // Problem: Slots visual result MUST match the win/loss logic.
  // The hook does pure RNG. Slots need to generate a grid that MATCHES the RNG result.
  // Reverse engineering:
  // 1. Call playRound() -> get win/loss.
  // 2. If win, force grid to be a winning grid.
  // 3. If loss, force grid to be a losing grid.

  const generateOutcomeGrid = (isWin: boolean): Grid => {
    const syms = config.symbols;
    if (isWin) {
      // Win: three of a kind on MIDDLE row (row index 1)
      const winner = syms[Math.floor(Math.random() * syms.length)];
      return [
        [syms[0], syms[1], syms[2]], // Top row - random
        [winner, winner, winner],     // MIDDLE ROW - winning row
        [syms[2], syms[0], syms[1]], // Bottom row - random
      ];
    } else {
      // Loss: ensure middle row does NOT have three of a kind
      return [
        [syms[0], syms[1], syms[2]],
        [syms[0], syms[1], syms[2]], // Middle row - all different
        [syms[2], syms[0], syms[1]],
      ];
    }
  };

  const handleSpin = () => {
    if (isSpinning) return;

    // 1. Determine Win/Loss outcomes (Logic Layer)
    // Calc odds based on Luck?
    const odds = 0.3 + (luck / 200); // 0.3 to 0.8
    // Multiplier? Slots vary. Let's fix it to 3x for simplicity of this unified hook usage, 
    // OR we don't use the hook's RNG and use our own, then call a "payout" method?
    // The instructions said "standard casino kurallarına dayalı basit bir RNG... kazanma/kaybetme mantığı".
    // useCasinoGame encapsulates the RNG.
    // Let's use it.

    const { success, result } = playRound(bet, odds, 3); // 3x payout generic for slots
    if (!success || !result) return; // Insufficient funds handled by check inside hook but we might want alert? Hook returns error string?

    // We already checked money in hook, but maybe we should visualize error if fail?
    // Added hook return type check in thought process, let's assume it returned success.

    setIsSpinning(true);
    setShowResult(false);
    setMessage('Spinning...');

    // Visual Spin
    const interval = setInterval(() => {
      setGrid(generateGrid(config.symbols));
    }, 90);

    const spinDuration = 700 + Math.random() * 300;

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
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>

      <GameResultPopup
        result={showResult ? lastResult : null}
        onHide={() => {
          setShowResult(false);
          clearResult();
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Bankroll</Text>
            <Text style={styles.pillValue}>${money.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.gridWrapper}>
          {grid.map((row, rowIdx) => (
            <View key={rowIdx} style={[styles.row, rowIdx === 1 && styles.middleRow]}>
              {row.map((symbol, colIdx) => (
                <View key={colIdx} style={[styles.cell, rowIdx === 1 && styles.middleCell]}>
                  <Text style={[styles.symbol, rowIdx === 1 && styles.middleSymbol]}>{symbol}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Bet</Text>
          <View style={styles.betControls}>
            <Pressable
              onPress={() => adjustBet(-1000)}
              disabled={isSpinning}
              style={({ pressed }) => [
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
              style={({ pressed }) => [
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
          style={({ pressed }) => [
            styles.spinButton,
            pressed && styles.spinButtonPressed,
            isSpinning && styles.disabledButton,
          ]}>
          <Text style={styles.spinText}>{isSpinning ? 'SPINNING...' : 'SPIN'}</Text>
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  middleRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold tint for middle row
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
  },
  cell: {
    flex: 1,
    height: 68,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  middleCell: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  symbol: {
    fontSize: 28,
  },
  middleSymbol: {
    fontSize: 36,
    textShadowColor: theme.colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
    transform: [{ scale: 0.97 }],
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
    transform: [{ scale: 0.98 }],
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
    transform: [{ scale: 0.96 }],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.55,
  },
});
