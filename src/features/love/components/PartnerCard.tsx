import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PartnerProfile } from '../../../data/relationshipTypes';
import type { Partner, SocialTier } from '../types';
import { theme } from '../../../core/theme';

type PartnerCardProps = {
  partner: PartnerProfile | Partner;
  usedToday: boolean;
};

const getLoveColor = (love: number) => {
  if (love >= 80) return theme.colors.success;
  if (love >= 50) return theme.colors.accent;
  if (love >= 30) return theme.colors.warning;
  return theme.colors.danger;
};

const getTierColor = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY':
      return '#FFD700'; // Gold
    case 'CORPORATE_ELITE':
      return '#1E3A8A'; // Dark Blue
    case 'UNDERGROUND':
      return '#7C2D12'; // Dark Red/Purple
    case 'BLUE_COLLAR':
      return '#64748B'; // Grey/Light Blue
    case 'STUDENT_LIFE':
      return '#0EA5E9'; // Sky Blue
    case 'ARTISTIC':
      return '#A855F7'; // Purple
    default:
      return theme.colors.textSecondary;
  }
};

const getTierLabel = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY':
      return 'High Society';
    case 'CORPORATE_ELITE':
      return 'Corporate Elite';
    case 'UNDERGROUND':
      return 'Underground';
    case 'BLUE_COLLAR':
      return 'Blue Collar';
    case 'STUDENT_LIFE':
      return 'Student';
    case 'ARTISTIC':
      return 'Artistic';
    default:
      return tier;
  }
};

// Type guard to check if partner is new Deep Persona type
const isDeepPersonaPartner = (partner: PartnerProfile | Partner): partner is Partner => {
  return 'job' in partner && 'personality' in partner && 'finances' in partner;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PartnerCard = ({ partner, usedToday }: PartnerCardProps) => {
  const isDeepPersona = isDeepPersonaPartner(partner);

  // Get love/relationship level
  const loveLevel = isDeepPersona
    ? partner.stats.relationshipLevel
    : (partner as PartnerProfile).love;

  return (
    <View style={styles.card}>
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoText}>{partner.name[0] ?? 'P'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{partner.name}</Text>
            {isDeepPersona && (
              <Text style={styles.jobTitle}>{partner.job.title}</Text>
            )}
          </View>
          <Text style={[styles.statusChip, {
            color: (partner as PartnerProfile).isMarried ? theme.colors.primary : theme.colors.accent
          }]}>
            {(partner as PartnerProfile).isMarried ? '💍 Married' : '❤️ Dating'}
          </Text>
        </View>

        {/* Social Tier Badge */}
        {isDeepPersona && (
          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, {
              backgroundColor: getTierColor(partner.job.tier) + '20',
              borderColor: getTierColor(partner.job.tier),
            }]}>
              <Text style={[styles.tierText, { color: getTierColor(partner.job.tier) }]}>
                {getTierLabel(partner.job.tier)}
              </Text>
            </View>
            <Text style={styles.personalityText}>
              {partner.personality.label}
            </Text>
          </View>
        )}

        <View style={styles.loveRow}>
          <Text style={styles.meta}>Love: {Math.round(loveLevel)}%</Text>
          <View style={styles.loveBar}>
            <View style={[styles.loveFill, {
              width: `${Math.min(100, loveLevel)}%`,
              backgroundColor: getLoveColor(loveLevel)
            }]} />
          </View>
        </View>

        {/* Monthly Cost Display */}
        {isDeepPersona && partner.finances.monthlyCost > 0 && (
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Monthly Upkeep:</Text>
            <Text style={styles.costValue}>
              🔻 {formatCurrency(partner.finances.monthlyCost)}/mo
            </Text>
          </View>
        )}

        <Text style={styles.status}>
          Bugünkü etkileşim: {usedToday ? 'Kullanıldı' : 'Kullanılmadı'}
        </Text>
      </View>
    </View>
  );
};

export default PartnerCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'flex-start',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  jobTitle: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: {
    fontSize: theme.typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  personalityText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  costLabel: {
    fontSize: theme.typography.caption + 1,
    color: '#7F1D1D',
    fontWeight: '600',
  },
  costValue: {
    fontSize: theme.typography.body,
    color: '#DC2626',
    fontWeight: '800',
  },
});
