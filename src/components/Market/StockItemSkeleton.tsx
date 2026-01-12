import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

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
    if (r.includes('medium')) return theme.colors.warning || '#FFA500'; // Orange
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
        <Text style={styles.price}>${price.toLocaleString()}</Text>
        <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
};

export default StockItemSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
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
    color: theme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  riskTag: {
    backgroundColor: theme.colors.danger,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  price: {
    fontSize: theme.typography.subtitle,
    color: theme.colors.textPrimary,
    fontWeight: '700',
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
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textMuted,
  },
});
