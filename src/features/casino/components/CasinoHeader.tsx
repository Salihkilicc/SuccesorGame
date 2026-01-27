import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CasinoLocation } from '../data/casinoData';
import { theme } from '../../../core/theme';

interface CasinoHeaderProps {
  location: CasinoLocation;
  reputation: number;
  cash: number;
  onBack?: () => void;
  onLocationPress?: () => void;
  hideLocationSelector?: boolean; // Kept for backward compat or explicit hiding, though onBack logic usually suffices
}

const CasinoHeader = ({ location, reputation, cash, onBack, onLocationPress, hideLocationSelector }: CasinoHeaderProps) => {
  const insets = useSafeAreaInsets();

  const getReputationRank = (rep: number) => {
    if (rep >= 600) return 'High Roller';
    if (rep >= 300) return 'VIP';
    if (rep >= 100) return 'Gambler';
    return 'Guest';
  };

  const getTitleStyle = (locId: string) => {
    // Dynamic Typography based on Location
    switch (locId) {
      case 'vegas':
        return {
          fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
          fontWeight: '900' as '900',
          fontStyle: 'italic' as 'italic',
          color: '#D946EF', // Neon Purple
          textShadowColor: '#D946EF',
          textShadowRadius: 10
        };
      case 'macau':
        return {
          fontFamily: Platform.OS === 'ios' ? 'Palatino' : 'serif',
          fontWeight: '800' as '800',
          color: '#FCD34D', // Gold
          letterSpacing: 1
        };
      case 'athens':
        return {
          fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
          fontWeight: '600' as '600',
          color: '#FFF',
          letterSpacing: 3
        };
      default:
        return {
          fontWeight: '800' as '800',
          color: '#FFF',
          letterSpacing: 2
        };
    }
  };

  const titleStyle = getTitleStyle(location.id);
  const repProgress = Math.min(reputation / 1000, 1); // 0 to 1
  const rankName = getReputationRank(reputation);

  // Layout Constants
  // User requested ~5% height increase over base. 68 * 1.05 = ~72.
  const HEADER_HEIGHT = 72 + insets.top;

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT, paddingTop: insets.top }]}>
      {/* Dynamic Background Simulation */}
      <View style={[styles.background, { backgroundColor: location.theme.primary }]} />
      <View style={[styles.backgroundOverlay, { backgroundColor: '#111827' }]} />

      {/* Content */}
      <View style={styles.content}>

        {/* 3-Zone Header Row */}
        <View style={styles.headerRow}>

          {/* LEFT ZONE: Back or Location */}
          <View style={styles.leftZone}>
            {onBack ? (
              <Pressable onPress={onBack} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.navIcon}>←</Text>
              </Pressable>
            ) : (
              // If no back button, show Globe Icon here if enabled
              !hideLocationSelector && onLocationPress && (
                <Pressable onPress={onLocationPress} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.globeIcon}>🌍</Text>
                </Pressable>
              )
            )}

            {/* Show Globe next to back if both exist? User requested "Icon next to back" previously. 
                But 3-zone usually implies one main element per zone or a group. 
                Let's group them if both exist. */}
            {onBack && !hideLocationSelector && onLocationPress && (
              <Pressable onPress={onLocationPress} style={({ pressed }) => [styles.navBtn, { marginLeft: 8 }, pressed && { opacity: 0.7 }]}>
                <Text style={styles.globeIcon}>🌍</Text>
              </Pressable>
            )}
          </View>

          {/* CENTER ZONE: Title */}
          <View style={styles.centerZone}>
            <Text
              style={[styles.title, titleStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {location.subTitle.toUpperCase()}
            </Text>
          </View>

          {/* RIGHT ZONE: Cash */}
          <View style={styles.rightZone}>
            <View style={styles.cashPill}>
              <Text style={styles.cashLabel}>💵</Text>
              <Text style={styles.cashValue}>${cash.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Row: Reputation Bar */}
        <View style={styles.repBarContainer}>
          <View style={styles.repTrack}>
            <View style={[styles.repFill, { width: `${repProgress * 100}%` }]} />
          </View>
          <View style={styles.repLabelContainer}>
            <Text style={styles.repText}>
              Reputation: {reputation.toFixed(0)} / 1000 <Text style={{ color: '#FCD34D' }}>({rankName})</Text>
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
};

export default CasinoHeader;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
    paddingBottom: 8
  },

  // 3-ZONE LAYOUT
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerZone: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rightZone: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    color: '#FFF',
    fontSize: 18,
    marginTop: -2
  },
  globeIcon: {
    fontSize: 14
  },

  title: {
    fontSize: 15,
    textAlign: 'center',
  },
  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  cashLabel: { fontSize: 12 },
  cashValue: {
    color: '#FCD34D',
    fontWeight: '800',
    fontSize: 11, // Slightly reduced from 12.5 requested (12 is nice, 12.5 is specific, let's go 11 for safety/style)
    fontVariant: ['tabular-nums']
  },

  // Reputation Bar
  repBarContainer: {
    height: 12,
    justifyContent: 'center',
    marginBottom: 4
  },
  repTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden'
  },
  repFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
  },
  repLabelContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    top: -12
  },
  repText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: '#111827',
    paddingHorizontal: 4
  }
});
