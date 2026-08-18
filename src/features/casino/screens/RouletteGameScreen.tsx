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
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

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
    spinResult, lastWinnings, resultPopup
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

      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* STATUS + HISTORY */}
        <View style={styles.topRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {status.toUpperCase()}
          </Text>
        </View>

        {/* History Row */}
        {history.length > 0 && (
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>LAST:</Text>
            {history.map(renderResultPill)}
          </View>
        )}

        {/* SPIN RESULT DISPLAY */}
        {isSpinning && (
          <View style={styles.spinningContainer}>
            <Animated.View style={[styles.wheelIcon, { transform: [{ rotate: spinRotateInterp }] }]}>
              <Text style={styles.wheelEmoji}>🎡</Text>
            </Animated.View>
            <Text style={styles.spinningText}>Spinning...</Text>
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
            getBetOnPosition={actions.getBetOnPosition}
            gameTheme={currentLocation.theme}
            disabled={isSpinning}
          />
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsSection}>
          {/* CHIP SELECTOR */}
          <CustomChipSelector
            chips={currentLocation.chips}
            selectedChip={selectedChip}
            onSelect={actions.selectChip}
            gameTheme={currentLocation.theme}
          />

          <View style={styles.bottomControls}>
            <View style={styles.summaryRow}>
              <View style={styles.betDisplay}>
                <Text style={styles.betLabel}>TOTAL BET</Text>
                <Text style={styles.betValueText}>${totalBetAmount.toLocaleString()}</Text>
                {bets.length > 0 && (
                  <Text style={styles.betCount}>{bets.length} bet{bets.length > 1 ? 's' : ''}</Text>
                )}
              </View>

              {/* Clear Bets */}
              {bets.length > 0 && !isSpinning && (
                <Pressable
                  onPress={actions.clearBets}
                  style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.clearBtnText}>CLEAR</Text>
                </Pressable>
              )}
            </View>

            {/* Full-Width SPIN BTN */}
            <Pressable
              onPress={actions.handleSpin}
              disabled={isSpinning || bets.length === 0}
              style={({ pressed }) => [
                styles.spinButton,
                {
                  backgroundColor: isSpinning || bets.length === 0
                    ? '#3A4248'
                    : currentLocation.theme.primary,
                },
                pressed && styles.spinButtonPressed,
              ]}
            >
              <Text style={styles.spinText}>
                {isSpinning ? '...' : t('ui.spinWheel')}
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default RouletteGameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C242C' },
  content: { padding: theme.spacing.md, gap: 12, paddingBottom: NAV_BAR_CLEARANCE },

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
  tableContainer: {
    backgroundColor: '#1E2C22',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
  },

  // Controls
  controlsSection: { gap: 10 },
  bottomControls: {
    backgroundColor: '#384147',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betDisplay: { gap: 1 },
  betLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  betValueText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  betCount: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600' },

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

  spinButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  spinButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  spinText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
});