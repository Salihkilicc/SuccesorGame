// src/features/casino/screens/CasinoScreen.tsx
import React, { useState } from 'react';
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
import { CASINO_LADDER_TOP, VIP_LOCATION } from '../data/casinoData';
import {
  translateCasinoLocationName,
  translateCasinoLocationSubtitle,
  translateCasinoRank,
  translateCasinoBadge,
} from '../../../data/i18n/casinoText';
import { chipsFor, maxBetFor } from '../data/casinoStakes';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import ConfirmPanel from '../../../components/common/ConfirmPanel';

const CasinoScreen: React.FC = () => {
  useLocale();

  const { state, actions } = useCasinoHomeLogic();
  /**
   * The VIP door. Money and a cooldown, not standing, so it comes from the
   * casino system rather than from the room ladder. See data/vipRoom.ts.
   */
  const { inVip, vipVisible, vipDoor, enterVip, leaveVip } = useCasinoSystem();
  const [vipPanel, setVipPanel] = useState<string | null>(null);

  const handleVipPress = () => {
    if (inVip) { leaveVip(); return; }
    if (enterVip()) return;
    // A refusal has to SAY something. A button that does nothing when tapped
    // is the same defect as a rule nothing reads.
    setVipPanel(
      vipDoor.reason === 'tooSoon'
        ? t('casino.vipSoonBody', { v1: vipDoor.quartersLeft })
        : t('casino.vipLockedBody'),
    );
  };
  const {
    currentLocation,
    currentLocationId,
    unlockedLocations,
    casinoReputation,
    money,
    locationModalVisible,
  } = state;

  // The bar is a fraction of the LAST ROOM rather than of a round number
  // somebody typed. It read /700 while the ladder ended at 600, so a player
  // at the top of the game was shown a bar that never filled.
  const repProgress = Math.min(casinoReputation / CASINO_LADDER_TOP, 1);
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
        <ScreenHeader title={t('home.casino')} category="finance" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. SINGLE DEDICATED CASINO DESTINATION CARD ── */}
          <Text style={styles.sectionTitle}>
            {t('casino.destination').toUpperCase()}
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
                  {translateCasinoLocationName(currentLocation.name).toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.citySubTitle,
                    { color: currentLocation.theme.textColor },
                  ]}
                >
                  {translateCasinoLocationSubtitle(currentLocation.subTitle)}
                </Text>
              </View>

              {/* ------------------------------------------------------
                  THE DOOR WITH NO SIGN ON IT

                  Asked for as "if cash is over a billion put a VIP button
                  top right". It appears a long way before it opens - ten
                  billion is the door - and that gap is deliberate: you are
                  meant to know the room is there and not be able to use it.

                  Everything it needs is decided in data/vipRoom.ts; this
                  only draws it and reports the refusal.
                 ------------------------------------------------------ */}
              {/* ------------------------------------------------------
                  SHELVED: THE DOOR IN THE HEADER

                  Reported as "when the noir button arrives the card falls
                  apart", and it did: this is a second pill in a row that
                  fits one, so it wrapped and took the layout with it.

                  It lives in the travel list now, under the cities, which
                  is where every other way of changing where you play
                  already was. See CasinoLocationModal.
                 ------------------------------------------------------ */}
              {/*
              {vipVisible && (
                <TouchableOpacity
                  style={[styles.vipButton, !vipDoor.allowed && styles.vipButtonShut]}
                  onPress={handleVipPress}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name="crown-outline"
                    size={14}
                    color={VIP_LOCATION.theme.primary}
                  />
                  <Text style={[styles.vipButtonText, { color: VIP_LOCATION.theme.primary }]}>
                    {vipDoor.allowed
                      ? t('casino.vipEnter')
                      : vipDoor.reason === 'tooSoon'
                        ? t('casino.vipSoon', { v1: vipDoor.quartersLeft })
                        : t('casino.vipLocked')}
                  </Text>
                </TouchableOpacity>
              )}
              */}

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
                  {t('casino.travel')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.destinationStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('casino.maxBet')}</Text>
                <Text style={styles.statValue}>
                  ${formatCompact(maxBetFor(currentLocation, money))}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('casino.minChip')}</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: currentLocation.theme.textColor },
                  ]}
                >
                  ${formatCompact(chipsFor(currentLocation, money)[0])}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('casino.tier')}</Text>
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
                <Text style={styles.statusLabel}>{t('casino.chipsBalance')}</Text>
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
                <Text style={styles.statusLabel}>{t('casino.vipStatus')}</Text>
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
                    {translateCasinoRank(getRepRank(casinoReputation)).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.repTrackWrapper}>
              <View style={styles.repTrackHeader}>
                <Text style={styles.repTrackLabel}>
                  {t('ui.casinoRep')}: {casinoReputation.toFixed(0)} / {CASINO_LADDER_TOP}
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
            {t('casino.highRollerSuite').toUpperCase()}
          </Text>

          <View style={styles.gamesContainer}>
            {/* BLACKJACK 21 */}
            <GameRoomCard
              title={t('casino.blackjack21')}
              subtitle={t('casino.highStakesTables')}
              themeColor={currentLocation.theme.primary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="cards-spade"
              badgeText={translateCasinoBadge('3:2 PAYOUT')}
              onPress={() =>
                actions.handleGamePress('BlackjackGame', { title: t('casino.blackjack21') })
              }
            />

            {/* EUROPEAN ROULETTE */}
            <GameRoomCard
              title={t('casino.rouletteRoyale')}
              subtitle={t('casino.singleZeroEuropean')}
              themeColor={currentLocation.theme.secondary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="circle-slice-8"
              badgeText={translateCasinoBadge('35:1 SINGLE ZERO')}
              onPress={() =>
                actions.handleGamePress('RouletteGame', { title: t('casino.rouletteRoyale') })
              }
            />

            {/* PROGRESSIVE SLOTS */}
            <GameRoomCard
              title={t('casino.cyberSlots')}
              subtitle={t('casino.multiPaylineMega')}
              themeColor={currentLocation.theme.primary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="slot-machine"
              badgeText={translateCasinoBadge('MEGA JACKPOT')}
              onPress={() =>
                actions.handleGamePress('SlotsGame', { title: t('casino.cyberSlots') })
              }
            />

            {/* TEXAS HOLD'EM POKER */}
            <GameRoomCard
              title={t('casino.texasHoldem')}
              subtitle={t('casino.highStakesNoLimit')}
              themeColor={currentLocation.theme.secondary}
              accentGlow={currentLocation.theme.accentGlow}
              iconName="cards-club"
              badgeText={translateCasinoBadge('NO LIMIT VIP')}
              onPress={() =>
                actions.handleGamePress('PokerGame', { title: t('casino.texasHoldem') })
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
          // The room, at the bottom of the list. Same door and same words as
          // the header button it replaced; only the place has moved.
          vipVisible={vipVisible}
          vipAllowed={vipDoor.allowed}
          inVip={inVip}
          vipLabel={
            inVip
              ? t('casino.vipLeave')
              : vipDoor.allowed
                ? t('casino.vipEnter')
                : vipDoor.reason === 'tooSoon'
                  ? t('casino.vipSoon', { v1: vipDoor.quartersLeft })
                  : t('casino.vipLocked')
          }
          onVipPress={handleVipPress}
        />
      </View>

      {/* The refusal, in words. See handleVipPress. */}
      <ConfirmPanel
        visible={!!vipPanel}
        title={t('casino.vipTitle')}
        summary={vipPanel || ''}
        confirmLabel="OK"
        onCancel={() => setVipPanel(null)}
      />
    </View>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  /**
   * Gold on near black, and the only control in the casino that is not tinted
   * by the room it sits in. It belongs to the other room, not this one.
   */
  vipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFC94C',
    backgroundColor: 'rgba(239, 201, 76, 0.12)',
    marginRight: 8,
  },
  /** Dimmed rather than recoloured: the label keeps its gold either way. */
  vipButtonShut: { opacity: 0.45 },
  vipButtonText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

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