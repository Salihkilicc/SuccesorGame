// src/features/casino/screens/BlackjackGameScreen.tsx
import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useBlackjackLogic, SHOW_REVEAL_MS, Card } from '../logic/useBlackjackLogic';
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
  // NOTHING IS STAKED UNTIL THE PLAYER STAKES IT. This was 500, so the table
  // arrived with a bet on it and DEAL was live before any decision had been
  // made. Zero is not a legal stake and the button says so.
  const initialBet = route.params?.betAmount ?? 0;

  // Global Casino System for Theme & Rep
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = useBlackjackLogic(initialBet);
  const { playerCards, dealerCards, bet, roundState, status, resultPopup, playerTotal, dealerTotal, dealerDrawn, money, busy, hideHole } = state;

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

  // ------------------------------------------------------------------
  //  THE HOLE CARD
  // ------------------------------------------------------------------
  //  This used to be `roundState === 'player'`, which stopped working the
  //  moment the settlement started waiting for the animation: the round now
  //  stays open while the dealer draws, so the card would have stayed face
  //  down until the very end and the one dramatic moment at the table would
  //  have happened after the result was already on screen. The hook owns it.
  // ------------------------------------------------------------------
  const hideDealerHole = hideHole;

  /**
   * How long the drawn cards wait before they start arriving.
   *
   * The hole card turns over FIRST and alone. Without this offset the dealer's
   * third card slides in over the top of the reveal and the two most
   * interesting things at the table happen simultaneously, which means neither
   * of them registers. Matches SHOW_REVEAL_MS in the hook.
   */
  const DRAW_AFTER_REVEAL = SHOW_REVEAL_MS;

  return (
    <View style={styles.container}>

      {/* 1. HEADER */}
      <CasinoHeader
        onBack={() => navigation.goBack()}
        location={currentLocation}
        reputation={casinoReputation}
        cash={money}
      />

      {/* ------------------------------------------------------------------
          A TABLE DOES NOT SCROLL EITHER

          Reported as "the bet area and the play button are so far down that
          we have to move around in the game". This was a ScrollView holding
          the felt, the chips and the buttons, so on anything but the tallest
          phone the two controls the screen exists for started BELOW the fold
          and had to be scrolled up to before every hand.

          The slot was fixed for exactly this a while ago and the other three
          screens were left as they were. A fixed column instead: the felt
          takes the middle and gives up height when there is not enough, and
          the controls are pinned above the nav bar where they cannot move.

          `stage` is also what the result number is positioned against, so it
          lands under the cash pill rather than over the header.
         ------------------------------------------------------------------ */}
      <View style={styles.stage}>
        {/* The amount, under the cash pill it just changed, rather than over
            the player's hand. See components/GameResultPopup.tsx. */}
        <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

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
                  baseDelay={idx < 2 ? 100 : DRAW_AFTER_REVEAL}
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
                  // ONLY THE OPENING TWO ARE STAGGERED. A card taken on a hit
                  // is dealt on its own, so giving it index 4 made the player
                  // wait 480ms of stagger for cards that were dealt minutes
                  // ago. The dealer's row has always done this; the player's
                  // row did not, and the longer your hand the worse it got.
                  index={idx < 2 ? idx : 0}
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
                  disabled={busy || (bet <= 0 && roundState === 'idle')}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: currentLocation.theme.primary, opacity: (busy || (bet <= 0 && roundState === 'idle')) ? 0.5 : 1 },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Text style={styles.primaryText}>
                    {bet <= 0 ? t('casino.pickChip')
                      : roundState === 'done' ? t('casino.newDeal') : t('casino.deal')}
                  </Text>
                </Pressable>
              )}

              {/* ------------------------------------------------------------
                  HIT / STAND

                  DEAD WHILE THE TABLE IS BUSY. A player who can hit while the
                  previous card is still in the air gets two cards landing on
                  top of each other, and can bust before the card that busted
                  them has finished turning over. `busy` is the whole reason
                  the pacing holds.
                 ------------------------------------------------------------ */}
              {roundState === 'player' && (
                <>
                  <Pressable
                    onPress={actions.hit}
                    disabled={busy}
                    style={({ pressed }) => [styles.gameBtn, styles.hitBtn, busy && styles.btnBusy, pressed && { transform: [{ scale: 0.95 }] }]}
                  >
                    <Text style={styles.gameBtnText}>{t('ui.hit')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={actions.stand}
                    disabled={busy}
                    style={({ pressed }) => [styles.gameBtn, styles.standBtn, busy && styles.btnBusy, pressed && { transform: [{ scale: 0.95 }] }]}
                  >
                    <Text style={styles.gameBtnText}>{t('ui.stand')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>

      </View>
    </View>
  );
};

export default BlackjackGameScreen;

const TABLE_W = Dimensions.get('window').width - 24;

/**
 * Everything on this screen that is NOT the felt, in points.
 *
 * header 143 + stage padding 32 + status 34 + chips 70 + controls 80
 * + the gaps between them 32, and then the nav bar's own clearance.
 *
 * Measured off the components rather than guessed, and it is an estimate on
 * purpose: it only has to be close, because the felt is clamped between a
 * floor and a ceiling either side of it.
 */
const CHROME_H = 143 + 32 + 34 + 70 + 80 + 32 + NAV_BAR_CLEARANCE;

/**
 * The felt's height.
 *
 * DERIVED FROM THE DEVICE, not fixed at 320.
 *
 * 320 was a number that fitted the phone it was written on. The comment
 * beside it said "short enough to leave the chips and the buttons on screen
 * without scrolling", and the ScrollView wrapped around it made that untrue
 * without anybody noticing - on a shorter phone the felt simply pushed the
 * controls below the fold and the scroller absorbed the mistake. Reported as
 * "the bet area and the play button are so far down we have to move around".
 *
 * The floor matters as much as the ceiling: below about 190 the dealer's row
 * and the player's row start to touch, and a cramped table is worse than a
 * short one.
 */
const TABLE_H = Math.max(
    190,
    Math.min(320, Dimensions.get('window').height - CHROME_H),
);

const styles = StyleSheet.create({
  /**
   * Everything below the header.
   *
   * A fixed column, not a scroller. It is also the box the result number is
   * positioned against, so `top: 6` on that lands just under the cash pill
   * rather than behind the header.
   */
  stage: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingBottom: NAV_BAR_CLEARANCE,
    justifyContent: 'space-between',
  },
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
  // SHELVED with the ScrollView it styled. `stage` above replaced it: the
  // same padding, but on a fixed column that cannot move.
  // content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: NAV_BAR_CLEARANCE },

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
  btnBusy: { opacity: 0.4 },
  hitBtn: { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(207,208,210,0.1)' },
  standBtn: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(5,168,246,0.1)' },
  gameBtnText: { color: '#FFFFFF', fontWeight: '900' }
});