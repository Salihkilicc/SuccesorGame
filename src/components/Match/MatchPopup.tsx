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
import type {MatchCandidate} from './useMatchSystem';

type MatchPopupProps = {
  visible: boolean;
  candidate: MatchCandidate;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
};

const {width} = Dimensions.get('window');

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
            style={({pressed}) => [
              styles.button,
              styles.skipButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>✖ Skip</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={({pressed}) => [
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
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: Math.min(420, width - 32),
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  header: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    transform: [{scale: 0.98}],
  },
  skipButton: {
    backgroundColor: '#e5e7eb',
  },
  matchButton: {
    backgroundColor: '#16a34a',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  matchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f9fafb',
  },
});
