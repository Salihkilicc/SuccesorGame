import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {MatchCandidate} from './useMatchSystem';

type Props = {
  candidate: MatchCandidate;
};

const MatchCandidateCard = ({candidate}: Props) => (
  <View style={styles.card}>
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoText}>Fotoğraf</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>
        {candidate.name} {candidate.age ? `• ${candidate.age}` : ''}
      </Text>
      <Text style={styles.meta}>Attractiveness: High</Text>
      <Text style={styles.meta}>{candidate.bio ?? 'Enerjik ve sosyal biri.'}</Text>
    </View>
  </View>
);

export default MatchCandidateCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  photoPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: '#6b7280',
    fontSize: 14,
  },
  info: {
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
  },
});
