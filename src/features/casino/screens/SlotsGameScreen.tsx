// src/features/casino/screens/SlotsGameScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Pressable, StyleSheet, Text, View, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../../components/layout/AppScreen';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useSlotsLogic } from '../logic/useSlotsLogic';
import type { SlotVariant } from '../logic/slotsData';
import { Reel, SYMBOL_HEIGHT } from '../components/Reel';
import SlotCabinet from '../components/SlotCabinet';
import { CustomChipSelector } from '../components/CustomChipSelector';
import { CASINO_LOCATIONS } from '../data/casinoData';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { colourOfIcon } from '../logic/slotsData';
import { translateCasinoStatus } from '../../../data/i18n/casinoText';
import { chipsFor, maxBetFor } from '../data/casinoStakes';
import { useStatsStore } from '../../../core/store/useStatsStore';

const { width } = Dimensions.get('window');

/**
 * How wide the cabinet is.
 *
 * The screen's padding either side, and then capped: on a large phone a
 * cabinet that fills the width stops looking like an object in a room and
 * starts looking like a background.
 */
const CABINET_W = Math.min(width - theme.spacing.lg * 2, 340);

const SlotsGameScreen = () => {
    useLocale();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const variant: SlotVariant = route.params?.variant ?? 'ticker';
  const initialBet = route.params?.betAmount;

  // Get current location logic to apply theme & limits
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // ----------------------------------------------------------------------
  //  THE CEILING IS A SHARE OF WHAT YOU HAVE NOW
  // ----------------------------------------------------------------------
  //  Read straight from the store rather than from `state.money` below,
  //  which is this machine's own running balance and does not exist yet on
  //  the line that needs it. See data/casinoStakes.ts.
  // ----------------------------------------------------------------------
  const playerMoney = useStatsStore(s => s.money);

  // Logic Hook - Pass location max bet
  const { state, actions } = useSlotsLogic(variant, initialBet, maxBetFor(currentLocation, playerMoney), currentLocation.slotFaces);
  // Ensure we define config locally or from state, to avoid TS errors if state structure changed differently
  const { grid, bet, isSpinning, message, showResult, lastResult, money, config, reelDelays, settleMs } = state;

  // Win Animation State (Standard Animated)
  // `winScale` and `winOpacity` drove the BIG WIN curtain and are shelved with
  // it. See the note below.

  // Location Modal State (for header)
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // ----------------------------------------------------------------------
  //  THE BIG WIN CURTAIN IS GONE
  // ----------------------------------------------------------------------
  //  SHELVED: a full screen Pressable with BIG WIN at forty point, the amount
  //  under it, and "tap to continue" under that, held for three seconds after
  //  every winning spin. On the Ticker that is better than one spin in nine.
  //
  //  It also ATE THE NEXT SPIN: the overlay covered the button, so a player
  //  going again while it was up dismissed the curtain instead. The rhythm of
  //  a slot machine is spin, see, spin, and this put a door in the middle of
  //  it.
  //
  //  The amount rises and fades on its own now, through a component that takes
  //  no taps at all. See components/GameResultPopup.tsx.
  // ----------------------------------------------------------------------

  // Transpose Grid: The logic returns [Row][Col], but Reels need [Col][Row]
  const columns = grid[0] ? grid[0].map((_, colIndex) => grid.map(row => row[colIndex])) : [];

  return (
    <View style={styles.container}>

      {/* 0. TOP HEADER */}
      <CasinoHeader
        onBack={() => navigation.goBack()}
        location={currentLocation}
        reputation={casinoReputation}
        cash={money}
      />


      {/* ------------------------------------------------------------------
          A SLOT MACHINE DOES NOT SCROLL

          This was a ScrollView, which is what put the SPIN button under the
          nav bar: the content is taller than the space, so at rest the
          control the whole screen exists for was hidden behind the tab bar
          and had to be scrolled up to. Reported as "tab bar ile cakisiyor"
          and "kaymasin".

          A fixed column instead. The machine takes the middle and gives up
          height when there is not enough; the controls are pinned above
          NAV_BAR_CLEARANCE and cannot move. Nothing on this screen is ever
          out of reach.
         ------------------------------------------------------------------ */}
      <View style={styles.content}>

        {/* ----------------------------------------------------------------
            THE AMOUNT, rising into the cash pill it just changed.

            INSIDE the content box rather than beside the header, because the
            popup positions itself from the top of whatever contains it and
            this is the first thing that starts below the header. Anchoring it
            at container level would need the header's height, which depends
            on the safe area inset - a number this screen has no business
            knowing.
           ---------------------------------------------------------------- */}
        <GameResultPopup
          result={showResult && lastResult ? lastResult : null}
          onHide={actions.hideResult}
        />

        {/* INFO ROW */}
        <View style={styles.infoRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {translateCasinoStatus(message).toUpperCase()}
          </Text>
        </View>

        {/* ------------------------------------------------------------------
            THE MACHINE

            This was a grey rounded rectangle in the same colour as every other
            card in the game, holding three reels, with a payline rule drawn
            across the whole thing. Reported as "the slot needs a complete
            makeover, it does not look good at all" - and separately, the flow
            was liked, so none of the timing below is touched.

            It has a body now: a lit marquee with the machine's NAME on it, two
            pillars of lamps that chase while the reels turn, a glass bezel and
            a coin tray. The name is the part that carries information rather
            than decoration - the three machines pay differently and the screen
            never once said which one you were standing at.

            See components/SlotCabinet.tsx.
           ------------------------------------------------------------------ */}
        <View style={styles.machineRow}>
          <SlotCabinet
            width={CABINET_W}
            glassHeight={SYMBOL_HEIGHT + 20}
            title={config.title}
            tint={currentLocation.theme.primary}
            glow={currentLocation.theme.secondary}
            spinning={isSpinning}
            won={!!showResult && lastResult?.type === 'win'}
          >
            <View style={styles.reelsWrapper}>
              {columns.map((colSymbols, colIdx) => (
                <Reel
                  symbols={state.symbolIcons}
                  key={colIdx}
                  index={colIdx}
                  finalSymbol={colSymbols[1]}
                  colourOf={(icon) => colourOfIcon(state.symbols, icon)}
                  tint={currentLocation.theme.primary}
                  isSpinning={state.isSpinning}
                  // ONE SOURCE for the stagger. The last reel waits longer when the
                  // first two match: see logic/useSlotsLogic.ts -> HANG_MS.
                  delay={reelDelays[colIdx] ?? 0}
                  settleMs={settleMs}
                />
              ))}
            </View>
          </SlotCabinet>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsSection}>

          {/* Chip Selector */}
          <CustomChipSelector
            chips={chipsFor(currentLocation, money)}
            selectedChip={bet}
            onSelect={(val) => actions.setBetAmount(val)}
            gameTheme={currentLocation.theme}
          />

          <View style={styles.bottomControls}>
            <View style={styles.betDisplay}>
              <Text style={styles.betLabel}>{t('ui.totalBet')}</Text>
              <Text style={styles.betValueText}>${bet.toLocaleString()}</Text>
            </View>

            <Pressable
              onPress={actions.handleSpin}
              disabled={isSpinning || bet <= 0}
              style={({ pressed }) => [
                styles.spinButton,
                { backgroundColor: isSpinning || bet <= 0 ? '#666E70' : currentLocation.theme.primary },
                pressed && styles.spinButtonPressed,
                (isSpinning || bet <= 0) && styles.disabledButton
              ]}>
              {/* The button says what is missing rather than firing an alert
                  after the tap. A stake of zero means unchosen. */}
              <Text style={styles.spinText}>
                {isSpinning ? '...' : bet <= 0 ? t('casino.pickChip') : t('casino.spin')}
              </Text>
            </Pressable>
          </View>
        </View>

      </View>
    </View>
  );
};

export default SlotsGameScreen;

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C242C' },

  content: {
    flex: 1,
    padding: theme.spacing.lg,
    // The nav bar's height, so the controls sit above it rather than under.
    paddingBottom: NAV_BAR_CLEARANCE,
    justifyContent: 'space-between',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1
  },
  limitPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12
  },
  limitText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600'
  },

  machineRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelsWrapper: {
    flexDirection: 'row',
    gap: 6,
  },

  // ----------------------------------------------------------------------
  //  SHELVED with the grey box they dressed. See components/SlotCabinet.tsx
  //  for what replaced them. Kept because they record what the screen used
  //  to be, and because deleting is not the move here.
  // ----------------------------------------------------------------------
  // machineContainer: {
  //   backgroundColor: card grey,
  //   borderRadius: 24,
  //   padding: 14,
  //   borderWidth: 1,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   shadowColor: the ground,
  //   shadowOffset: { width: 0, height: 10 },
  //   shadowOpacity: 0.6,
  //   shadowRadius: 20,
  //   elevation: 10,
  // },
  //
  //  AND THE PAYLINE RULE, which was drawn 84 points tall across the whole
  //  machine at forty per cent opacity - a band bigger than the window it was
  //  meant to be marking. Each reel draws its own now, inside its own glass.
  //
  // payline: {
  //   position: 'absolute',
  //   top: '50%',
  //   left: -10,
  //   right: -10,
  //   height: 84,
  //   marginTop: -42,
  //   borderWidth: 1,
  //   borderColor: 'rgba(255,255,255,0.08)',
  //   zIndex: 20,
  //   borderRadius: 4,
  //   opacity: 0.4,
  //   pointerEvents: 'none',
  // },

  controlsSection: {
    // Tighter than the 24 it was: that gap plus the chip selector was what
    // pushed the SPIN row off the bottom in the first place.
    gap: 14,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#434B50',
    // 16 -> 12. The card is the last thing between the reels and the nav
    // bar and it was the tallest thing it did not need to be.
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  betDisplay: {
    gap: 4
  },
  betLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  betValueText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },

  spinButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  spinButtonPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  spinText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },

  disabledButton: { opacity: 0.7 },

  // ----------------------------------------------------------------------
  //  SHELVED, with the curtain they dressed. Kept because they record what
  //  the screen used to do, and because deleting is not the move here.
  // ----------------------------------------------------------------------
  // winOverlay: {
  // position: 'absolute',
  // top: 0, left: 0, right: 0, bottom: 0,
  // justifyContent: 'center',
  // alignItems: 'center',
  // zIndex: 100,
  // backgroundColor: 'rgba(28,36,44,0.6)'
  // },
  // bigWinText: {
  // color: theme.colors.textPrimary,
  // fontSize: 64,
  // fontWeight: '900',
  // textShadowColor: '#FF8A8A',
  // textShadowOffset: { width: 0, height: 2 },
  // textShadowRadius: 20,
  // transform: [{ rotate: '-5deg' }]
  // },
  // winAmount: {
  // color: '#FFFFFF',
  // fontSize: 42,
  // fontWeight: '800',
  // marginTop: 12,
  // textShadowColor: 'rgba(28,36,44,1)',
  // textShadowOffset: { width: 0, height: 2 },
  // textShadowRadius: 4,
  // },
  tapToCloseText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  }
});