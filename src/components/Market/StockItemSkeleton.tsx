import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { formatPrice } from '../../core/utils';

type StockItemSkeletonProps = {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  meta?: string;
  riskTag?: string;
};

const StockItemSkeleton = ({
  symbol,
  name,
  price,
  change,
  meta,
  riskTag,
}: StockItemSkeletonProps) => {
  const changeColor = change >= 0 ? styles.changeUp : styles.changeDown;
  const formattedChange = `${change >= 0 ? '+' : ''}${change}%`;

  const getRiskColor = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.includes('low')) return theme.colors.success; // Green
    if (r.includes('medium')) return theme.colors.warning || '#C734CA'; // Orange
    if (r.includes('high') || r.includes('extreme')) return theme.colors.danger; // Red
    return theme.colors.textSecondary;
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{symbol}</Text>
          {name ? <Text style={styles.name}>{name}</Text> : null}
        </View>
        {riskTag ? (
          <Text style={[styles.riskTag, { backgroundColor: getRiskColor(riskTag) }]}>
            {riskTag}
          </Text>
        ) : null}
      </View>
      <View style={styles.row}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
};

export default StockItemSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  symbol: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: theme.typography.caption + 1,
    color: 'rgba(255,255,255,0.48)',
    marginTop: 2,
  },
  riskTag: {
    color: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  price: {
    fontSize: theme.typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  change: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  changeUp: {
    color: '#7B68D7',
  },
  changeDown: {
    color: '#C734CA',
  },
  meta: {
    fontSize: theme.typography.caption + 1,
    color: 'rgba(255,255,255,0.48)',
  },
});
