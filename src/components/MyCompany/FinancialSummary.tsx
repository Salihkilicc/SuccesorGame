import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStatsStore } from '../../core/store';

const formatLargeMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }
  if (absolute >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (absolute >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return `$${value.toLocaleString()}`;
};

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
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
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
    color: '#9AA7BC',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6ECF7',
  },
});
