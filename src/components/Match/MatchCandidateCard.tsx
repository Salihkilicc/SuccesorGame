import React from 'react';
import { t, useLocale } from '../../core/i18n';
import {View, Text, StyleSheet} from 'react-native';
import type {MatchCandidate} from './useMatchSystem';
import { theme } from '../../core/theme';

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
    backgroundColor: '#323A40',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#1C242C',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  photoPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#323A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  info: {
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  meta: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
