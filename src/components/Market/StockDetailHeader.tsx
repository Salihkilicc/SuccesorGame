// @orphan-ok superseded by features/assets/screens/StockDetailScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { formatPrice, formatNumber } from '../../core/utils';

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
  return formatNumber(num);
  // eslint-disable-next-line no-unreachable
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
      <Text style={styles.price}>{formatPrice(price)}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symbol: {
    fontSize: theme.typography.title - 2,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chip: {
    backgroundColor: 'rgba(199,52,202,0.12)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(199,52,202,0.4)',
  },
  chipText: {
    color: '#C734CA',
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  price: {
    fontSize: theme.typography.subtitle + 6,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  change: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  up: {
    color: '#7B68D7',
  },
  down: {
    color: '#C734CA',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  meta: {
    fontSize: theme.typography.caption + 1,
    color: 'rgba(255,255,255,0.48)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: theme.spacing.sm,
  },
});
