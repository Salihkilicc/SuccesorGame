import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {PartnerProfile} from '../../store/useUserStore';

type PartnerCardProps = {
  partner: PartnerProfile;
  usedToday: boolean;
};

const PartnerCard = ({partner, usedToday}: PartnerCardProps) => (
  <View style={styles.card}>
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoText}>Fotoğraf gelecek</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>{partner.name}</Text>
      <Text style={styles.meta}>Mood: {partner.mood}</Text>
      <Text style={styles.meta}>Love: {partner.love}%</Text>
      <Text style={styles.status}>
        Bugünkü etkileşim: {usedToday ? 'Kullanıldı' : 'Kullanılmadı'}
      </Text>
    </View>
  </View>
);

export default PartnerCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
  },
  status: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
});
