// src/features/casino/components/CasinoHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CasinoLocation } from '../data/casinoData';
import { theme } from '../../../core/theme';
import { formatCompact } from '../../../core/utils';

interface CasinoHeaderProps {
  location: CasinoLocation;
  reputation: number;
  cash: number;
  onBack?: () => void;
  onLocationPress?: () => void;
  hideLocationSelector?: boolean;
}

const CasinoHeader: React.FC<CasinoHeaderProps> = ({
  location,
  reputation,
  cash,
  onBack,
  onLocationPress,
  hideLocationSelector = false,
}) => {
  const insets = useSafeAreaInsets();

  const getReputationRank = (rep: number) => {
    if (rep >= 600) return 'High Roller';
    if (rep >= 300) return 'VIP Lounge';
    if (rep >= 100) return 'Gambler';
    return 'Member';
  };

  const repProgress = Math.min(reputation / 700, 1);
  const rankName = getReputationRank(reputation);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* City Ambient Gradient */}
      <LinearGradient
        colors={[location.theme.bgGradient[0], '#1C242C']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Top Action Row */}
        <View style={styles.topRow}>
          {/* Back button or Game Emblem */}
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.navBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.navBtn, { borderColor: location.theme.primary }]}>
              <Text style={{ fontSize: 16 }}>{location.theme.flag}</Text>
            </View>
          )}

          {/* Location Selector Pill */}
          {!hideLocationSelector && onLocationPress ? (
            <TouchableOpacity
              onPress={onLocationPress}
              style={[
                styles.locationPill,
                {
                  borderColor: location.theme.primary,
                  backgroundColor: location.theme.badgeBg,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={styles.locationPillFlag}>{location.theme.flag}</Text>
              <View style={styles.locationPillTextWrapper}>
                <Text style={styles.locationPillCity}>{location.name.toUpperCase()}</Text>
                <Text style={[styles.locationPillSub, { color: location.theme.textColor }]}>
                  {location.subTitle}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={location.theme.primary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>{location.name.toUpperCase()}</Text>
              <Text style={[styles.subtitle, { color: location.theme.textColor }]}>
                {location.subTitle}
              </Text>
            </View>
          )}

          {/* Cash Balance Pill */}
          <View style={styles.cashPill}>
            <MaterialCommunityIcons name="cash-multiple" size={14} color={theme.colors.positive} />
            <Text style={styles.cashValue}>${formatCompact(cash)}</Text>
          </View>
        </View>

        {/* Bottom Reputation Status Bar */}
        <View style={styles.repContainer}>
          <View style={styles.repHeaderRow}>
            <View style={styles.repLeftLabel}>
              <MaterialCommunityIcons name="star-circle-outline" size={12} color={location.theme.primary} />
              <Text style={styles.repLabelText}>
                CASINO VIP: <Text style={{ color: location.theme.textColor, fontWeight: '800' }}>{rankName.toUpperCase()}</Text>
              </Text>
            </View>
            <Text style={styles.repNumbersText}>
              {reputation.toFixed(0)} <Text style={{ color: theme.colors.textMuted }}>/ 700 REP</Text>
            </Text>
          </View>
          <View style={styles.repTrack}>
            <LinearGradient
              colors={location.theme.gradient}
              style={[styles.repFill, { width: `${Math.max(repProgress * 100, 3)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CasinoHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C242C',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  locationPillFlag: {
    fontSize: 18,
  },
  locationPillTextWrapper: {
    flex: 1,
  },
  locationPillCity: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  locationPillSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  cashValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  repContainer: {
    gap: 4,
  },
  repHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repLeftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repLabelText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  repNumbersText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  repTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  repFill: {
    height: '100%',
    borderRadius: 2,
  },
});
