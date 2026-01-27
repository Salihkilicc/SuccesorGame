import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useRouletteLogic, BetType, ResultEntry } from '../logic/useRouletteLogic';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { CustomChipSelector } from '../components/CustomChipSelector';

const RouletteGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount;

  // Global Theme
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = useRouletteLogic(initialBet);
  const { money, chip, selectedBet, lastResult, history, status, resultPopup, CHIP_VALUES } = state;

  // Render Helpers
  const renderBetButton = (type: BetType, label: string) => {
    const active = selectedBet === type;
    const color = active ? currentLocation.theme.primary : '#374151';

    return (
      <Pressable
        onPress={() => actions.selectBet(type)}
        style={({ pressed }) => [
          styles.betButton,
          { borderColor: active ? currentLocation.theme.primary : '#4B5563', backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent' },
          pressed && styles.betButtonPressed,
        ]}>
        <Text style={[styles.betButtonText, active && { color: currentLocation.theme.primary }]}>{label}</Text>
      </Pressable>
    );
  };

  const renderResultPill = (entry: ResultEntry, idx: number) => (
    <View
      key={`${entry.value}-${idx}`}
      style={[
        styles.resultPill,
        entry.color === 'red' && styles.resultRed,
        entry.color === 'black' && styles.resultBlack,
        entry.color === 'green' && styles.resultGreen,
      ]}>
      <Text style={styles.resultText}>{entry.value}</Text>
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

        {/* INFO */}
        <View style={styles.topRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>{status.toUpperCase()}</Text>
          <View style={styles.historyRow}>{history.map(renderResultPill)}</View>
        </View>

        {/* BETTING TABLE */}
        <View style={[styles.tableCard, { borderColor: currentLocation.theme.secondary }]}>
          <Text style={styles.tableTitle}>PLACE YOUR BETS</Text>
          <View style={styles.betGrid}>
            {renderBetButton('RED', 'RED')}
            {renderBetButton('BLACK', 'BLACK')}
            {renderBetButton('EVEN', 'EVEN')}
            {renderBetButton('ODD', 'ODD')}
            {renderBetButton('LOW', '1-18')}
            {renderBetButton('HIGH', '19-36')}
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsSection}>

          {/* CHIP SELECTOR (Uses internal game state 'chip' value via selectChip) */}
          <CustomChipSelector
            chips={currentLocation.chips} // Or CHIP_VALUES if logic enforces specific ones. 
            // Note: The logic hook uses 'chip' state to determine next bet amount.
            selectedChip={chip}
            onSelect={(val) => actions.selectChip(val)}
            gameTheme={currentLocation.theme}
          />

          <View style={styles.bottomControls}>
            <View style={styles.betDisplay}>
              <Text style={styles.betLabel}>SELECTED CHIP</Text>
              <Text style={styles.betValueText}>${chip.toLocaleString()}</Text>
            </View>

            {/* SPIN BTN */}
            <Pressable
              onPress={actions.handleSpin}
              style={({ pressed }) => [
                styles.spinButton,
                { backgroundColor: currentLocation.theme.primary },
                pressed && styles.spinButtonPressed
              ]}>
              <Text style={styles.spinText}>SPIN WHEEL</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default RouletteGameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 50 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  historyRow: { flexDirection: 'row', gap: 4 },

  tableCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 16
  },
  tableTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  betGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  betButton: {
    flexBasis: '48%',
    paddingVertical: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  betButtonPressed: { opacity: 0.8 },
  betButtonText: { color: '#D1D5DB', fontWeight: '800', letterSpacing: 1 },

  controlsSection: { marginTop: 'auto', gap: 20 },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151'
  },
  betDisplay: { gap: 2 },
  betLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700' },
  betValueText: { color: '#F3F4F6', fontSize: 20, fontWeight: '800' },

  spinButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  spinButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  spinText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  resultPill: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultRed: { backgroundColor: '#EF4444' },
  resultBlack: { backgroundColor: '#1F2937' },
  resultGreen: { backgroundColor: '#10B981' },
  resultText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});