import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

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
      <Text style={styles.title}>Market Overview</Text>
      <Text style={styles.tag}>Live</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Market Trend</Text>
      <Text style={styles.value}>{trend}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Volatility</Text>
      <Text style={styles.value}>{volatility}</Text>
    </View>
  </View>
);

export default MarketOverview;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#E6ECF7',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tag: {
    backgroundColor: '#1B2340',
    color: '#A3AEC2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#9AA7BC',
    fontSize: 13,
  },
  value: {
    color: '#E6ECF7',
    fontSize: 14,
    fontWeight: '700',
  },
});
