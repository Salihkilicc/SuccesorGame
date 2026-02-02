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
    backgroundColor: '#1C1C1E', // Dark Gray
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#FFFFFF', // White
    fontSize: theme.typography.subtitle + 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#FFD700', // Gold for CEO name
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
    color: '#8E8E93', // Text Secondary
    fontSize: theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#30D158', // Green for valuation
    fontSize: theme.typography.subtitle + 4,
    fontWeight: '800',
  },
  change: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  changeUp: {
    color: '#30D158', // Green
  },
  changeDown: {
    color: '#FF453A', // Red
  },
  meta: {
    color: '#8E8E93',
    fontSize: theme.typography.caption + 1,
  },
  debt: {
    color: '#FF453A', // Red
  },
});
