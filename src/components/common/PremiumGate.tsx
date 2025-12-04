import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

type Props = {
  hasPremium: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

const PremiumGate = ({hasPremium, fallback, children}: Props) => {
  if (hasPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.fallbackContainer}>
      {fallback ?? <Text style={styles.fallbackText}>Premium Required</Text>}
    </View>
  );
};

export default PremiumGate;

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  fallbackText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
