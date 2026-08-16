// src/features/casino/screens/CasinoScreen.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import { formatCompact } from '../../../core/utils';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useCasinoHomeLogic } from '../logic/useCasinoHomeLogic';
import CasinoLocationModal from '../components/CasinoLocationModal';
import { GameRoomCard } from '../components/GameRoomCard';

const CasinoScreen: React.FC = () => {
  useLocale();

  const { state, actions } = useCasinoHomeLogic();
  const {
    currentLocation,
    currentLocationId,
    unlockedLocations,
    casinoReputation,
    money,
    locationModalVisible,
  } = state;

  const repProgress = Math.min(casinoReputation / 700, 1);
  const getRepRank = (rep: number) => {
    if (rep >= 600) return 'High Roller';
    if (rep >= 300) return 'VIP';
    if (rep >= 100) return 'Gambler';
    return 'Member';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.safeArea}>
        {/* Standard Game Header with Gold accent line */}
        <ScreenHeader title={t('home.casino') || 'CASINO'} category="finance" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. SINGLE DEDICATED CASINO DESTINATION CARD ── */}
          <Text style={styles.sectionTitle}>
            {(t('ui.selectedCasino') || 'CASINO DESTINATION').toUpperCase()}
          </Text>

          <View
            style={[
              styles.destinationCard,
              { borderColor: currentLocation.theme.primary },
            ]}
          >
            <View style={styles.destinationTopRow}>
              <View
                style={[
                  styles.cityIconBadge,
                  {
                    backgroundColor: currentLocation.theme.badgeBg,
                    borderColor: currentLocation.theme.primary,
                  },
                ]}
              >
                <Text style={styles.cityFlag}>{currentLocation.theme.flag}</Text>
                <MaterialCommunityIcons
                  name={(currentLocation.theme.icon as any) || 'cards-playing-outline'}
                  size={16}
                  color={currentLocation.theme.primary}
                />
              </View>

              <View style={styles.destinationDetails}>
                <Text style={styles.cityName}>
                  {currentLocation.name.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.citySubTitle,
                    { color: currentLocation.theme.textColor },
                  ]}
                >
                  {currentLocation.subTitle}
                </Text>
              </View>

              {/* ONLY SINGLE PLACE TO TRAVEL / SWITCH CITY */}
              <TouchableOpacity
                style={[
                  styles.travelButton,
                  {
                    backgroundColor: currentLocation.theme.badgeBg,
                    borderColor: currentLocation.theme.primary,
                  },
                ]}
                onPress={actions.openLocationModal}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="airplane"
                  size={14}
                  color={currentLocation.theme.primary}
                />
                <Text
                  style={[
                    styles.travelButtonText,
                    { color: currentLocation.theme.primary },
                  ]}
                >
                  {t('ui.travelTo') || 'TRAVEL'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.destinationStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MAX BET</Text>
                <Text style={styles.statValue}>
                  ${formatCompact(currentLocation.maxBet)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MIN CHIP</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: currentLocation.theme.textColor },
                  ]}
                >
                  ${formatCompact(currentLocation.chips[0])}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TIER</Text>
                <Text
                  style={[styles.statValue, { color: theme.colors.brand }]}
                >
                  {unlockedLocations.findIndex((l) => l.id === currentLocation.id) + 1} / 7
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2. CASINO STATUS & REPUTATION ── */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.balanceBlock}>
                <Text style={styles.statusLabel}>CHIPS BALANCE</Text>
                <View style={styles.cashWrapper}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={16}
                    color={theme.colors.positive}
                  />
                  <Text style={styles.cashText}>${formatCompact(money)}</Text>
                </View>
              </View>

              <View style={styles.repBlock}>
                <Text style={styles.statusLabel}>VIP STATUS</Text>
                <View style={styles.repBadge}>
                  <MaterialCommunityIcons
                    name="star-circle"
                    size={14}
                    color={currentLocation.theme.primary}
                  />
                  <Text
                    style={[
                      styles.repRankText,
                      { color: currentLocation.theme.textColor },
                    ]}
                  >
                    {getRepRank(casinoReputation).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.repTrackWrapper}>
              <View style={styles.repTrackHeader}>
                <Text style={styles.repTrackLabel}>
                  {t('ui.casinoRep') || 'Reputation'}: {casinoReputation.toFixed(0)} / 700
                </Text>
              </View>
              <View style={styles.repTrack}>
                <View
                  style={[
                    styles.repFill,
                    {
                      width: `${Math.max(repProgress * 100, 3)}%`,
                      backgroundColor: currentLocation.theme.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* ── 3. HIGH ROLLER GAME SUITE ── */}
          <Text style={styles.sectionTitle}>
            {(t('ui.highRollerSuite') || 'HIGH ROLLER SUITE').toUpperCase()}
          </Text>

          <View style={styles.gamesContainer}>
            {/* BLACKJACK 21 */}
            <GameRoomCard
              title={t('ui.blackjack') || 'BLACKJACK 21'}
              subtitle={t('ui.highStakesTables') || 'Classic 3:2 Multi-Hand VIP Tables'}
              image={require('../assets/blackjack_thumb.png')}
              themeColor={currentLocation.theme.primary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="cards-spade"
              badgeText="3:2 PAYOUT"
              onPress={() =>
                actions.handleGamePress('BlackjackGame', { title: t('ui.blackjack21') })
              }
            />

            {/* EUROPEAN ROULETTE */}
            <GameRoomCard
              title={t('ui.roulette') || 'ROULETTE ROYALE'}
              subtitle={t('ui.europeanAmerican') || 'Single-Zero European Wheel & Straight Bets'}
              image={require('../assets/roulette_thumb.png')}
              themeColor={currentLocation.theme.secondary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="circle-slice-8"
              badgeText="35:1 SINGLE ZERO"
              onPress={() =>
                actions.handleGamePress('RouletteGame', { title: t('ui.europeanRoulette') })
              }
            />

            {/* PROGRESSIVE SLOTS */}
            <GameRoomCard
              title={t('ui.slots') || 'CYBER SLOTS'}
              subtitle={t('ui.progressiveJackpots') || 'Multi-Payline Mega Jackpots & Wilds'}
              image={require('../assets/slots_thumb.png')}
              themeColor={currentLocation.theme.primary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="slot-machine"
              badgeText="MEGA JACKPOT"
              onPress={() =>
                actions.handleGamePress('SlotsGame', { title: t('ui.slots') })
              }
            />

            {/* TEXAS HOLD'EM POKER */}
            <GameRoomCard
              title={t('ui.poker') || "TEXAS HOLD'EM"}
              subtitle={t('ui.texasHoldEm') || 'High Stakes No-Limit Private Lounge'}
              image={require('../assets/poker_thumb.png')}
              themeColor={currentLocation.theme.secondary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="cards-club"
              badgeText="NO LIMIT VIP"
              onPress={() =>
                actions.handleGamePress('PokerGame', { title: "Texas Hold'em" })
              }
            />
          </View>
        </ScrollView>

        {/* City Selection Modal */}
        <CasinoLocationModal
          visible={locationModalVisible}
          onClose={actions.closeLocationModal}
          currentLocationId={currentLocationId}
          unlockedLocations={unlockedLocations}
          onSelectLocation={actions.setCurrentLocationId}
        />
      </View>
    </View>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: NAV_BAR_CLEARANCE + 24,
  },

  // ── Section Title ───────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandMuted,
    letterSpacing: 1.8,
    marginLeft: 4,
    marginBottom: 8,
  },

  // ── Destination Card ────────────────────────────────────────────────────────
  destinationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  destinationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cityIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 1,
  },
  cityFlag: {
    fontSize: 14,
  },
  destinationDetails: {
    flex: 1,
    gap: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  citySubTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  travelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  travelButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  destinationStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },

  // ── Status & Reputation Card ────────────────────────────────────────────────
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceBlock: {
    gap: 4,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  cashWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  repBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repRankText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  repTrackWrapper: {
    gap: 4,
  },
  repTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repTrackLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  repTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  repFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Games List ──────────────────────────────────────────────────────────────
  gamesContainer: {
    gap: 2,
  },
});