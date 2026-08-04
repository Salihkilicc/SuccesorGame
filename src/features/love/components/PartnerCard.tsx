import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import type { PartnerProfile } from '../../../data/relationshipTypes';
import type { Partner, SocialTier } from '../types';
import { theme } from '../../../core/theme';

type PartnerCardProps = {
  partner: PartnerProfile | Partner;
  usedToday: boolean;
};

// --- HELPERS ---

const getLoveColor = (love: number) => {
  if (love >= 80) return '#ef4444'; // Red
  if (love >= 50) return '#ec4899'; // Pink
  if (love >= 30) return '#f59e0b'; // Amber
  return '#64748b'; // Slate
};

const getTierColor = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY': return '#fbbf24'; // Gold
    case 'CORPORATE_ELITE': return '#60a5fa'; // Blue
    case 'UNDERGROUND': return '#ef4444'; // Red
    case 'BLUE_COLLAR': return '#94a3b8'; // Slate
    case 'STUDENT_LIFE': return '#22d3ee'; // Cyan
    case 'ARTISTIC': return '#a855f7'; // Purple
    default: return '#9ca3af';
  }
};

const getTierLabel = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY': return 'High Society';
    case 'CORPORATE_ELITE': return 'Corporate Elite';
    case 'UNDERGROUND': return 'Underground';
    case 'BLUE_COLLAR': return 'Blue Collar';
    case 'STUDENT_LIFE': return 'Student';
    case 'ARTISTIC': return 'Artistic';
    default: return tier;
  }
};

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

// --- COMPONENT ---

const PartnerCard = ({ partner, usedToday }: PartnerCardProps) => {
  const isDeepPersona = isDeepPersonaPartner(partner);

  // Stats
  const loveLevel = isDeepPersona ? partner.stats.relationshipLevel : (partner as PartnerProfile).love;
  const looksLevel = isDeepPersona ? partner.stats.looks : 50; // Fallback
  const smartsLevel = isDeepPersona ? partner.stats.intellect : 50; // Fallback

  // Derived Info
  const name = partner.name;
  const initial = name[0] || '?';
  const jobTitle = isDeepPersona ? partner.job.title : t('love.unemployed');
  const age = isDeepPersona ? partner.age : 25; // Fallback if age not in PartnerProfile (assuming it is, checking types might be needed but simplistic for now)
  const statusLabel = (partner as PartnerProfile).isMarried ? 'Married' : 'Dating';
  const statusColor = (partner as PartnerProfile).isMarried ? '#a855f7' : '#ec4899';

  return (
    <View style={styles.container}>
      {/* Top Half: Avatar & Overlay Info */}
      <View style={styles.imageSection}>
        {/* Placeholder Avatar - in real app would use <Image source={{ uri: ... }} /> */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Overlay Details */}
        <View style={styles.overlay}>
          <View>
            <Text style={styles.overlayName}>{name}, {age}</Text>
            <Text style={styles.overlayJob}>{jobTitle}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Tier Badge (Top Right) */}
        {isDeepPersona && (
          <View style={[styles.tierBadge, { borderColor: getTierColor(partner.job.tier) }]}>
            <Text style={[styles.tierText, { color: getTierColor(partner.job.tier) }]}>
              {getTierLabel(partner.job.tier)}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Half: Stats & Actions */}
      <View style={styles.contentSection}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Love */}
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>❤️</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${loveLevel}%`, backgroundColor: getLoveColor(loveLevel) }]} />
            </View>
            <Text style={styles.statValue}>{Math.round(loveLevel)}%</Text>
          </View>

          {/* Looks (Only DeepPersona) */}
          {isDeepPersona && (
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>💎</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${looksLevel}%`, backgroundColor: '#38bdf8' }]} />
              </View>
              <Text style={styles.statValue}>{Math.round(looksLevel)}</Text>
            </View>
          )}

          {/* Smarts (Only DeepPersona) */}
          {isDeepPersona && (
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🧠</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${smartsLevel}%`, backgroundColor: '#a855f7' }]} />
              </View>
              <Text style={styles.statValue}>{Math.round(smartsLevel)}</Text>
            </View>
          )}
        </View>

        {/* Personality & Finances */}
        {isDeepPersona && (
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>🧩 {partner.personality.label}</Text>
            </View>
            {partner.finances.monthlyCost > 0 && (
              <View style={[styles.chip, styles.costChip]}>
                <Text style={[styles.chipText, styles.costText]}>
                  -{formatCurrency(partner.finances.monthlyCost)}/mo
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button (Placeholder for Interaction) */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
        >
          <Text style={styles.actionButtonText}>
            {usedToday ? 'Interacted' : 'Interact'}
          </Text>
        </Pressable>

      </View>
    </View>
  );
};

export default PartnerCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  imageSection: {
    height: 180,
    backgroundColor: '#2D2D2D',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#383838', // Fallback color
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#555',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    // Gradient simulation using background color with potential opacity if needed, 
    // but here solid semi-transparent background works best without external libs.
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  overlayJob: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tierBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contentSection: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 35,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  chipText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  costChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  costText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonPressed: {
    backgroundColor: '#e5e5e5',
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
