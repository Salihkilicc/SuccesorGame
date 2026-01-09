import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';

const NEWS_ITEMS = [
  'Markets rally on tech optimism.',
  'Crypto volatility spikes.',
  'Government bonds stabilize after rate decision.',
  'Energy stocks slide as oil cools.',
  'Healthcare outperforms on defensive buying.',
  'AI chip demand continues to surprise.',
  'Investors weigh currency swings in emerging markets.',
];

const FinancialNewsButton = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={styles.title}>Financial News</Text>
          <Text style={styles.subtitle}>Daily pulse of the global markets.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Financial News</Text>
              <Pressable
                onPress={() => setVisible(false)}
                style={({ pressed }) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
                <Text style={styles.closeCircleText}>×</Text>
              </Pressable>
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              {NEWS_ITEMS.map(item => (
                <Text key={item} style={styles.newsItem}>
                  • {item}
                </Text>
              ))}
            </View>
            <Pressable
              onPress={() => setVisible(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default FinancialNewsButton;

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
    transform: [{ scale: 0.98 }],
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
  newsItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
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
    transform: [{ scale: 0.98 }],
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
});
