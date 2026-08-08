// src/features/casino/screens/SlotsGameScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../../components/layout/AppScreen';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useSlotsLogic } from '../logic/useSlotsLogic';
import type { SlotVariant } from '../logic/slotsData';
import { Reel } from '../components/Reel';
import { CustomChipSelector } from '../components/CustomChipSelector';
import { CASINO_LOCATIONS } from '../data/casinoData';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';

const { width } = Dimensions.get('window');

const SlotsGameScreen = () => {
    useLocale();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const variant: SlotVariant = route.params?.variant ?? 'street_fighter';
  const initialBet = route.params?.betAmount;

  // Get current location logic to apply theme & limits
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook - Pass location max bet
  const { state, actions } = useSlotsLogic(variant, initialBet, currentLocation.maxBet);
  // Ensure we define config locally or from state, to avoid TS errors if state structure changed differently
  const { grid, bet, isSpinning, message, showResult, lastResult, money, config } = state;

  // Win Animation State (Standard Animated)
  const winScale = useRef(new Animated.Value(0)).current;
  const winOpacity = useRef(new Animated.Value(0)).current;

  // Location Modal State (for header)
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showResult && lastResult?.type === 'win') {
      winScale.setValue(0);
      winOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(winScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true
        }),
        Animated.timing(winOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Auto dismiss after 3 seconds
      timer = setTimeout(() => {
        actions.hideResult();
      }, 3000);

    } else {
      winScale.setValue(0);
      winOpacity.setValue(0);
    }
    return () => clearTimeout(timer);
  }, [showResult, lastResult]);

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

      {/* GameResultPopup removed as requested */}

      {/* BIG WIN OVERLAY */}
      {/* BIG WIN OVERLAY */}
      {showResult && lastResult?.type === 'win' && (
        <Pressable style={styles.winOverlay} onPress={actions.hideResult}>
          <Animated.Text style={[styles.bigWinText, { transform: [{ scale: winScale }], opacity: winOpacity }]}>{t('ui.bigWin')}</Animated.Text>
          <Animated.Text style={[styles.winAmount, { transform: [{ scale: winScale }], opacity: winOpacity }]}>
            +${lastResult.amount.toLocaleString()}
          </Animated.Text>
          <Text style={styles.tapToCloseText}>{t('ui.tapScreenToContinue')}</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* INFO ROW */}
        <View style={styles.infoRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {message.toUpperCase()}
          </Text>
          <View style={styles.limitPill}>
            <Text style={styles.limitText}>MAX BET: ${(currentLocation.maxBet).toLocaleString()}</Text>
          </View>
        </View>

        {/* SLOT MACHINE CONTAINER */}
        <View style={[styles.machineContainer, { borderColor: currentLocation.theme.secondary }]}>
          <View style={styles.reelsWrapper}>
            {columns.map((colSymbols, colIdx) => (
              <Reel
                symbols={state.config.symbols}
                key={colIdx}
                index={colIdx}
                finalSymbol={colSymbols[1]} // The target symbol
                isSpinning={state.isSpinning}
                delay={colIdx * 300} // Staggered stop
              />
            ))}
          </View>

          {/* Payline Indicator */}
          <View style={[styles.payline, { borderColor: currentLocation.theme.chipColor }]} pointerEvents="none" />
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsSection}>

          {/* Chip Selector */}
          <CustomChipSelector
            chips={currentLocation.chips}
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
              <Text style={styles.spinText}>{isSpinning ? '...' : 'SPIN'}</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default SlotsGameScreen;

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C242C' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 100 },

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

  machineContainer: {
    backgroundColor: '#434B50',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  reelsWrapper: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#434B50',
    padding: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  payline: {
    position: 'absolute',
    top: '50%',
    left: -10,
    right: -10,
    height: 84, // Slightly larger than symbol height
    marginTop: -42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 20,
    borderRadius: 4,
    opacity: 0.4,
    pointerEvents: 'none',
  },

  controlsSection: {
    gap: 24,
    marginTop: 12
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#434B50',
    padding: 16,
    borderRadius: 24,
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

  winOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(28,36,44,0.6)'
  },
  bigWinText: {
    color: '#FF8A8A',
    fontSize: 64,
    fontWeight: '900',
    textShadowColor: '#FF8A8A',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
    transform: [{ rotate: '-5deg' }]
  },
  winAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 12,
    textShadowColor: 'rgba(28,36,44,1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tapToCloseText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  }
});