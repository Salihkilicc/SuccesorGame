// src/features/casino/components/RouletteTable.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BetType, getNumberColor } from '../logic/useRouletteLogic';
import { CasinoTheme } from '../data/casinoData';
import { useLocale } from '../../../core/i18n';
import { translateDozenBet, translateOutsideBet } from '../../../data/i18n/casinoText';
import { feltColour } from '../../../core/casino/roulette';

interface RouletteTableProps {
  onPlaceBet: (type: BetType) => void;
  /**
   * Take the last chip back off one position.
   *
   * A LONG PRESS, and the only way to change one bet without clearing the
   * whole table. See logic/useRouletteLogic.removeBet for why it lifts one
   * chip rather than the stack.
   */
  onRemoveBet: (type: BetType) => void;
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

// ONE SET OF FELT COLOURS. This table and the wheel beside it had two
// different reds; see core/casino/roulette.ts -> FELT.
const NUMBER_COLORS: Record<number, string> = {};
for (let i = 0; i <= 36; i++) {
  NUMBER_COLORS[i] = feltColour(i);
}

/**
 * How long a press has to be held before it takes a chip back.
 *
 * React Native's default is 500ms, which is long enough that a player who
 * meant to lay a second chip and paused gets a removal instead. 300 is past
 * a deliberate tap and short enough to feel like picking the chip up.
 */
const LIFT_CHIP_MS = 300;

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
  onLongPress,
  disabled,
  chipColor,
}: {
  number: number;
  betAmount: number;
  onPress: () => void;
  onLongPress: () => void;
  disabled?: boolean;
  /** The room's chip colour. It was one hardcoded gold for every city. */
  chipColor: string;
}) => {
  const bgColor = NUMBER_COLORS[number];
  const isZero = number === 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={LIFT_CHIP_MS}
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
        <View style={[styles.chipIndicator, { backgroundColor: chipColor, borderColor: 'rgba(0,0,0,0.35)' }]}>
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
  onLongPress,
  color,
  customBg,
  disabled,
  chipColor,
}: {
  label: string;
  betType: BetType;
  betAmount: number;
  onPress: () => void;
  onLongPress: () => void;
  color?: string;
  customBg?: string;
  disabled?: boolean;
  chipColor: string;
}) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    delayLongPress={LIFT_CHIP_MS}
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
      <View style={[
        styles.chipIndicator, styles.areaChipIndicator,
        { backgroundColor: chipColor, borderColor: 'rgba(0,0,0,0.35)' },
      ]}>
        <Text style={styles.chipIndicatorText}>{formatChipAmount(betAmount)}</Text>
      </View>
    )}
  </Pressable>
);

const RouletteTable = ({ onPlaceBet, onRemoveBet, getBetOnPosition, gameTheme, disabled }: RouletteTableProps) => {
  useLocale();
  // ONE GOLD FOR EVERY CITY was what the chip markers used. The room already
  // has a chip colour and every other surface in the casino uses it.
  const chip = gameTheme?.chipColor || gameTheme?.primary || '#FFFFFF';
  return (
    <View style={styles.container}>
      {/* ZERO */}
      <NumberCell
        number={0}
        betAmount={getBetOnPosition('S0')}
        onPress={() => onPlaceBet('S0')}
        onLongPress={() => onRemoveBet('S0')}
        disabled={disabled}
        chipColor={chip}
      />

      {/* ------------------------------------------------------------------
          THE NUMBER GRID, ALL TWELVE ROWS OF IT

          THE DEFECT, reported as "the table has ended up small in the
          middle". This was a ScrollView capped at a fixed height - a scroller
          INSIDE the screen's scroller - holding twelve rows that need about
          four hundred points. So two thirds of the table was hidden behind a
          nested scroll gesture that fought the outer one, in the middle of a
          screen that already scrolls.

          A nested scroller is almost always a layout giving up. The outer one
          scrolls; this just lays the numbers out.
         ------------------------------------------------------------------ */}
      <View style={styles.gridContainer}>
        {ROULETTE_GRID.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((num) => (
              <NumberCell
                key={num}
                number={num}
                betAmount={getBetOnPosition(`S${num}` as BetType)}
                onPress={() => onPlaceBet(`S${num}` as BetType)}
                onLongPress={() => onRemoveBet(`S${num}` as BetType)}
                disabled={disabled}
                chipColor={chip}
              />
            ))}
          </View>
        ))}
      </View>

      {/* DOZEN BETS */}
      <View style={styles.dozenRow}>
        <AreaBetButton
          label={translateDozenBet('1st 12')}
          betType="1ST12"
          betAmount={getBetOnPosition('1ST12')}
          onPress={() => onPlaceBet('1ST12')}
          onLongPress={() => onRemoveBet('1ST12')}
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateDozenBet('2nd 12')}
          betType="2ND12"
          betAmount={getBetOnPosition('2ND12')}
          onPress={() => onPlaceBet('2ND12')}
          onLongPress={() => onRemoveBet('2ND12')}
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateDozenBet('3rd 12')}
          betType="3RD12"
          betAmount={getBetOnPosition('3RD12')}
          onPress={() => onPlaceBet('3RD12')}
          onLongPress={() => onRemoveBet('3RD12')}
          disabled={disabled}
          chipColor={chip}
        />
      </View>

      {/* AREA BETS (6-pack) */}
      <View style={styles.areaBetGrid}>
        <AreaBetButton
          label={translateOutsideBet('1-18')}
          betType="LOW"
          betAmount={getBetOnPosition('LOW')}
          onPress={() => onPlaceBet('LOW')}
          onLongPress={() => onRemoveBet('LOW')}
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateOutsideBet('EVEN')}
          betType="EVEN"
          betAmount={getBetOnPosition('EVEN')}
          onPress={() => onPlaceBet('EVEN')}
          onLongPress={() => onRemoveBet('EVEN')}
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateOutsideBet('◆ RED')}
          betType="RED"
          betAmount={getBetOnPosition('RED')}
          onPress={() => onPlaceBet('RED')}
          onLongPress={() => onRemoveBet('RED')}
          color="#FF6B6B"
          customBg="#881337"
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateOutsideBet('◆ BLACK')}
          betType="BLACK"
          betAmount={getBetOnPosition('BLACK')}
          onPress={() => onPlaceBet('BLACK')}
          onLongPress={() => onRemoveBet('BLACK')}
          color="#E2E8F0"
          customBg="#0F172A"
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateOutsideBet('ODD')}
          betType="ODD"
          betAmount={getBetOnPosition('ODD')}
          onPress={() => onPlaceBet('ODD')}
          onLongPress={() => onRemoveBet('ODD')}
          disabled={disabled}
          chipColor={chip}
        />
        <AreaBetButton
          label={translateOutsideBet('19-36')}
          betType="HIGH"
          betAmount={getBetOnPosition('HIGH')}
          onPress={() => onPlaceBet('HIGH')}
          onLongPress={() => onRemoveBet('HIGH')}
          disabled={disabled}
          chipColor={chip}
        />
      </View>
    </View>
  );
};

export default RouletteTable;

// ============================================================================
//  IT WAS A GRID OF BUTTONS, NOT A LAYOUT
// ============================================================================
//
//  Reported as "make the roulette table more attractive, it is bad right now".
//
//  Three things were wrong and none of them was the colours of the numbers.
//
//    THE CELLS WERE TINY AND FAR APART. 32 points tall with 2 point gaps, so
//    every cell floated on its own with a hairline outline. A roulette layout
//    is a PAINTED CLOTH: the numbers sit in a continuous grid divided by thin
//    white lines, not a scatter of rounded rectangles. Bigger cells, tighter
//    gaps, and the gap colour IS the line.
//
//    THERE WAS NO CLOTH. Nothing behind the numbers, so the whole thing read
//    as controls on a dark screen rather than a table you are standing at. It
//    has a felt and a rail now, and the felt is the same green the wheel uses.
//
//    THE CHIP MARKER WAS A GOLD BOX, with a black outline, cornered outside
//    the cell it belonged to, in the one gold literal in the codebase. Chips
//    are round, they sit ON the number, and the colour that means "your money
//    is here" is the room's own chip colour.
// ============================================================================

/** The line between two numbers, which is what the gap actually is. */
const RULE = 'rgba(255,255,255,0.22)';

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },

  // Grid
  gridContainer: {
    // The gap is the painted line, so it takes the line's colour and a
    // background behind it rather than being empty space.
    gap: 1.5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 1.5,
  },
  numberCell: {
    flex: 1,
    // 32 -> 38 when the nested scroller went, and 38 -> 42 when the dock was
    // put on a diet. Asked for as "stretch the roulette further down": the
    // table is the thing being played on, so it takes the room the chip rail
    // and the spin button gave up.
    height: 42,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: RULE,
  },
  zeroCell: {
    height: 38,
    borderRadius: 3,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cellPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  // ----------------------------------------------------------------------
  //  THE CHIP
  // ----------------------------------------------------------------------
  //  A round marker sitting ON the number, the way a chip does, rather than
  //  a gold tag pinned to the corner and hanging outside the cell.
  // ----------------------------------------------------------------------
  chipIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  areaChipIndicator: {
    bottom: 3,
    right: 3,
  },
  chipIndicatorText: {
    fontSize: 8.5,
    fontWeight: '900',
    // DARK ON A LIGHT CHIP. The chip takes the room's colour, and every room
    // colour is a light fill; measured in slotCabinet.test.ts.
    color: '#000000',
  },

  // Dozen row
  dozenRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },

  // Area bets
  areaBetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  areaBetBtn: {
    flexBasis: '32%',
    flexGrow: 1,
    height: 38,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: RULE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  areaBetText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
