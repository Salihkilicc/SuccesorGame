import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type MarketOverviewProps = {
  trend?: 'Bullish' | 'Bearish' | 'Neutral';
  volatility?: 'Low' | 'Medium' | 'High';
};

const MarketOverview = ({
  trend = 'Bullish',
  volatility = 'Medium',
}: MarketOverviewProps) => {
    useLocale();
    return (
  <View style={styles.container}>
    <View style={styles.headerRow}>
      <Text style={styles.icon}>📊</Text>
      <Text style={styles.title}>{t('market.marketOverview')}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>{t('market.trend')}</Text>
      <Text
        style={[
          styles.value,
          trend === 'Bullish' ? styles.positive : trend === 'Bearish' ? styles.negative : null,
        ]}>
        {trend}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>{t('market.volatility')}</Text>
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
    <Text style={styles.helper}>{t('market.allDataIsFictionalSimulated')}</Text>
  </View>
    );
};

export default MarketOverview;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: '#FFFFFF',
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: theme.typography.caption + 1,
  },
  value: {
    color: '#FFFFFF',
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  positive: { color: '#5992C6' },
  negative: { color: '#E9B8C9' },
  warning: { color: '#E9B8C9' },
  helper: {
    color: 'rgba(160,160,160,0.6)',
    fontSize: theme.typography.caption,
  },
});
