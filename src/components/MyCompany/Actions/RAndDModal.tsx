import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../../store';
import {checkAllAchievementsAfterStateChange} from '../../../achievements/checker';
import {theme} from '../../../theme';

export type RAndDModalProps = {
  visible: boolean;
  onClose: () => void;
  onResult?: (success: boolean) => void;
};

const OPTIONS = [1_000_000, 5_000_000, 10_000_000] as const;

const RAndDModal = ({visible, onClose, onResult}: RAndDModalProps) => {
  const {money, setField} = useStatsStore();

  const handleInvest = (amount: number) => {
    if (money < amount) {
      console.log('Not enough money');
      return;
    }
    setField('money', money - amount);
    const success = Math.random() < 0.5;
    console.log(success ? 'R&D success (placeholder)' : 'R&D failed (placeholder)');
    onResult?.(success);
    checkAllAchievementsAfterStateChange();
    // TODO: triggerEvent('company') on success later
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>R&amp;D Investment</Text>
          <Text style={styles.subtitle}>Yeni teknoloji geliştirmek için yatırım yap.</Text>
          <View style={styles.options}>
            {OPTIONS.map(amount => (
              <Pressable
                key={amount}
                onPress={() => handleInvest(amount)}
                style={({pressed}) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={styles.optionText}>Invest ${amount / 1_000_000}M</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            style={({pressed}) => [
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

export default RAndDModal;

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
    transform: [{scale: 0.98}],
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
    transform: [{scale: 0.98}],
  },
  closeText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
});
