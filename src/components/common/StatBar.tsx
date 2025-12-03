import React from 'react';
import {StyleSheet, Text, View, StyleProp, ViewStyle} from 'react-native';
import {useStatsStore} from 'src/store/useStatsStore';

type StatBarProps = {
  style?: StyleProp<ViewStyle>;
};

type StatItemProps = {
  icon: string;
  label: string;
  value: string;
  accent?: string;
};

const formatMoney = (value: number) => {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }

  if (absolute >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }

  return value.toLocaleString();
};

const StatItem = ({icon, label, value, accent}: StatItemProps) => (
  <View style={styles.item}>
    <Text style={styles.icon}>{icon}</Text>
    <View style={styles.textGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? {color: accent} : null]}>{value}</Text>
    </View>
  </View>
);

const StatBar = ({style}: StatBarProps) => {
  const {money, health, stress, charisma} = useStatsStore();

  return (
    <View style={[styles.container, style]}>
      <StatItem icon="💰" label="Para" value={formatMoney(money)} accent="#f2c94c" />
      <StatItem icon="❤️" label="Sağlık" value={`${health}%`} accent="#34d399" />
      <StatItem icon="😖" label="Stres" value={`${stress}%`} accent="#f87171" />
      <StatItem icon="⭐" label="Karizma" value={`${charisma}%`} accent="#60a5fa" />
    </View>
  );
};

export default StatBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#05060A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#11131a',
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
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
});
