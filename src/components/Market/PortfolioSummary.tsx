import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import { formatMoney as formatMoneyExact } from '../../core/utils';

type Props = {
  totalInvested: number;
  returnPct: number;
  holdingsCount: number;
  onOpen: () => void;
};

const PortfolioSummary = ({ totalInvested, returnPct, holdingsCount, onOpen }: Props) => {
    useLocale();
  const isPositive = returnPct >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>{t('market.investedValue')}</Text>
          <Text style={styles.value}>{formatMoney(totalInvested)}</Text>
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>{t('market.return3Months')}</Text>
          <Text style={[styles.value, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
            {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
          </Text>
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.label}>{t('market.totalHoldings')}</Text>
          <Text style={styles.value}>{holdingsCount}</Text>
        </View>
      </View>

      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>{t('market.totalInvestments')}</Text>
        <Text style={styles.buttonArrow}>↗</Text>
      </Pressable>
    </View>
  );
};

export default PortfolioSummary;

// Paylasilan bicimlendiriciye devrediyor (core/utils).
// Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
// ayni deger farkli ekranlarda farkli gorunuyordu.
const formatMoney = (value: number) => formatMoneyExact(value);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  label: {
    color: '#A0A0A0',
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  value: {
    color: '#FFFFFF',
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  buttonArrow: {
    color: '#D4AF37',
    fontSize: theme.typography.subtitle,
  },
});
