import React, {useRef, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import {theme} from '../../theme';
import {useStatsStore} from '../../store';
import type {CasinoStackParamList} from '../../navigation';

type BetType = 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH';

type ResultEntry = {
  value: number;
  color: 'red' | 'black' | 'green';
};

const CHIP_VALUES = [1000, 5000, 10000, 50000];
const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const isRed = (value: number) => redNumbers.includes(value);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const RouletteGameScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasinoStackParamList, 'RouletteGame'>>();
  const {money, setField, casinoReputation, setCasinoReputation} = useStatsStore();
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [chip, setChip] = useState<number>(CHIP_VALUES[0]);
  const [lastResult, setLastResult] = useState<ResultEntry | null>(null);
  const [history, setHistory] = useState<ResultEntry[]>([]);
  const [status, setStatus] = useState('Pick a bet and spin the wheel.');
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

  const evaluateWin = (result: number, bet: BetType) => {
    if (bet === 'RED') {
      return result !== 0 && isRed(result);
    }
    if (bet === 'BLACK') {
      return result !== 0 && !isRed(result);
    }
    if (bet === 'EVEN') {
      return result !== 0 && result % 2 === 0;
    }
    if (bet === 'ODD') {
      return result % 2 === 1;
    }
    if (bet === 'LOW') {
      return result >= 1 && result <= 18;
    }
    if (bet === 'HIGH') {
      return result >= 19 && result <= 36;
    }
    return false;
  };

  const handleSpin = () => {
    if (!selectedBet) {
      Alert.alert('Pick a bet', 'Select RED, BLACK, EVEN, ODD, LOW, or HIGH first.');
      return;
    }
    if (money < chip) {
      Alert.alert('Not enough cash', 'Lower your chip size or refill elsewhere.');
      return;
    }

    const result = Math.floor(Math.random() * 37); // 0-36
    const color: ResultEntry['color'] =
      result === 0 ? 'green' : isRed(result) ? 'red' : 'black';
    const win = evaluateWin(result, selectedBet);
    const winnings = win ? chip * 2 : 0;
    const nextMoney = money - chip + winnings;
    setField('money', nextMoney);

    if (win) {
      lossStreak.current = 0;
      reputationUp(1);
      setStatus(`You win ${winnings.toLocaleString()}!`);
    } else {
      lossStreak.current += 1;
      reputationDownSmall();
      setStatus('Missed this spin.');
    }

    const entry = {value: result, color};
    setLastResult(entry);
    setHistory(prev => [entry, ...prev].slice(0, 3));
  };

  const renderBetButton = (type: BetType, label: string) => {
    const active = selectedBet === type;
    return (
      <Pressable
        onPress={() => setSelectedBet(type)}
        style={({pressed}) => [
          styles.betButton,
          active && styles.betButtonActive,
          pressed && styles.betButtonPressed,
        ]}>
        <Text style={styles.betButtonText}>{label}</Text>
      </Pressable>
    );
  };

  const renderResultPill = (entry: ResultEntry, idx: number) => (
    <View
      key={`${entry.value}-${idx}`}
      style={[
        styles.resultPill,
        entry.color === 'red' && styles.resultRed,
        entry.color === 'black' && styles.resultBlack,
        entry.color === 'green' && styles.resultGreen,
      ]}>
      <Text style={styles.resultText}>{entry.value}</Text>
    </View>
  );

  return (
    <AppScreen
      title="Roulette"
      subtitle="European table"
      leftNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.historyRow}>{history.map(renderResultPill)}</View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Wheel</Text>
          <Text style={styles.tableNote}>
            European single-zero. Choose a simple bet, pick a chip, and spin.
          </Text>
          <View style={styles.betGrid}>
            {renderBetButton('RED', 'Red')}
            {renderBetButton('BLACK', 'Black')}
            {renderBetButton('EVEN', 'Even')}
            {renderBetButton('ODD', 'Odd')}
            {renderBetButton('LOW', '1 - 18')}
            {renderBetButton('HIGH', '19 - 36')}
          </View>
        </View>

        <View style={styles.chipRow}>
          {CHIP_VALUES.map(value => {
            const active = chip === value;
            return (
              <Pressable
                key={value}
                onPress={() => setChip(value)}
                style={({pressed}) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}>
                <Text style={styles.chipText}>${value / 1000}K</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSpin}
          style={({pressed}) => [styles.spinButton, pressed && styles.spinButtonPressed]}>
          <Text style={styles.spinText}>SPIN</Text>
          {lastResult ? (
            <Text style={styles.spinSub}>
              Result: {lastResult.value} (
              {lastResult.color === 'green'
                ? 'Green'
                : lastResult.color === 'red'
                ? 'Red'
                : 'Black'}
              )
            </Text>
          ) : (
            <Text style={styles.spinSub}>Awaiting first spin</Text>
          )}
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
};

export default RouletteGameScreen;

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
  historyRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tableCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  tableTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  tableNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 18,
  },
  betGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  betButton: {
    flexBasis: '48%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
  },
  betButtonActive: {
    borderColor: theme.colors.accent,
  },
  betButtonPressed: {
    transform: [{scale: 0.97}],
  },
  betButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  chip: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  chipActive: {
    borderColor: theme.colors.accent,
  },
  chipPressed: {
    transform: [{scale: 0.97}],
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
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
  resultPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  resultRed: {
    backgroundColor: 'rgba(220,38,38,0.18)',
  },
  resultBlack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resultGreen: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  resultText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
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
