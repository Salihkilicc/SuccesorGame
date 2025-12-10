import React, {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../theme';

const ADVISORS = [
  {name: 'Elite Advisor', fee: 50_000},
  {name: 'Senior Analyst', fee: 20_000},
  {name: 'Junior Advisor', fee: 5_000},
];

const FinancialAdvisorsButton = () => {
  const [visible, setVisible] = useState(false);

  const handleSelect = (advisor: (typeof ADVISORS)[number]) => {
    console.log(`Advice purchased from ${advisor.name}`);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
        <View style={{gap: theme.spacing.xs}}>
          <Text style={styles.title}>Financial Advisors</Text>
          <Text style={styles.subtitle}>Premium insights on demand.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Financial Advisors</Text>
              <Pressable
                onPress={() => setVisible(false)}
                style={({pressed}) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
                <Text style={styles.closeCircleText}>×</Text>
              </Pressable>
            </View>
            <View style={{gap: theme.spacing.sm}}>
              {ADVISORS.map(advisor => (
                <Pressable
                  key={advisor.name}
                  onPress={() => handleSelect(advisor)}
                  style={({pressed}) => [styles.advisorRow, pressed && styles.advisorPressed]}>
                  <View>
                    <Text style={styles.advisorName}>{advisor.name}</Text>
                    <Text style={styles.advisorFee}>Fee: ${advisor.fee.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setVisible(false)}
              style={({pressed}) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default FinancialAdvisorsButton;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.98}],
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 500,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeCirclePressed: {
    backgroundColor: theme.colors.card,
  },
  closeCircleText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  advisorPressed: {
    backgroundColor: theme.colors.card,
  },
  advisorName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  advisorFee: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  closeButton: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
});
