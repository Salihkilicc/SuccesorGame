import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

type Props = {
  symbol: string;
  price: number;
  change: number;
  category?: string;
  risk?: 'Low' | 'Medium' | 'High';
  volatility?: 'Low' | 'Medium' | 'High';
};

const StockDetailHeader = ({
  symbol,
  price,
  change,
  category = 'Tech - Low Risk',
  risk = 'Low',
  volatility = 'Low',
}: Props) => {
  const changePositive = change >= 0;
  const changeText = `${changePositive ? '+' : ''}${change.toFixed(1)}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={[styles.change, changePositive ? styles.up : styles.down]}>
          {changeText}
        </Text>
      </View>
      <Text style={styles.price}>${price.toFixed(2)}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{category}</Text>
        <Text style={styles.meta}>Risk: {risk}</Text>
        <Text style={styles.meta}>Volatility: {volatility}</Text>
      </View>
      <View style={styles.divider} />
    </View>
  );
};

export default StockDetailHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  change: {
    fontSize: 16,
    fontWeight: '700',
  },
  up: {
    color: '#16a34a',
  },
  down: {
    color: '#dc2626',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  meta: {
    fontSize: 13,
    color: '#4b5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 6,
  },
});
