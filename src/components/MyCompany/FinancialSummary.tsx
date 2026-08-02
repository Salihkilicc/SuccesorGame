import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStatsStore } from '../../core/store';
import { formatMoney } from '../../core/utils';

// Paylasilan bicimlendiriciye devrediyor (core/utils).
// Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
// ayni deger farkli ekranlarda farkli gorunuyordu.
const formatLargeMoney = (value: number) => formatMoney(value);

const FinancialSummary = () => {
  const { companyDebt, companyOwnership } = useStatsStore();

  const rows = [
    { label: 'Daily Revenue', value: '$650K' },
    { label: 'Daily Expenses', value: '$220K' },
    { label: 'Daily Profit', value: '$430K' },
    { label: 'Debt', value: formatLargeMoney(companyDebt) },
    { label: 'Ownership', value: `${companyOwnership}%` },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Summary</Text>
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
    backgroundColor: '#1C1C1E', // Dark Gray - HARDCODED
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333', // Subtle border - HARDCODED
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF', // White - HARDCODED
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
    color: '#8E8E93', // Gray labels - HARDCODED
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF', // White values - HARDCODED
  },
});
