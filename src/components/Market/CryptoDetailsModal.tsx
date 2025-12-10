import React, {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {theme} from '../../theme';
import type {CryptoAsset} from './marketTypes';

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
  asset?: CryptoAsset | null;
  onClose: () => void;
  onBuy: (asset: CryptoAsset, amount: number) => void;
};

const CryptoDetailsModal = ({visible, asset, onClose, onBuy}: Props) => {
  const [amount, setAmount] = useState('5000');

  if (!asset) return null;

  const numericAmount = Number(amount) || 0;
  const adjusted = adjustedChange(asset.change, asset.marketCap);
  const changeText = `${adjusted >= 0 ? '+' : ''}${adjusted}%`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{asset.name}</Text>
            <Pressable
              onPress={onClose}
              style={({pressed}) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.meta}>Current Cost: {formatMoney(asset.cost)}</Text>
            <Text style={styles.meta}>Market Cap: {formatCap(asset.marketCap)}</Text>
            <Text style={styles.meta}>Risk: {asset.risk}</Text>
            <Text style={styles.meta}>Trend: {asset.trend}</Text>
            <Text style={styles.meta}>3-Month Change: {changeText}</Text>
            <Text style={styles.meta}>
              High trend: coin has strong momentum. Low trend: momentum cooling.
            </Text>
          </View>

          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.inputLabel}>Buy Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="$0"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={() => {
              onBuy(asset, numericAmount);
              setAmount('');
            }}
            style={({pressed}) => [styles.buyButton, pressed && styles.buyButtonPressed]}>
            <Text style={styles.buyText}>Buy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default CryptoDetailsModal;

const formatMoney = (value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`;

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
    maxWidth: 500,
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
    transform: [{scale: 0.98}],
  },
  buyText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
});
