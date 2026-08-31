// src/features/casino/screens/BlackjackGameScreen.tsx
import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useBlackjackLogic, Card } from '../logic/useBlackjackLogic';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { CustomChipSelector } from '../components/CustomChipSelector';
import AnimatedCard from '../components/AnimatedCard';
import BlackjackFelt from '../components/BlackjackFelt';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { translateCasinoStatus } from '../../../data/i18n/casinoText';
import { chipsFor, maxBetFor } from '../data/casinoStakes';

const BlackjackGameScreen = () => {
    useLocale();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount ?? 500;

  // Global Casino System for Theme & Rep
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = useBlackjackLogic(initialBet);
  const { playerCards, dealerCards, bet, roundState, status, resultPopup, playerTotal, dealerTotal, dealerDrawn, money } = state;

  // --------------------------------------------------------------------
  //  WHERE THE DECK IS
  // --------------------------------------------------------------------
  //  Every card starts here and travels to its place. Offsets rather than
  //  measured positions: the deck sits at the top right of the felt, so a
  //  dealer card comes from a short way right and a player card from a long
  //  way up and right. No layout pass, no re-render while it moves, one
  //  transform on the UI thread. See components/AnimatedCard.tsx.
  // --------------------------------------------------------------------
  const DECK_FROM_DEALER = { x: 130, y: -34 };
  const DECK_FROM_PLAYER = { x: 130, y: -190 };

  // Krupiyenin kapalı kartı sadece oyuncu oynarken gizli
  const hideDealerHole = roundState === 'player';

  return (
    <View style={styles.container}>

      {/* 1. HEADER */}
      <CasinoHeader
        onBack={() => navigation.goBack()}
        location={currentLocation}
        reputation={casinoReputation}
        cash={money}
      />

      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* INFO BAR */}
        <View style={styles.topRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {translateCasinoStatus(status).toUpperCase()}
          </Text>
        </View>

        {/* ------------------------------------------------------------------
            THE TABLE

            Two bordered boxes stacked vertically, with a faint "BLACKJACK PAYS
            3:2" between them, was what a blackjack table looked like here.
            Cards faded up from forty pixels below wherever they happened to
            sit; nothing came from anywhere.

            It is a felt now, with a deck in the corner, and every card travels
            from it. See components/BlackjackFelt.tsx.
           ------------------------------------------------------------------ */}
        <View style={styles.table}>
          <BlackjackFelt
            width={TABLE_W}
            height={TABLE_H}
            tint={currentLocation.theme.primary}
            label={t('ui.blackjackPays32')}
          />

          {/* THE SHOE. A card that appears is a number; a card that comes
              from here has been dealt. */}
          <View style={[styles.shoe, { borderColor: currentLocation.theme.primary }]}>
            <View style={styles.shoeCard} />
            <View style={[styles.shoeCard, styles.shoeCard2]} />
          </View>

          {/* DEALER */}
          <View style={styles.dealerZone}>
            <Text style={styles.handLabel}>{t('casino.dealer')} ({!hideDealerHole ? dealerTotal : '?'})</Text>
            <View style={styles.cardRow}>
              {dealerCards.map((card, idx) => (
                <AnimatedCard
                  key={`dealer-${card.rank}${card.suit}-${idx}`}
                  card={card}
                  // The cards the dealer DRAWS arrive after the stand, so they
                  // are staggered from zero rather than from the deal.
                  index={idx < 2 ? idx : idx - 2}
                  hidden={idx === 1 && hideDealerHole}
                  baseDelay={idx < 2 ? 100 : 0}
                  fromX={DECK_FROM_DEALER.x}
                  fromY={DECK_FROM_DEALER.y}
                />
              ))}
            </View>
          </View>

          {/* PLAYER */}
          <View style={styles.playerZone}>
            <View style={styles.cardRow}>
              {playerCards.map((card, idx) => (
                <AnimatedCard
                  key={`player-${card.rank}${card.suit}-${idx}`}
                  card={card}
                  index={idx}
                  baseDelay={0}
                  fromX={DECK_FROM_PLAYER.x}
                  fromY={DECK_FROM_PLAYER.y}
                />
              ))}
            </View>
            <Text style={styles.handLabel}>{t('casino.you')} ({playerTotal})</Text>
          </View>
        </View>

        {/* BET CONTROLS */}
        <View style={styles.controlsSection}>

          {/* Only show chips if in betting phase */}
          <View style={{ opacity: roundState === 'player' ? 0.5 : 1 }}>
            <CustomChipSelector
              chips={chipsFor(currentLocation, money)}
              selectedChip={bet}
              onSelect={(val) => {
                // If in idle/done, update bet
                if (roundState === 'idle' || roundState === 'done') {
                  const delta = val - bet;
                  actions.adjustBet(delta);
                }
              }}
              gameTheme={currentLocation.theme}
            />
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.betDisplay}>
              <Text style={styles.betLabel}>{t('ui.bet')}</Text>
              <Text style={styles.betValueText}>${bet.toLocaleString()}</Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              {/* DEAL / RESET */}
              {(roundState === 'idle' || roundState === 'done') && (
                <Pressable
                  onPress={actions.deal}
                  disabled={bet <= 0 && roundState === 'idle'}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: currentLocation.theme.primary, opacity: (bet <= 0 && roundState === 'idle') ? 0.5 : 1 },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Text style={styles.primaryText}>{roundState === 'done' ? t('casino.newDeal') : t('casino.deal')}</Text>
                </Pressable>
              )}

              {/* HIT / STAND */}
              {roundState === 'player' && (
                <>
                  <Pressable onPress={actions.hit} style={({ pressed }) => [styles.gameBtn, styles.hitBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <Text style={styles.gameBtnText}>{t('ui.hit')}</Text>
                  </Pressable>
                  <Pressable onPress={actions.stand} style={({ pressed }) => [styles.gameBtn, styles.standBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <Text style={styles.gameBtnText}>{t('ui.stand')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default BlackjackGameScreen;

/** The felt's size. Wide enough for five cards, short enough to leave the
 *  chips and the buttons on screen without scrolling. */
const TABLE_W = Dimensions.get('window').width - 24;
const TABLE_H = 320;

const styles = StyleSheet.create({
  table: {
    width: TABLE_W,
    height: TABLE_H,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingVertical: 26,
  },
  dealerZone: { alignItems: 'center', gap: 6 },
  playerZone: { alignItems: 'center', gap: 6 },
  /** The shoe, top right, which is where every card starts its journey. */
  shoe: {
    position: 'absolute',
    right: TABLE_W * 0.10,
    top: TABLE_H * 0.40,
    width: 30,
    height: 42,
    borderRadius: 5,
    borderWidth: 1,
    opacity: 0.55,
  },
  shoeCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    backgroundColor: '#2C3E50',
    margin: 2,
  },
  shoeCard2: { margin: 4, backgroundColor: '#34495E' },

  container: { flex: 1, backgroundColor: '#1C242C' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: NAV_BAR_CLEARANCE },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  handCard: {
    backgroundColor: '#434B50',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    minHeight: 140
  },
  handLabel: { color: 'rgba(255,255,255,0.48)', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  cardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  tableCenter: { alignItems: 'center', paddingVertical: 10 },
  tableLogo: { fontWeight: '900', fontSize: 14, letterSpacing: 2 },

  controlsSection: { marginTop: 'auto', gap: 16 },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#434B50',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 80
  },
  betDisplay: { gap: 2 },
  betLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '700' },
  betValueText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },

  actionButtons: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  gameBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center'
  },
  hitBtn: { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(207,208,210,0.1)' },
  standBtn: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(5,168,246,0.1)' },
  gameBtnText: { color: '#FFFFFF', fontWeight: '900' }
});