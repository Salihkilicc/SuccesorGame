import React from 'react';
import { t, useLocale } from '../../core/i18n';
import {View, Text, StyleSheet} from 'react-native';
import type {MatchCandidate} from './useMatchSystem';

type Props = {
  candidate: MatchCandidate;
};

const MatchCandidateCard = ({candidate}: Props) => {
    useLocale();
    return (
  <View style={styles.card}>
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoText}>{t('ui.fotoRaf')}</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>
        {candidate.name} {candidate.age ? `• ${candidate.age}` : ''}
      </Text>
      <Text style={styles.meta}>{t('ui.attractivenessHigh')}</Text>
      <Text style={styles.meta}>{candidate.bio ?? 'Enerjik ve sosyal biri.'}</Text>
    </View>
  </View>
    );
};

export default MatchCandidateCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#31241F',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  photoPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: '#7F5E51',
    fontSize: 14,
  },
  info: {
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#31241F',
  },
  meta: {
    fontSize: 14,
    color: '#7F5E51',
  },
});
