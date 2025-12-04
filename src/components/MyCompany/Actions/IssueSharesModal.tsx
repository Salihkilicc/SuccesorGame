import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../../store';
import {checkAllAchievementsAfterStateChange} from '../../../achievements/checker';

export type IssueSharesModalProps = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS = [5, 10, 20] as const;

const IssueSharesModal = ({visible, onClose}: IssueSharesModalProps) => {
  const {companyOwnership, money, setField} = useStatsStore();

  const handleSell = (percent: number) => {
    if (companyOwnership - percent < 50) {
      console.log('Too risky to sell this much, placeholder restriction');
      return;
    }
    const cashGain = percent * 1_000_000;
    const newOwnership = companyOwnership - percent;
    setField('companyOwnership', newOwnership);
    setField('money', money + cashGain);
    console.log(
      `Issued ${percent}% new shares, ownership now ${newOwnership}% (placeholder)`,
    );
    checkAllAchievementsAfterStateChange();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Issue Shares (Sell % Ownership)</Text>
          <Text style={styles.subtitle}>
            Şirketinin bir kısmını satarak nakit elde et ama kontrolü azalt.
          </Text>
          <View style={styles.options}>
            {OPTIONS.map(option => (
              <Pressable
                key={option}
                onPress={() => handleSell(option)}
                style={({pressed}) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={styles.optionText}>Sell {option}%</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.warning}>
            Warning: ownership below 51% may trigger shareholder drama (placeholder).
          </Text>
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

export default IssueSharesModal;

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
  warning: {
    fontSize: 12,
    color: '#b45309',
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
