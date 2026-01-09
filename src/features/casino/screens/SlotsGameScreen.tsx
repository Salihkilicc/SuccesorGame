// src/features/casino/screens/SlotsGameScreen.tsx

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../../components/layout/AppScreen';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useSlotsLogic } from '../logic/useSlotsLogic'; // Logic yolunu kontrol et
import type { SlotVariant } from '../logic/slotsData'; // Data yolunu kontrol et

const SlotsGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  // Parametrelerin doğru geldiğinden emin olalım, yoksa default verelim
  const variant: SlotVariant = route.params?.variant ?? 'street_fighter';
  const initialBet = route.params?.betAmount;

  // Logic Hook Bağlantısı
  const { state, actions } = useSlotsLogic(variant, initialBet);
  const { grid, bet, isSpinning, message, showResult, lastResult, money, config } = state;

  return (
    <AppScreen
      title="Slots"
      subtitle={config.subtitle}
      leftNode={
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>

      <GameResultPopup
        result={showResult ? lastResult : null}
        onHide={actions.hideResult}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HEADER INFO */}
        <View style={styles.headerRow}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Bankroll</Text>
            <Text style={styles.pillValue}>${money.toLocaleString()}</Text>
          </View>
        </View>

        {/* SLOT GRID */}
        <View style={styles.gridWrapper}>
          {grid.map((row, rowIdx) => (
            <View key={rowIdx} style={[styles.row, rowIdx === 1 && styles.middleRow]}>
              {row.map((symbol, colIdx) => (
                <View key={colIdx} style={[styles.cell, rowIdx === 1 && styles.middleCell]}>
                  <Text style={[styles.symbol, rowIdx === 1 && styles.middleSymbol]}>{symbol}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* CONTROLS */}
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Bet</Text>
          <View style={styles.betControls}>
            <Pressable
              onPress={() => actions.adjustBet(-1000)}
              disabled={isSpinning}
              style={({ pressed }) => [styles.betButton, pressed && styles.betButtonPressed, isSpinning && styles.disabledButton]}>
              <Text style={styles.betButtonText}>-</Text>
            </Pressable>

            <Text style={styles.betValue}>${bet.toLocaleString()}</Text>

            <Pressable
              onPress={() => actions.adjustBet(1000)}
              disabled={isSpinning}
              style={({ pressed }) => [styles.betButton, pressed && styles.betButtonPressed, isSpinning && styles.disabledButton]}>
              <Text style={styles.betButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.betHint}>
            {`Limits ${config.minBet.toLocaleString()} - ${config.maxBet.toLocaleString()}`}
          </Text>
        </View>

        <Pressable
          onPress={actions.handleSpin}
          disabled={isSpinning}
          style={({ pressed }) => [styles.spinButton, pressed && styles.spinButtonPressed, isSpinning && styles.disabledButton]}>
          <Text style={styles.spinText}>{isSpinning ? 'SPINNING...' : 'SPIN'}</Text>
        </Pressable>

      </ScrollView>
    </AppScreen>
  );
};

export default SlotsGameScreen;

// STYLES (Orijinali ile aynı)
const styles = StyleSheet.create({
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  pill: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.xs / 2 },
  pillLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, letterSpacing: 0.4 },
  pillValue: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 1 },
  gridWrapper: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  middleRow: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: theme.radius.md, padding: theme.spacing.xs },
  cell: { flex: 1, height: 68, borderRadius: theme.radius.md, backgroundColor: theme.colors.cardSoft, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  middleCell: { backgroundColor: theme.colors.card, borderColor: theme.colors.accent, borderWidth: 2 },
  symbol: { fontSize: 28 },
  middleSymbol: { fontSize: 36, textShadowColor: theme.colors.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  betRow: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm },
  betLabel: { color: theme.colors.textPrimary, fontWeight: '800' },
  betControls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  betButton: { width: 44, height: 44, borderRadius: 999, backgroundColor: theme.colors.cardSoft, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  betButtonPressed: { transform: [{ scale: 0.97 }] },
  betButtonText: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  betValue: { flex: 1, textAlign: 'center', color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  betHint: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1 },
  spinButton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg, padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.xs },
  spinButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  spinText: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  backButton: { width: 42, height: 42, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardSoft },
  backButtonPressed: { transform: [{ scale: 0.96 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: 18 },
  disabledButton: { opacity: 0.55 },
});