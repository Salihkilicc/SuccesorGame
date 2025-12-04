import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../../store';
import {useEventStore} from '../../../store';
import {checkAllAchievementsAfterStateChange} from '../../../achievements/checker';
import {theme} from '../../../theme';

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
    checkAllAchievementsAfterStateChange();
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
