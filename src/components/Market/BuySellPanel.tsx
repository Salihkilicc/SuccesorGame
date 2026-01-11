import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStatsStore, useMarketStore } from '../../core/store';
import { theme } from '../../core/theme';

type BuySellPanelProps = {
  symbol: string;
  price: number;
  category?: string; // Passed from StockDetail
};

const BuySellPanel = ({ symbol, price, category }: BuySellPanelProps) => {
  const { money } = useStatsStore();
  const { buyAsset, sellAsset, holdings } = useMarketStore();
  const [qty, setQty] = useState<number>(1);

  // Determine asset type
  const assetType = category === 'Crypto' ? 'crypto' : 'stock'; // Default/Fallback to stock

  // Get current owned quantity for "Sell" validation
  const heldItem = holdings.find((h) => h.symbol === symbol);
  const ownedQty = heldItem ? heldItem.quantity : 0;

  const adjustQty = (delta: number) => {
    setQty(current => Math.max(1, current + delta));
  };

  const handleBuy = () => {
    const cost = qty * price;
    if (money < cost) {
      // Could show alert, but console warn is consistent with store logic
      console.warn('UI: Not enough money');
      return;
    }
    // Call store action
    buyAsset(symbol, price, qty, assetType);
    setQty(1); // Reset qty after trade
  };

  const handleSell = () => {
    if (ownedQty < qty) {
      console.warn(`UI: Cannot sell ${qty}, only have ${ownedQty}`);
      return;
    }
    sellAsset(symbol, qty, price);
    setQty(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trade</Text>

      {/* Owned Indicator */}
      {ownedQty > 0 && (
        <Text style={styles.ownedText}>You own: {ownedQty.toFixed(2)} units</Text>
      )}

      <View style={styles.qtyRow}>
        <Pressable
          onPress={() => adjustQty(-1)}
          style={({ pressed }) => [
            styles.qtyButton,
            pressed && styles.qtyButtonPressed,
          ]}>
          <Text style={styles.qtyButtonText}>-</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{qty}</Text>
        <Pressable
          onPress={() => adjustQty(1)}
          style={({ pressed }) => [
            styles.qtyButton,
            pressed && styles.qtyButtonPressed,
          ]}>
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>
        Est. cost: ${(qty * price).toLocaleString()} • Balance: ${money.toLocaleString()}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={handleSell}
          // Disable sell if we don't own enough
          disabled={ownedQty < qty}
          style={({ pressed }) => [
            styles.button,
            styles.sellButton,
            (ownedQty < qty) && styles.disabledButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.sellText}>SELL</Text>
        </Pressable>
        <Pressable
          onPress={handleBuy}
          style={({ pressed }) => [
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
  ownedText: {
    fontSize: theme.typography.caption,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: -8, // Pull closer to title
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
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.5,
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
