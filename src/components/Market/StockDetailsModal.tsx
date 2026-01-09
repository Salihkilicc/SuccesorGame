import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../core/theme';
import type { StockItem } from './marketTypes';

const capSlowdown = (marketCap: number) => {
  if (marketCap >= 400) return 0.35;
  if (marketCap >= 250) return 0.45;
  if (marketCap >= 150) return 0.6;
  if (marketCap >= 80) return 0.75;
  if (marketCap >= 30) return 0.9;
  return 1;
};

const adjustedChange = (baseChange: number, marketCap: number) =>
  Number((baseChange * capSlowdown(marketCap)).toFixed(1));

const formatCap = (marketCap: number) => `$${marketCap.toLocaleString()}B`;

type Props = {
  visible: boolean;
  stock?: StockItem | null;
  onClose: () => void;
  onBuy: (stock: StockItem, shares: number) => void;
};

const StockDetailsModal = ({ visible, stock, onClose, onBuy }: Props) => {
  const [shares, setShares] = useState('10');

  if (!stock) return null;

  const numericShares = Number(shares) || 0;
  const dailyAdjusted = adjustedChange(stock.dailyChange, stock.marketCap);
  const dailyColor = dailyAdjusted >= 0 ? theme.colors.success : theme.colors.danger;
  const yearlyColor = stock.yearlyChange >= 0 ? theme.colors.success : theme.colors.danger;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{stock.company}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.meta}>Symbol: {stock.symbol}</Text>
            <Text style={styles.meta}>Sector: {stock.sector}</Text>
            <Text style={styles.meta}>Market Cap: {formatCap(stock.marketCap)}</Text>
            <Text style={styles.meta}>Current Price: ${stock.price.toFixed(2)}</Text>
            <Text style={[styles.meta, { color: dailyColor }]}>
              Daily Change (size-adjusted): {dailyAdjusted}%
            </Text>
            <Text style={[styles.meta, { color: yearlyColor }]}>Yearly Change: {stock.yearlyChange}%</Text>
            <Text style={styles.meta}>Risk Level: {stock.risk}</Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.inputLabel}>How Many Shares?</Text>
            <TextInput
              value={shares}
              onChangeText={setShares}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={() => {
              onBuy(stock, numericShares);
              setShares('');
            }}
            style={({ pressed }) => [styles.buyButton, pressed && styles.buyButtonPressed]}>
            <Text style={styles.buyText}>Buy Shares</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default StockDetailsModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCirclePressed: {
    backgroundColor: theme.colors.card,
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  inputLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  input: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  buyButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  buyButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buyText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
});
