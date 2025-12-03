import React, {useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../store';

type BuySellPanelProps = {
  symbol: string;
  price: number;
};

const BuySellPanel = ({symbol, price}: BuySellPanelProps) => {
  const {money, setField} = useStatsStore();
  const [qty, setQty] = useState<number>(1);

  const adjustQty = (delta: number) => {
    setQty(current => Math.max(1, current + delta));
  };

  const handleBuy = () => {
    const cost = qty * price;
    if (money < cost) {
      console.log('Not enough money to buy', {symbol, qty});
      return;
    }
    setField('money', money - cost);
    console.log(`Bought ${qty} of ${symbol}`);
  };

  const handleSell = () => {
    console.log(`Sold ${qty} of ${symbol} (placeholder portfolio update)`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trade</Text>
      <View style={styles.qtyRow}>
        <Pressable
          onPress={() => adjustQty(-1)}
          style={({pressed}) => [
            styles.qtyButton,
            pressed && styles.qtyButtonPressed,
          ]}>
          <Text style={styles.qtyButtonText}>-</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{qty}</Text>
        <Pressable
          onPress={() => adjustQty(1)}
          style={({pressed}) => [
            styles.qtyButton,
            pressed && styles.qtyButtonPressed,
          ]}>
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>
        Est. cost: ${(qty * price).toFixed(2)} • Balance: ${money.toLocaleString()}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={handleSell}
          style={({pressed}) => [
            styles.button,
            styles.sellButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.sellText}>SELL</Text>
        </Pressable>
        <Pressable
          onPress={handleBuy}
          style={({pressed}) => [
            styles.button,
            styles.buyButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.buyText}>BUY</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BuySellPanel;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonPressed: {
    backgroundColor: '#d1d5db',
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center',
  },
  helper: {
    fontSize: 13,
    color: '#4b5563',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    transform: [{scale: 0.98}],
  },
  sellButton: {
    backgroundColor: '#fee2e2',
  },
  buyButton: {
    backgroundColor: '#16a34a',
  },
  sellText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b91c1c',
  },
  buyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f9fafb',
  },
});
