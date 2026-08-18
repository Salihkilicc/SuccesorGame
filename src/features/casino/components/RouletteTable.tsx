// src/features/casino/components/RouletteTable.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BetType, getNumberColor } from '../logic/useRouletteLogic';
import { CasinoTheme } from '../data/casinoData';

interface RouletteTableProps {
  onPlaceBet: (type: BetType) => void;
  getBetOnPosition: (type: BetType) => number;
  gameTheme: CasinoTheme;
  disabled?: boolean;
}

// The standard roulette table layout: 3 columns × 12 rows
// The standard roulette table layout: 3 columns × 12 rows
// Column order (left to right): col1, col2, col3
// Row 1: 1, 2, 3 ... Row 12: 34, 35, 36
const ROULETTE_GRID: number[][] = [];
for (let row = 0; row < 12; row++) {
  const base = row * 3;
  ROULETTE_GRID.push([base + 1, base + 2, base + 3]);
}

const NUMBER_COLORS: Record<number, string> = {};
for (let i = 0; i <= 36; i++) {
  const c = getNumberColor(i);
  NUMBER_COLORS[i] = c === 'red' ? '#B91C1C' : c === 'black' ? '#15191E' : '#166534';
}

const formatChipAmount = (val: number): string => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(val % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}K`;
  return `${val}`;
};

const NumberCell = ({
  number,
  betAmount,
  onPress,
  disabled,
}: {
  number: number;
  betAmount: number;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const bgColor = NUMBER_COLORS[number];
  const isZero = number === 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.numberCell,
        { backgroundColor: bgColor },
        isZero && styles.zeroCell,
        pressed && !disabled && styles.cellPressed,
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={styles.numberText}>{number}</Text>
      {betAmount > 0 && (
        <View style={styles.chipIndicator}>
          <Text style={styles.chipIndicatorText}>{formatChipAmount(betAmount)}</Text>
        </View>
      )}
    </Pressable>
  );
};

const AreaBetButton = ({
  label,
  betType,
  betAmount,
  onPress,
  color,
  customBg,
  disabled,
}: {
  label: string;
  betType: BetType;
  betAmount: number;
  onPress: () => void;
  color?: string;
  customBg?: string;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.areaBetBtn,
      color ? { borderColor: color } : {},
      customBg ? { backgroundColor: customBg } : {},
      pressed && !disabled && styles.cellPressed,
      disabled && { opacity: 0.6 },
    ]}
  >
    <Text style={[styles.areaBetText, color ? { color } : {}]}>{label}</Text>
    {betAmount > 0 && (
      <View style={[styles.chipIndicator, styles.areaChipIndicator]}>
        <Text style={styles.chipIndicatorText}>{formatChipAmount(betAmount)}</Text>
      </View>
    )}
  </Pressable>
);

const RouletteTable = ({ onPlaceBet, getBetOnPosition, gameTheme, disabled }: RouletteTableProps) => {
  return (
    <View style={styles.container}>
      {/* ZERO */}
      <NumberCell
        number={0}
        betAmount={getBetOnPosition('S0')}
        onPress={() => onPlaceBet('S0')}
        disabled={disabled}
      />

      {/* NUMBER GRID */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {ROULETTE_GRID.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((num) => (
              <NumberCell
                key={num}
                number={num}
                betAmount={getBetOnPosition(`S${num}` as BetType)}
                onPress={() => onPlaceBet(`S${num}` as BetType)}
                disabled={disabled}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* DOZEN BETS */}
      <View style={styles.dozenRow}>
        <AreaBetButton
          label="1st 12"
          betType="1ST12"
          betAmount={getBetOnPosition('1ST12')}
          onPress={() => onPlaceBet('1ST12')}
          disabled={disabled}
        />
        <AreaBetButton
          label="2nd 12"
          betType="2ND12"
          betAmount={getBetOnPosition('2ND12')}
          onPress={() => onPlaceBet('2ND12')}
          disabled={disabled}
        />
        <AreaBetButton
          label="3rd 12"
          betType="3RD12"
          betAmount={getBetOnPosition('3RD12')}
          onPress={() => onPlaceBet('3RD12')}
          disabled={disabled}
        />
      </View>

      {/* AREA BETS (6-pack) */}
      <View style={styles.areaBetGrid}>
        <AreaBetButton
          label="1-18"
          betType="LOW"
          betAmount={getBetOnPosition('LOW')}
          onPress={() => onPlaceBet('LOW')}
          disabled={disabled}
        />
        <AreaBetButton
          label="EVEN"
          betType="EVEN"
          betAmount={getBetOnPosition('EVEN')}
          onPress={() => onPlaceBet('EVEN')}
          disabled={disabled}
        />
        <AreaBetButton
          label="◆ RED"
          betType="RED"
          betAmount={getBetOnPosition('RED')}
          onPress={() => onPlaceBet('RED')}
          color="#FF6B6B"
          customBg="#881337"
          disabled={disabled}
        />
        <AreaBetButton
          label="◆ BLACK"
          betType="BLACK"
          betAmount={getBetOnPosition('BLACK')}
          onPress={() => onPlaceBet('BLACK')}
          color="#E2E8F0"
          customBg="#0F172A"
          disabled={disabled}
        />
        <AreaBetButton
          label="ODD"
          betType="ODD"
          betAmount={getBetOnPosition('ODD')}
          onPress={() => onPlaceBet('ODD')}
          disabled={disabled}
        />
        <AreaBetButton
          label="19-36"
          betType="HIGH"
          betAmount={getBetOnPosition('HIGH')}
          onPress={() => onPlaceBet('HIGH')}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

export default RouletteTable;

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },

  // Grid
  gridScroll: {
    maxHeight: 250,
  },
  gridContainer: {
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
  },
  numberCell: {
    flex: 1,
    height: 32,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  zeroCell: {
    height: 32,
    borderRadius: 5,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cellPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  // Chip indicators
  chipIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  areaChipIndicator: {
    top: -5,
    right: -5,
  },
  chipIndicatorText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1C242C',
  },

  // Dozen row
  dozenRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },

  // Area bets
  areaBetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  areaBetBtn: {
    flexBasis: '32%',
    flexGrow: 1,
    height: 32,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  areaBetText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
