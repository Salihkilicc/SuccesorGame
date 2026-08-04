import React, { useState } from 'react';
import { t, useLocale } from '../../core/i18n';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../core/theme';
import type { SimpleBondItem } from './marketTypes';
import { formatMoney as formatMoneyExact } from '../../core/utils';

type Props = {
  visible: boolean;
  bond?: SimpleBondItem | null;
  onClose: () => void;
  onBuy: (bond: SimpleBondItem, amount: number) => void;
};

const BondDetailsModal = ({ visible, bond, onClose, onBuy }: Props) => {
    useLocale();
  const [amount, setAmount] = useState('100000');

  if (!bond) return null;

  const numericAmount = Number(amount) || 0;
  const expectedGain = numericAmount * (bond.coupon / 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{bond.name}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.meta}>Years: {bond.years}y</Text>
            <Text style={styles.meta}>Coupon: {bond.coupon}%</Text>
            <Text style={styles.meta}>Risk: {bond.risk}</Text>
            <Text style={styles.meta}>
              Expected Annual Gain: {formatMoney(expectedGain)} (placeholder)
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.inputLabel}>{t('market.buyAmount')}</Text>
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
              onBuy(bond, numericAmount);
              setAmount('');
            }}
            style={({ pressed }) => [styles.buyButton, pressed && styles.buyButtonPressed]}>
            <Text style={styles.buyText}>{t('market.buy')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default BondDetailsModal;

const formatMoney = (value: number) => formatMoneyExact(Math.max(0, value));

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
    transform: [{ scale: 0.98 }],
  },
  buyText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
});
