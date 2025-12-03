import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

type StockItemSkeletonProps = {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  meta?: string;
  riskTag?: string;
};

const StockItemSkeleton = ({
  symbol,
  name,
  price,
  change,
  meta,
  riskTag,
}: StockItemSkeletonProps) => {
  const changeColor = change >= 0 ? styles.changeUp : styles.changeDown;
  const formattedChange = `${change >= 0 ? '+' : ''}${change}%`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{flex: 1}}>
          <Text style={styles.symbol}>{symbol}</Text>
          {name ? <Text style={styles.name}>{name}</Text> : null}
        </View>
        {riskTag ? <Text style={styles.riskTag}>{riskTag}</Text> : null}
      </View>
      <View style={styles.row}>
        <Text style={styles.price}>${price.toLocaleString()}</Text>
        <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
};

export default StockItemSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C0F1A',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E6ECF7',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 12,
    color: '#9AA7BC',
    marginTop: 2,
  },
  riskTag: {
    backgroundColor: '#2B0F17',
    color: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#5C1E2E',
  },
  price: {
    fontSize: 15,
    color: '#D8DEEC',
    fontWeight: '600',
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
  meta: {
    fontSize: 12,
    color: '#A3AEC2',
  },
});
