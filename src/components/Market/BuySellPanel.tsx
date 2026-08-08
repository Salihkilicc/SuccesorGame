import React, { useState } from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useStatsStore, useMarketStore } from '../../core/store';
import { theme } from '../../core/theme';
import { formatMoney } from '../../core/utils';

type BuySellPanelProps = {
  symbol: string;
  price: number;
  category?: string; // Passed from StockDetail
};

const BuySellPanel = ({ symbol, price, category }: BuySellPanelProps) => {
    useLocale();
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
      <Text style={styles.title}>{t('market.trade')}</Text>

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
        <TextInput
          style={styles.qtyValue}
          value={String(qty)}
          onChangeText={(text) => {
            const parsed = parseInt(text, 10);
            setQty(isNaN(parsed) || parsed < 1 ? 1 : parsed);
          }}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
        />
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
        Est. cost: {formatMoney(qty * price)} • Balance: {formatMoney(money)}
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
          <Text style={styles.sellText}>{t('market.sell')}</Text>
        </Pressable>
        <Pressable
          onPress={handleBuy}
          style={({ pressed }) => [
            styles.button,
            styles.buyButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.buyText}>{t('market.buy2')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BuySellPanel;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ownedText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: -8,
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qtyButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 32,
    textAlign: 'center',
  },
  helper: {
    fontSize: theme.typography.caption + 1,
    color: 'rgba(255,255,255,0.48)',
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
    opacity: 0.4,
  },
  sellButton: {
    backgroundColor: '#434B50',
  },
  buyButton: {
    backgroundColor: '#CFD0D2',
  },
  sellText: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  buyText: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.onLight,
  },
});
