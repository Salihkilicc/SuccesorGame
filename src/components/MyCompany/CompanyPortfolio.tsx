import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';

const COMPANIES = [
  {name: 'NanoAI', revenue: '+120K/day'},
  {name: 'GreenMed', revenue: '+80K/day'},
  {name: 'SkyRobotics', revenue: '+200K/day'},
] as const;

const CompanyPortfolio = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Portfolio</Text>
    <View style={styles.list}>
      {COMPANIES.map(company => (
        <Pressable
          key={company.name}
          style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => console.log(`[MyCompany] Open company: ${company.name}`)}>
          <Text style={styles.name}>{company.name}</Text>
          <Text style={styles.revenue}>Revenue: {company.revenue}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export default CompanyPortfolio;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#0F1424',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
  },
  cardPressed: {
    backgroundColor: '#131A2D',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6ECF7',
  },
  revenue: {
    fontSize: 13,
    color: '#9AA7BC',
  },
});
