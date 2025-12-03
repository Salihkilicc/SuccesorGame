import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useStatsStore} from '../../store';

const CasinoHeader = () => {
  const {money} = useStatsStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CASINO</Text>
      <View style={styles.info}>
        <Text style={styles.label}>Money</Text>
        <Text style={styles.value}>${money.toLocaleString()}</Text>
      </View>
    </View>
  );
};

export default CasinoHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
});
