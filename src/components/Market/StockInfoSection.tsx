import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type StockInfoSectionProps = {
  description?: string;
  targetPrice?: number; // Optional
};

const StockInfoSection = ({ description, targetPrice = 165 }: StockInfoSectionProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Info</Text>
      <Text style={styles.row}>🎯 Target Price: ${targetPrice}</Text>
      <Text style={styles.row}>
        {description || "Company Bio: Rising player in its sector with strong fundamentals."}
      </Text>
      <View style={styles.sentimentChip}>
        <Text style={styles.sentimentText}>Market Sentiment: Mildly Positive</Text>
      </View>
    </View>
  );
};

export default StockInfoSection;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  row: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  expertCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  expertText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '600',
    flex: 1,
  },
  lockedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  sentimentChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sentimentText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
});
