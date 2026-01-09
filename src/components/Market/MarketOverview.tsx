import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type MarketOverviewProps = {
  trend?: 'Bullish' | 'Bearish' | 'Neutral';
  volatility?: 'Low' | 'Medium' | 'High';
};

const MarketOverview = ({
  trend = 'Bullish',
  volatility = 'Medium',
}: MarketOverviewProps) => (
  <View style={styles.container}>
    <View style={styles.headerRow}>
      <Text style={styles.icon}>📊</Text>
      <Text style={styles.title}>Market Overview</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Trend</Text>
      <Text
        style={[
          styles.value,
          trend === 'Bullish' ? styles.positive : trend === 'Bearish' ? styles.negative : null,
        ]}>
        {trend}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Volatility</Text>
      <Text
        style={[
          styles.value,
          volatility === 'High'
            ? styles.negative
            : volatility === 'Medium'
              ? styles.warning
              : null,
        ]}>
        {volatility}
      </Text>
    </View>
    <Text style={styles.helper}>All data is fictional & simulated.</Text>
  </View>
);

export default MarketOverview;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  positive: { color: theme.colors.success },
  negative: { color: theme.colors.danger },
  warning: { color: theme.colors.warning },
  helper: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
});
