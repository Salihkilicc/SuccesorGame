import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type Props = {
  symbol: string;
  price: number;
  change: number;
  category?: string;
  risk?: 'Low' | 'Medium' | 'High' | string;
  volatility?: 'Low' | 'Medium' | 'High' | string;
  marketCap?: number;
};

const formatCompactNumber = (num: number) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toString();
};

const StockDetailHeader = ({
  symbol,
  price,
  change,
  category = 'Tech',
  risk = 'Low',
  volatility,
  marketCap,
}: Props) => {
  const changePositive = change >= 0;
  const changeText = `${changePositive ? '+' : ''}${change.toFixed(1)}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.symbol}>{symbol}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{category}</Text>
        </View>
      </View>
      <Text style={styles.price}>${price.toFixed(2)}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.change, changePositive ? styles.up : styles.down]}>
          {changeText}
        </Text>
        <Text style={styles.meta}>Risk: {risk}</Text>
        {volatility && <Text style={styles.meta}>Vol: {volatility}</Text>}
        {marketCap && (
          <Text style={[styles.meta, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
            Cap: ${formatCompactNumber(marketCap)}
          </Text>
        )}
      </View>
      <View style={styles.divider} />
    </View>
  );
};

export default StockDetailHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symbol: {
    fontSize: theme.typography.title - 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  chip: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  price: {
    fontSize: theme.typography.subtitle + 6,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  change: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  up: {
    color: theme.colors.success,
  },
  down: {
    color: theme.colors.danger,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  meta: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
});
