import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '../../core/store';
import { theme } from '../../core/theme';

export type CompanyHeaderProps = {
  companyName?: string;
  valuation: number;
  sharePrice: number;
  dailyChange: number;
  ownership: number;
  debt: number;
};

const formatLargeMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }
  if (absolute >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (absolute >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return `$${value.toLocaleString()}`;
};

const formatShortMoney = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const CompanyHeader = ({
  companyName = 'Rich Industries',
  valuation,
  sharePrice,
  dailyChange,
  ownership,
  debt,
}: CompanyHeaderProps) => {
  const { name } = useUserStore();
  const changeColor = dailyChange >= 0 ? styles.changeUp : styles.changeDown;
  const formattedChange = `${dailyChange >= 0 ? '+' : ''}${dailyChange}%`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>CEO: {name}</Text>
          <Text style={styles.subtitle}>Ownership: {ownership}%</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.metricLabel}>Company Value</Text>
          <Text style={styles.metricValue}>${formatShortMoney(valuation)}</Text>
          <Text style={styles.meta}>Share Price: ${sharePrice.toFixed(2)}</Text>
          <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
          <Text style={[styles.meta, styles.debt]}>Debt: ${formatShortMoney(debt)}</Text>
        </View>
      </View>
    </View>
  );
};

export default CompanyHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    marginTop: theme.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 4,
    fontWeight: '800',
  },
  change: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  changeUp: {
    color: theme.colors.success,
  },
  changeDown: {
    color: theme.colors.danger,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  debt: {
    color: theme.colors.danger,
  },
});
