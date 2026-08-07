// @orphan-ok superseded by features/assets/screens/FinancialReportScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { useStatsStore } from '../../core/store';
import { formatMoney } from '../../core/utils';

// Paylasilan bicimlendiriciye devrediyor (core/utils).
// Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
// ayni deger farkli ekranlarda farkli gorunuyordu.
const formatLargeMoney = (value: number) => formatMoney(value);

const FinancialSummary = () => {
    useLocale();
  const { companyDebt, companyOwnership } = useStatsStore();

  const rows = [
    { label: t('ui.dailyRevenue'), value: '$650K' },
    { label: t('ui.dailyExpenses'), value: '$220K' },
    { label: t('ui.dailyProfit'), value: '$430K' },
    { label: t('ui.debt'), value: formatLargeMoney(companyDebt) },
    { label: t('ui.ownership'), value: `${companyOwnership}%` },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('ui.financialSummary')}</Text>
      <View style={styles.list}>
        {rows.map(row => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default FinancialSummary;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0E0D', // Dark Gray - HARDCODED
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333', // Subtle border - HARDCODED
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EDE8E4', // White - HARDCODED
    letterSpacing: 0.3,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: '#8A807B', // Gray labels - HARDCODED
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EDE8E4', // White values - HARDCODED
  },
});
