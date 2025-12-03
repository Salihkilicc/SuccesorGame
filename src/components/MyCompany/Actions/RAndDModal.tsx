import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../../store';

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
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 420,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  options: {
    gap: 10,
  },
  option: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionPressed: {
    backgroundColor: '#0b1220',
    transform: [{scale: 0.98}],
  },
  optionText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonPressed: {
    backgroundColor: '#d1d5db',
    transform: [{scale: 0.98}],
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});
