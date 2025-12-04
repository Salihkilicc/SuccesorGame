import React, {useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../store';
import {theme} from '../../theme';

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
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  qtyButtonPressed: {
    backgroundColor: theme.colors.card,
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  helper: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  buttonPressed: {
    transform: [{scale: 0.98}],
  },
  sellButton: {
    backgroundColor: theme.colors.danger,
  },
  buyButton: {
    backgroundColor: theme.colors.success,
  },
  sellText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  buyText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
