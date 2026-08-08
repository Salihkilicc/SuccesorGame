import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { formatMoney } from '../../core/utils';

type StockInfoSectionProps = {
  description?: string;
  targetPrice?: number; // Optional
  valuation?: number;
};

const StockInfoSection = ({ description, targetPrice = 165, valuation }: StockInfoSectionProps) => {
    useLocale();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('market.stockInfo')}</Text>
      <Text style={styles.row}>🎯 Target Price: ${targetPrice}</Text>
      {valuation !== undefined && (
        <Text style={styles.row}>Company Valuation: {formatMoney(valuation)}</Text>
      )}
      <Text style={styles.row}>
        {description || "Company Bio: Rising player in its sector with strong fundamentals."}
      </Text>
      <View style={styles.sentimentChip}>
        <Text style={styles.sentimentText}>{t('market.marketSentimentMildlyPositive')}</Text>
      </View>
    </View>
  );
};

export default StockInfoSection;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    letterSpacing: 0.5,
  },
  row: {
    fontSize: theme.typography.body,
    color: 'rgba(255,255,255,0.48)',
    lineHeight: 20,
  },
  expertCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: theme.spacing.sm,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  expertText: {
    color: '#FFFFFF',
    fontSize: theme.typography.body,
    fontWeight: '600',
    flex: 1,
  },
  lockedText: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  sentimentChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(5,168,246,0.10)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(5,168,246,0.3)',
  },
  sentimentText: {
    color: '#FF8A8A',
    fontSize: theme.typography.caption + 1,
  },
});
