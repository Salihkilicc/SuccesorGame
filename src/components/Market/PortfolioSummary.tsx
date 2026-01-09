import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';

type Props = {
  totalInvested: number;
  returnPct: number;
  holdingsCount: number;
  onOpen: () => void;
};

const PortfolioSummary = ({ totalInvested, returnPct, holdingsCount, onOpen }: Props) => {
  const isPositive = returnPct >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>Invested Value</Text>
          <Text style={styles.value}>{formatMoney(totalInvested)}</Text>
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>Return (3 Months)</Text>
          <Text style={[styles.value, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
            {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
          </Text>
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>Total Holdings</Text>
          <Text style={styles.value}>{holdingsCount}</Text>
        </View>
      </View>

      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>TOTAL INVESTMENTS</Text>
        <Text style={styles.buttonArrow}>↗</Text>
      </Pressable>
    </View>
  );
};

export default PortfolioSummary;

const formatMoney = (value: number) => {
  if (!value) return '$0';
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  buttonArrow: {
    color: theme.colors.accent,
    fontSize: theme.typography.subtitle,
  },
});
