import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { useStatsStore } from '../../core/store/useStatsStore';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { theme } from '../../core/theme';
import { formatNumber } from '../../core/utils';

type StatBarProps = {
  style?: StyleProp<ViewStyle>;
};

type StatItemProps = {
  icon: string;
  label: string;
  value: string;
  accent?: string;
};

// Paylasilan bicimlendiriciye devrediyor (core/utils).
// Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
// ayni deger farkli ekranlarda farkli gorunuyordu.
const formatMoney = (value: number) => {
  return formatNumber(value);
};

const StatItem = ({ icon, label, value, accent }: StatItemProps) => (
  <View style={styles.item}>
    <Text style={styles.icon}>{icon}</Text>
    <View style={styles.textGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  </View>
);

const StatBar = ({ style }: StatBarProps) => {
  const { money } = useStatsStore();
  const { core, attributes } = usePlayerStore();
  const { health, stress } = core;
  const charisma = attributes.charm;

  return (
    <View style={[styles.container, style]}>
      <StatItem icon="💰" label="Para" value={formatMoney(money)} accent={theme.colors.accent} />
      <StatItem icon="❤️" label="Sağlık" value={`${health}%`} accent={theme.colors.success} />
      <StatItem icon="😖" label="Stres" value={`${stress}%`} accent={theme.colors.danger} />
      <StatItem icon="⭐" label="Karizma" value={`${charisma}%`} accent={theme.colors.accent} />
    </View>
  );
};

export default StatBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  icon: {
    fontSize: 18,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
});
