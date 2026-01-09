import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PartnerProfile } from '../../../data/relationshipTypes';
import { theme } from '../../../core/theme';

type PartnerCardProps = {
  partner: PartnerProfile;
  usedToday: boolean;
};

const getLoveColor = (love: number) => {
  if (love >= 80) return theme.colors.success;
  if (love >= 50) return theme.colors.accent;
  if (love >= 30) return theme.colors.warning;
  return theme.colors.danger;
};

const PartnerCard = ({ partner, usedToday }: PartnerCardProps) => (
  <View style={styles.card}>
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoText}>{partner.name[0] ?? 'P'}</Text>
    </View>
    <View style={styles.info}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{partner.name}</Text>
        <Text style={[styles.statusChip, { color: partner.isMarried ? theme.colors.primary : theme.colors.accent }]}>
          {partner.isMarried ? '💍 Married' : '❤️ Dating'}
        </Text>
      </View>
      <View style={styles.loveRow}>
        <Text style={styles.meta}>Love: {Math.round(partner.love)}%</Text>
        <View style={styles.loveBar}>
          <View style={[styles.loveFill, { width: `${Math.min(100, partner.love)}%`, backgroundColor: getLoveColor(partner.love) }]} />
        </View>
      </View>
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
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  photoText: {
    fontSize: 22,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  meta: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
  status: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statusChip: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  loveRow: {
    gap: theme.spacing.xs,
  },
  loveBar: {
    height: 6,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loveFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
});
