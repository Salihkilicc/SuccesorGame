import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import type { PartnerProfile } from '../../../data/relationshipTypes';
import type { Partner, SocialTier } from '../types';
import { theme } from '../../../core/theme';
import Portrait from '../../../components/common/Portrait';
import { faceFor } from '../../../core/portraits/faces';

type PartnerCardProps = {
  partner: PartnerProfile | Partner;
  usedToday: boolean;
};

// --- HELPERS ---

const getLoveColor = (love: number) => {
  if (love >= 80) return '#FF8A8A'; // Red
  if (love >= 50) return '#FF8A8A'; // Pink
  if (love >= 30) return '#FF8A8A'; // Amber
  return '#CFD0D2'; // Slate
};

const getTierColor = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY': return '#FF8A8A'; // Gold
    case 'CORPORATE_ELITE': return '#CFD0D2'; // Blue
    case 'UNDERGROUND': return '#FF8A8A'; // Red
    case 'BLUE_COLLAR': return 'rgba(255,255,255,0.48)'; // Slate
    case 'STUDENT_LIFE': return '#CFD0D2'; // Cyan
    case 'ARTISTIC': return '#05A8F6'; // Purple
    default: return 'rgba(255,255,255,0.48)';
  }
};

import { translateSocialClass, translateOccupation, translateTrait } from '../../../data/i18n/profileLoveShopText';

const getTierLabel = (tier: SocialTier): string => {
  switch (tier) {
    case 'HIGH_SOCIETY': return translateSocialClass('High Society');
    case 'CORPORATE_ELITE': return translateSocialClass('Corporate Elite');
    case 'UNDERGROUND': return translateSocialClass('Underground');
    case 'BLUE_COLLAR': return translateSocialClass('Blue Collar');
    case 'STUDENT_LIFE': return translateSocialClass('Student');
    case 'ARTISTIC': return translateSocialClass('Artistic');
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
  useLocale();
  const isDeepPersona = isDeepPersonaPartner(partner);

  // Stats
  const loveLevel = isDeepPersona ? partner.stats.relationshipLevel : (partner as PartnerProfile).love;
  const looksLevel = isDeepPersona ? partner.stats.looks : 50; // Fallback
  const smartsLevel = isDeepPersona ? partner.stats.intellect : 50; // Fallback

  // Derived Info
  const name = partner.name;
  // The two shapes of partner disagree about the field: the deep persona
  // carries 'male' | 'female' required, the stored profile carries it
  // optional. Undefined is a real answer here and means "do not guess".
  const gender: 'male' | 'female' | undefined = isDeepPersona
    ? (partner as Partner).gender
    : (partner as PartnerProfile).gender;
  const jobTitle = isDeepPersona ? translateOccupation(partner.job.title) : t('love.unemployed');
  /**
   * HOW OLD THEY ACTUALLY ARE.
   *
   * This read `isDeepPersona ? partner.age : 25`, with a comment admitting it
   * was assuming rather than checking. PartnerProfile does carry an age - it
   * is on `stats` - so every stored partner was displayed as 25 whatever the
   * generator gave them, and the demo partner printed 25 beside her own 29.
   *
   * Found by a test asserting that the face matches the number ON THE CARD:
   * a fifty five year old came back with a young man's face because the card
   * was telling everyone he was 25. The face was right about what it was
   * told; the card was wrong.
   */
  const age = isDeepPersona ? partner.age : (partner as PartnerProfile).stats?.age ?? 25;
  const statusLabel = (partner as PartnerProfile).isMarried ? t('partner.married') : t('partner.dating');
  const statusColor = (partner as PartnerProfile).isMarried ? '#05A8F6' : '#FF8A8A';

  return (
    <View style={styles.container}>
      {/* Top Half: Avatar & Overlay Info */}
      <View style={styles.imageSection}>
        {/* ------------------------------------------------------------------
            The face, where the comment used to say "in real app would use an
            Image".

            The age is printed directly underneath in the overlay - "Sophia
            Vance, 29" - so the band has to follow that number rather than
            anything else about the partner.

            A partner with no gender on record gets no face and keeps the
            single large letter this card has always drawn. That is not a
            corner case: `gender` is optional on PartnerProfile because every
            save written before it exists without one, and the demo partner
            has none either. Guessing would be a coin flip on a card that
            fills half the screen.
           ------------------------------------------------------------------ */}
        <Portrait
          id={partner.id}
          name={name}
          source={faceFor({
            id: partner.id,
            name,
            female: gender === undefined ? undefined : gender === 'female',
            age,
          }) as number | null}
          fill="#434B50"
          borderWidth={0}
          initialsSize={80}
          singleInitial
          style={styles.avatarPlaceholder}
        />

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
                <View style={[styles.progressBarFill, { width: `${looksLevel}%`, backgroundColor: '#CFD0D2' }]} />
              </View>
              <Text style={styles.statValue}>{Math.round(looksLevel)}</Text>
            </View>
          )}

          {/* Smarts (Only DeepPersona) */}
          {isDeepPersona && (
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🧠</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${smartsLevel}%`, backgroundColor: '#05A8F6' }]} />
              </View>
              <Text style={styles.statValue}>{Math.round(smartsLevel)}</Text>
            </View>
          )}
        </View>

        {/* Personality & Finances */}
        {isDeepPersona && (
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>🧩 {translateTrait(partner.personality.label)}</Text>
            </View>
            {partner.finances.monthlyCost > 0 && (
              <View style={[styles.chip, styles.costChip]}>
                <Text style={[styles.chipText, styles.costText]}>
                  -{formatCurrency(partner.finances.monthlyCost)}{t('shop.yearUnit') === 'yıl' ? '/ay' : '/mo'}
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
            {usedToday ? t('love.interacted') : t('love.interact')}
          </Text>
        </Pressable>

      </View>
    </View>
  );
};

export default PartnerCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C242C',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    // Shadow
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  imageSection: {
    height: 180,
    backgroundColor: '#323A40',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
  },
  // SHELVED, not deleted: what this box was before it could hold a face.
  // The fill and the 80 point letter are passed to Portrait as props now, so
  // the card looks identical for a partner who has no portrait. Centring
  // moved into Portrait itself, which centres whatever it is showing.
  //
  // avatarPlaceholder: {
  //     width: '100%',
  //     height: '100%',
  //     backgroundColor: '#434B50', // Fallback color
  //     alignItems: 'center',
  //     justifyContent: 'center',
  // },
  // avatarText: {
  //     fontSize: 80,
  //     fontWeight: 'bold',
  //     color: '#FFFFFF',
  // },
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
    backgroundColor: 'rgba(28,36,44,0.6)',
  },
  overlayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  overlayJob: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(28,36,44,0.7)',
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
    backgroundColor: '#434B50',
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
    color: '#FFFFFF',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#323A40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  costChip: {
    backgroundColor: 'rgba(5,168,246,0.1)',
    borderColor: 'rgba(5,168,246,0.3)',
  },
  costText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonPressed: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: theme.colors.onLight,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
