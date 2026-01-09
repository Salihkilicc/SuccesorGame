import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import MatchCandidateCard from './MatchCandidateCard';
import { theme } from '../../core/theme';
import type { MatchCandidate } from './useMatchSystem';

type MatchPopupProps = {
  visible: boolean;
  candidate: MatchCandidate;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
};

const { width } = Dimensions.get('window');

const MatchPopup = ({
  visible,
  candidate,
  onAccept,
  onReject,
  onClose,
}: MatchPopupProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.header}>New Match Opportunity</Text>
        <MatchCandidateCard candidate={candidate} />
        <View style={styles.actions}>
          <Pressable
            onPress={onReject}
            style={({ pressed }) => [
              styles.button,
              styles.skipButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>✖ Skip</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [
              styles.button,
              styles.matchButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.matchButtonText}>✔ Match</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

export default MatchPopup;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: Math.min(420, width - 32),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  header: {
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  skipButton: {
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  matchButton: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  matchButtonText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
