import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../../components/layout/AppScreen';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useRouletteLogic, BetType, ResultEntry } from '../logic/useRouletteLogic'; // Logic yolunu kontrol et

const RouletteGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount;

  // Logic Hook Bağlantısı
  const { state, actions } = useRouletteLogic(initialBet);
  const { money, chip, selectedBet, lastResult, history, status, resultPopup, CHIP_VALUES } = state;

  // --- RENDER HELPERS ---
  const renderBetButton = (type: BetType, label: string) => {
    const active = selectedBet === type;
    return (
      <Pressable
        onPress={() => actions.selectBet(type)}
        style={({ pressed }) => [
          styles.betButton,
          active && styles.betButtonActive,
          pressed && styles.betButtonPressed,
        ]}>
        <Text style={styles.betButtonText}>{label}</Text>
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
    <AppScreen
      title="Roulette"
      subtitle="European table"
      leftNode={
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>

      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO ROW */}
        <View style={styles.topRow}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.historyRow}>{history.map(renderResultPill)}</View>
        </View>

        {/* TABLE (BET SELECTION) */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Wheel</Text>
          <Text style={styles.tableNote}>
            European single-zero. Choose a simple bet, pick a chip, and spin.
          </Text>
          <View style={styles.betGrid}>
            {renderBetButton('RED', 'Red')}
            {renderBetButton('BLACK', 'Black')}
            {renderBetButton('EVEN', 'Even')}
            {renderBetButton('ODD', 'Odd')}
            {renderBetButton('LOW', '1 - 18')}
            {renderBetButton('HIGH', '19 - 36')}
          </View>
        </View>

        {/* CHIP SELECTION */}
        <View style={styles.chipRow}>
          {CHIP_VALUES.map(value => {
            const active = chip === value;
            return (
              <Pressable
                key={value}
                onPress={() => actions.selectChip(value)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}>
                <Text style={styles.chipText}>${value / 1000}K</Text>
              </Pressable>
            );
          })}
        </View>

        {/* SPIN BUTTON */}
        <Pressable
          onPress={actions.handleSpin}
          style={({ pressed }) => [styles.spinButton, pressed && styles.spinButtonPressed]}>
          <Text style={styles.spinText}>SPIN</Text>
          {lastResult ? (
            <Text style={styles.spinSub}>
              Result: {lastResult.value} ({lastResult.color === 'green' ? 'Green' : lastResult.color === 'red' ? 'Red' : 'Black'})
            </Text>
          ) : (
            <Text style={styles.spinSub}>Awaiting first spin</Text>
          )}
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
};

export default RouletteGameScreen;

// STYLES (Orijinal ile aynı)
const styles = StyleSheet.create({
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  historyRow: { flexDirection: 'row', gap: theme.spacing.xs },
  tableCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm },
  tableTitle: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  tableNote: { color: theme.colors.textSecondary, fontSize: theme.typography.body, lineHeight: 18 },
  betGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  betButton: { flexBasis: '48%', paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.cardSoft, alignItems: 'center' },
  betButtonActive: { borderColor: theme.colors.accent },
  betButtonPressed: { transform: [{ scale: 0.97 }] },
  betButtonText: { color: theme.colors.textPrimary, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, justifyContent: 'space-between' },
  chip: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.cardSoft, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  chipActive: { borderColor: theme.colors.accent },
  chipPressed: { transform: [{ scale: 0.97 }] },
  chipText: { color: theme.colors.textPrimary, fontWeight: '800' },
  spinButton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg, padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.xs },
  spinButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  spinText: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  spinSub: { color: theme.colors.textPrimary, fontSize: theme.typography.body },
  resultPill: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  resultRed: { backgroundColor: 'rgba(220,38,38,0.18)' },
  resultBlack: { backgroundColor: 'rgba(255,255,255,0.08)' },
  resultGreen: { backgroundColor: 'rgba(16,185,129,0.18)' },
  resultText: { color: theme.colors.textPrimary, fontWeight: '800' },
  backButton: { width: 42, height: 42, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardSoft },
  backButtonPressed: { transform: [{ scale: 0.96 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: 18 },
});