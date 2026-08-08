// @orphan-ok monetisation gating was never wired into the CEO cut
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import { t, useLocale } from '../../core/i18n';
import {View, Text, StyleSheet} from 'react-native';

type Props = {
  hasPremium: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

const PremiumGate = ({hasPremium, fallback, children}: Props) => {
    useLocale();
  if (hasPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.fallbackContainer}>
      {fallback ?? <Text style={styles.fallbackText}>{t('ui.premiumRequired')}</Text>}
    </View>
  );
};

export default PremiumGate;

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  fallbackText: {
    color: '#1A0A4A',
    fontSize: 13,
    fontWeight: '600',
  },
});
