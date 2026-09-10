// src/features/casino/screens/RouletteGameScreen.tsx
import React, { useEffect, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Pressable, ScrollView, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useRouletteLogic, getNumberColor } from '../logic/useRouletteLogic';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { CustomChipSelector } from '../components/CustomChipSelector';
import RouletteTable from '../components/RouletteTable';
import RouletteWheel from '../components/RouletteWheel';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { translateCasinoStatus } from '../../../data/i18n/casinoText';
import { chipsFor, maxBetFor } from '../data/casinoStakes';
import { FELT } from '../../../core/casino/roulette';

const RouletteGameScreen = () => {
    useLocale();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount;

  // Global Theme
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = useRouletteLogic(initialBet);
  const {
    money, selectedChip, bets, totalBetAmount,
    lastResult, history, status, isSpinning,
    spinResult, pendingResult, lastWinnings, resultPopup
  } = state;

  // Spin animation
  const spinRotation = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSpinning) {
      spinRotation.setValue(0);
      Animated.loop(
        Animated.timing(spinRotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinRotation.stopAnimation();
      spinRotation.setValue(0);
    }
  }, [isSpinning]);

  // Result number pop-in animation
  useEffect(() => {
    if (spinResult !== null && !isSpinning) {
      resultScale.setValue(0);
      resultOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      resultScale.setValue(0);
      resultOpacity.setValue(0);
    }
  }, [spinResult, isSpinning]);

  const spinRotateInterp = spinRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Render history pills
  const renderResultPill = (entry: { value: number; color: 'red' | 'black' | 'green' }, idx: number) => (
    <View
      key={`${entry.value}-${idx}`}
      style={[
        styles.resultPill,
        entry.color === 'red' && styles.resultRed,
        entry.color === 'black' && styles.resultBlack,
        entry.color === 'green' && styles.resultGreen,
      ]}>
      <Text style={styles.resultPillText}>{entry.value}</Text>
    </View>
  );

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
          EVERYTHING BELOW THE HEADER

          A box of its own, because the result number positions itself from
          the top of whatever contains it and needs something that starts
          under the cash pill. Anchoring it at container level would mean
          knowing the header's height, which depends on the safe area inset -
          a number this screen has no business knowing.
         ------------------------------------------------------------------ */}
      <View style={styles.stage}>
      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />


      {/* ------------------------------------------------------------------
          THE WHEEL IS PINNED, NOT SCROLLED

          Reported as "when I place a bet the wheel stays up at the top" - the
          betting table is tall, so laying a chip scrolls the wheel off screen
          and the spin happens somewhere the player cannot see. Which makes the
          animation pointless for the one moment it exists for.

          So it sits OUTSIDE the ScrollView and the table scrolls underneath
          it. Smaller too - 168 rather than 230 - because a wheel that is always
          there can afford to be modest, and it leaves the table room.
         ------------------------------------------------------------------ */}
      <View style={styles.wheelStage}>
        {/* ----------------------------------------------------------------
            THE HUB IS THE BUTTON, AND THE ONLY ONE

            Asked for as "there should not be a play button; make the round
            thing in the middle of the wheel the button and pressing it
            spins". The bottom button is gone.

            The first pass made the WHOLE wheel pressable, which was worse
            than it sounds: a wheel is a betting surface in a real room, so
            a tap anywhere on it means nothing in particular. The hub is the
            one part nobody ever bets on, and it is where a croupier's hand
            actually goes.

            No second copy of the rules here: `handleSpin` already refuses
            when there are no chips down or a spin is running, and `canSpin`
            only mirrors that for the dead state.
           ---------------------------------------------------------------- */}
        <RouletteWheel
          size={176}
          result={pendingResult ?? spinResult}
          spinning={isSpinning}
          tint={currentLocation.theme.primary}
          onSpin={actions.handleSpin}
          canSpin={!isSpinning && bets.length > 0}
          spinLabel={isSpinning ? '' : t('casino.spinShort')}
        />
        {isSpinning ? (
          <Text style={styles.spinningText}>{t('casino.spinning')}</Text>
        ) : (
          <Text style={styles.wheelHint}>
            {selectedChip <= 0 ? t('casino.pickChip')
              : bets.length === 0 ? t('casino.placeChipsFirst')
                : t('casino.tapHub')}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* STATUS + HISTORY */}
        <View style={styles.topRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {translateCasinoStatus(status).toUpperCase()}
          </Text>
        </View>

        {/* History Row */}
        {history.length > 0 && (
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>{t('casino.last')}</Text>
            {history.map(renderResultPill)}
          </View>
        )}

        {spinResult !== null && !isSpinning && (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                transform: [{ scale: resultScale }],
                opacity: resultOpacity,
              },
            ]}
          >
            <View
              style={[
                styles.resultCircle,
                {
                  backgroundColor:
                    getNumberColor(spinResult) === 'red' ? '#C0392B'
                    : getNumberColor(spinResult) === 'green' ? '#27AE60'
                    : '#2C3E50',
                },
              ]}
            >
              <Text style={styles.resultNumber}>{spinResult}</Text>
            </View>
            {lastWinnings > 0 && (
              <Text style={styles.winText}>+${lastWinnings.toLocaleString()}</Text>
            )}
          </Animated.View>
        )}

        {/* ROULETTE TABLE */}
        <View style={[styles.tableContainer, { borderColor: currentLocation.theme.secondary }]}>
          <RouletteTable
            onPlaceBet={actions.placeBet}
            onRemoveBet={actions.removeBet}
            getBetOnPosition={actions.getBetOnPosition}
            gameTheme={currentLocation.theme}
            disabled={isSpinning}
          />
        </View>

      </ScrollView>

      {/* ------------------------------------------------------------------
          THE CONTROLS ARE PINNED, LIKE THE WHEEL

          Reported as "the bet area and the play button are so far down that
          we have to move around in the game". The betting grid genuinely IS
          tall - three columns of twelve plus the outside bets - so unlike the
          other three screens this one has to keep a scroller. What it does
          not have to do is put the chips and the SPIN button INSIDE it.

          So the rule is the one the wheel already follows: the thing you
          LOOK at may scroll, the thing you ACT with may not. The grid scrolls
          between a fixed wheel above and fixed controls below.
         ------------------------------------------------------------------ */}
      <View style={styles.controlsDock}>
        <View style={styles.controlsSection}>
          {/* CHIP SELECTOR */}
          {/* Compact, because the grid below wants the height more than the
              rail does. See components/CustomChipSelector.tsx. */}
          <CustomChipSelector
            chips={chipsFor(currentLocation, money)}
            selectedChip={selectedChip}
            onSelect={actions.selectChip}
            gameTheme={currentLocation.theme}
            compact
          />

          <View style={styles.bottomControls}>
            <View style={styles.summaryRow}>
              <View style={styles.betDisplay}>
                <Text style={styles.betLabel}>{t('ui.totalBet')}</Text>
                <Text style={styles.betValueText}>${totalBetAmount.toLocaleString()}</Text>
                {bets.length > 0 && (
                  <Text style={styles.betCount}>{bets.length} {bets.length > 1 ? t('casino.bets') : t('casino.bet')}</Text>
                )}
                {/* ------------------------------------------------------
                    A GESTURE NOBODY TRIES UNLESS THEY ARE TOLD

                    A long press takes one chip back off one position, and
                    it is invisible: there is nothing on a number to
                    suggest holding it does anything. So the line appears
                    the moment there is a chip to lift and goes away when
                    there is not, which is the only time it is true.
                   ------------------------------------------------------ */}
                {bets.length > 0 && !isSpinning && (
                  <Text style={styles.liftHint}>{t('casino.liftChip')}</Text>
                )}
              </View>

              {/* Clear Bets */}
              {bets.length > 0 && !isSpinning && (
                <Pressable
                  onPress={actions.clearBets}
                  style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.clearBtnText}>{t('casino.clear')}</Text>
                </Pressable>
              )}
            </View>

            {/* --------------------------------------------------------
                THE SPIN BUTTON IS GONE FROM HERE

                Asked for as "there should not be a play button; make the
                round thing in the middle of the wheel the button". It is
                the hub now. See components/RouletteWheel.tsx.

                What it cost while it lived here was not just the space:
                the action was at the bottom of a tall screen and the
                thing it acted on was pinned at the top, so playing a
                round meant looking in two places and pressing in a
                third. The hub is inside the wheel that is already in
                view, which is one place.

                The dock keeps what it should keep: what you are betting,
                and how to take it back.
               -------------------------------------------------------- */}
          </View>
        </View>
      </View>
      </View>
    </View>
  );
};

export default RouletteGameScreen;

const styles = StyleSheet.create({
  wheelStage: {
    alignItems: 'center',
    justifyContent: 'center',
    // 8 -> 4. The wheel is pinned, so every point of padding around it is a
    // point the grid underneath never gets back.
    paddingVertical: 4,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },

  container: { flex: 1, backgroundColor: '#1C242C' },

  /** Everything below the header, and what the result number measures from. */
  stage: { flex: 1 },

  /** The wheel dips a little under a finger, so the tap is acknowledged. */
  wheelHint: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  /** The grid scrolls. Its bottom padding is now only the dock's business. */
  content: { padding: theme.spacing.md, gap: 8, paddingBottom: 8 },

  /** The chips and the SPIN button, pinned above the nav bar. */
  /**
   * The dock, on a diet.
   *
   * Asked for as "make the bet size part smaller, and stretch the roulette
   * further down". Those are one request from both ends: the dock and the
   * betting grid share a screen, and the grid is the thing being played on.
   * Every point taken out here is a point the table gets.
   */
  controlsDock: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 4,
    paddingBottom: NAV_BAR_CLEARANCE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1C242C',
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 4,
  },
  resultPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultRed: { backgroundColor: '#C0392B' },
  resultBlack: { backgroundColor: '#2C3E50' },
  resultGreen: { backgroundColor: '#27AE60' },
  resultPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // Spinning animation
  spinningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  wheelIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelEmoji: { fontSize: 36 },
  spinningText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Result display
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  resultCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  resultNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  winText: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '900',
  },

  // Table
  /**
   * The cloth, and the rail around it.
   *
   * It was a flat dark rectangle with a one point border and six points of
   * padding, which read as a container rather than a table. A real layout is
   * a green cloth inside a raised wooden rail, and the two together are most
   * of what makes it look like somewhere you stand rather than a list of
   * buttons. `FELT.rim` is the same tone the wheel is built from, so the two
   * halves of the screen are one object.
   */
  tableContainer: {
    backgroundColor: FELT.cloth,
    borderRadius: 16,
    padding: 10,
    borderWidth: 3,
    borderColor: FELT.rim,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Controls
  controlsSection: { gap: 4 },
  bottomControls: {
    backgroundColor: '#384147',
    // 12 -> 8, and the inner gap is gone: with the SPIN button moved to the
    // wheel there is only one row left in here to space out.
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betDisplay: { gap: 1 },
  betLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  betValueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  /**
   * The token, for the same reason the note below gives.
   *
   * That note already worked this out and stopped one line short: it says
   * "betCount at 0.30 is ALREADY below the readable floor, so matching it was
   * copying a defect", fixed the line it was writing, and left the defect it
   * had just named. This is how many bets are on the table, which is the one
   * number a player checks before spinning.
   */
  betCount: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' },
  /**
   * The token, not a fainter hand-mixed white.
   *
   * Written first as rgba(255,255,255,0.28) to sit under the bet count beside
   * it, and the palette audit failed it on the spot: `betCount` at 0.30 is
   * ALREADY below the readable floor, so matching it was copying a defect.
   * theme.colors.textMuted is the quietest text this game has that can still
   * be read, and an instruction the player has not been given yet is the last
   * thing that should be hard to read.
   */
  liftHint: { color: theme.colors.textMuted, fontSize: 10, marginTop: 3 },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  clearBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
  },

  // ----------------------------------------------------------------------
  //  SHELVED with the button they dressed. The hub in the middle of the
  //  wheel is the spin control now; see components/RouletteWheel.tsx.
  //  Kept because they record what the screen used to be.
  // ----------------------------------------------------------------------
  // spinButton: {
  //   width: '100%',
  //   paddingVertical: 14,
  //   borderRadius: 12,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 3 },
  //   shadowOpacity: 0.35,
  //   shadowRadius: 5,
  //   elevation: 5,
  // },
  // spinButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  // spinText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
  //
  //  AND `wheelPressed`, from the brief moment the whole wheel was the
  //  button. Pressing anywhere on a betting surface is ambiguous; the hub
  //  is the one part of a wheel nobody bets on.
  // wheelPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});