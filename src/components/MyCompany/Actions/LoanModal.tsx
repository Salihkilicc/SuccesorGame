import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useStatsStore } from '../../../core/store';
import { checkAllAchievementsAfterStateChange } from '../../../achievements/checker';
import { theme } from '../../../core/theme';

export type LoanModalProps = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS = [5_000_000, 10_000_000, 20_000_000] as const;

const LoanModal = ({ visible, onClose }: LoanModalProps) => {
  const { money, companyDebt, setField } = useStatsStore();

  const handleLoan = (amount: number) => {
    setField('money', money + amount);
    setField('companyDebt', companyDebt + amount);
    console.log(`Loan taken: ${amount / 1_000_000}M (placeholder)`);
    checkAllAchievementsAfterStateChange();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Take Loan</Text>
          <Text style={styles.subtitle}>Kısa vadeli veya uzun vadeli kredi al.</Text>
          <View style={styles.options}>
            {OPTIONS.map(amount => (
              <Pressable
                key={amount}
                onPress={() => handleLoan(amount)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={styles.optionText}>+{amount / 1_000_000}M Loan</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default LoanModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 420,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
  options: {
    gap: theme.spacing.sm,
  },
  option: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  optionPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  optionText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  closeButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.98 }],
  },
  closeText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
});
