import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { theme } from '../../core/theme';

type StatPillProps = {
  label: string;
  value: number;
  color: string;
};

type BottomStatsBarProps = {
  onHomePress?: () => void;
};

const StatPill = ({ label, value, color }: StatPillProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.pill}>
      <View style={styles.pillHeader}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{clamped}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const BottomStatsBar = ({ onHomePress }: BottomStatsBarProps) => {
  const { core, attributes } = usePlayerStore();
  const { health, stress } = core;
  const charisma = attributes.charm;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={onHomePress}
          style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}>
          <Text style={styles.homeIcon}>🏠</Text>
        </Pressable>
        <StatPill label="Health" value={health} color={theme.colors.success} />
        <StatPill label="Stress" value={stress} color={theme.colors.danger} />
        <StatPill label="Charisma" value={charisma} color={theme.colors.accent} />
      </View>
    </View>
  );
};

export default BottomStatsBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pill: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardSoft,
  },
  homeButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.97 }],
  },
  homeIcon: {
    fontSize: 20,
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  pillValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.cardSoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
