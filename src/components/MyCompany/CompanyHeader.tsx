import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useUserStore} from '../../store';

export type CompanyHeaderProps = {
  companyName?: string;
  valuation: number;
  sharePrice: number;
  dailyChange: number;
  ownership: number;
  debt: number;
};

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

const CompanyHeader = ({
  companyName = 'Rich Industries',
  valuation,
  sharePrice,
  dailyChange,
  ownership,
  debt,
}: CompanyHeaderProps) => {
  const {name} = useUserStore();
  const changeColor = dailyChange >= 0 ? styles.changeUp : styles.changeDown;
  const formattedChange = `${dailyChange >= 0 ? '+' : ''}${dailyChange}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={{flex: 1}}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>CEO: {name}</Text>
        </View>
        <Text style={styles.badge}>HQ</Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Valuation</Text>
          <Text style={styles.metricValue}>{formatLargeMoney(valuation)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Share Price</Text>
          <Text style={styles.metricValue}>${sharePrice.toFixed(2)}</Text>
          <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Ownership: {ownership}%</Text>
        <Text style={styles.footerText}>Debt: {formatLargeMoney(debt)}</Text>
      </View>
    </View>
  );
};

export default CompanyHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0F1A',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#E8EDF5',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#A3AEC2',
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#1B2340',
    color: '#E6ECF7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    fontWeight: '800',
    fontSize: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
    backgroundColor: '#0F1424',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
  },
  metricLabel: {
    color: '#9AA7BC',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#E6ECF7',
    fontSize: 18,
    fontWeight: '800',
  },
  change: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeUp: {
    color: '#34D399',
  },
  changeDown: {
    color: '#F87171',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#A3AEC2',
    fontSize: 12,
  },
});
