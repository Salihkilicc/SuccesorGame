import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useUserStore} from '../../store';

const StockInfoSection = () => {
  const {hasPremium} = useUserStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Info</Text>
      <Text style={styles.row}>Target Price: $165</Text>
      <Text style={styles.row}>
        Company Bio: Yapay zeka donanım sektöründe yükselen bir firma.
      </Text>
      <Text style={styles.row}>Market Sentiment: Mildly Positive</Text>
      <Text style={styles.row}>
        Expert Comment:{' '}
        {hasPremium
          ? '“Orta vadeli güçlü AL bölgesi.”'
          : 'Premium Required'}
      </Text>
    </View>
  );
};

export default StockInfoSection;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
