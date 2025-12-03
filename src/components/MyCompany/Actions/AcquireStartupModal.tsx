import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../../store';
import {useEventStore} from '../../../store';

export type AcquireStartupModalProps = {
  visible: boolean;
  onClose: () => void;
};

const STARTUPS = [
  {name: 'NanoAI', cost: 4_200_000},
  {name: 'GreenMed', cost: 2_100_000},
  {name: 'PictoApps', cost: 3_800_000},
] as const;

const AcquireStartupModal = ({visible, onClose}: AcquireStartupModalProps) => {
  const {money, setField} = useStatsStore();
  const {setLastCompanyEvent} = useEventStore();

  const handleAcquire = (name: string, cost: number) => {
    if (money < cost) {
      console.log('Not enough money');
      return;
    }
    setField('money', money - cost);
    console.log(`Acquired ${name} (placeholder)`);
    setLastCompanyEvent(`Acquired ${name} (placeholder)`);
    // TODO: add company to portfolio list later
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Acquire Startup</Text>
          <Text style={styles.subtitle}>Portföyüne yeni bir startup ekle.</Text>
          <View style={styles.options}>
            {STARTUPS.map(item => (
              <Pressable
                key={item.name}
                onPress={() => handleAcquire(item.name, item.cost)}
                style={({pressed}) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={styles.optionText}>
                  {item.name} – ${item.cost / 1_000_000}M
                </Text>
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

export default AcquireStartupModal;

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
