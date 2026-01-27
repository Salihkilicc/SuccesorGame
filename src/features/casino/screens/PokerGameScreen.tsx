import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { usePokerLogic, Card } from '../logic/usePokerLogic';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { CustomChipSelector } from '../components/CustomChipSelector';

const PokerGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount ?? 10_000;

  // Global Theme
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = usePokerLogic(initialBet);
  const { playerHand, board, revealedBoard, status, resultPopup, gamePhase, currentBet, baseBet, money } = state;

  // Render Helpers
  const renderCard = (card: Card, idx: number, hidden: boolean = false) => (
    <View key={`${card.rank}${card.suit}-${idx}`} style={[styles.card, hidden && styles.cardHidden]}>
      {hidden ? (
        <Text style={styles.cardBack}>🂠</Text>
      ) : (
        <>
          <Text style={styles.cardRank}>{card.rank}</Text>
          <Text style={[styles.cardSuit, { color: ['♥', '♦'].includes(card.suit) ? '#ef4444' : '#e2e8f0' }]}>
            {card.suit}
          </Text>
        </>
      )}
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
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {status.toUpperCase()}
          </Text>
          <View style={styles.limitPill}>
            <Text style={styles.limitText}>POT: ${(currentBet * 2).toLocaleString()}</Text>
          </View>
        </View>

        {/* BOARD */}
        <View style={[styles.boardCard, { borderColor: currentLocation.theme.secondary }]}>
          <Text style={styles.sectionLabel}>COMMUNITY CARDS</Text>
          <View style={styles.cardRow}>
            {board.slice(0, revealedBoard).map((card, idx) => renderCard(card, idx))}
            {Array.from({ length: 5 - revealedBoard }).map((_, idx) => (
              <View key={`placeholder-${idx}`} style={[styles.card, { opacity: 0.1, backgroundColor: '#000' }]} />
            ))}
          </View>
        </View>

        {/* PLAYER HAND */}
        <View style={[styles.tableCard, { borderColor: currentLocation.theme.primary }]}>
          <Text style={styles.sectionLabel}>YOUR HAND</Text>
          <View style={styles.cardRow}>{playerHand.map((card, idx) => renderCard(card, idx))}</View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsSection}>

          {/* Chip Selector for Ante (Only in idle) */}
          <View style={{ opacity: gamePhase === 'idle' ? 1 : 0.5 }}>
            <CustomChipSelector
              chips={currentLocation.chips}
              selectedChip={baseBet}
              onSelect={(val) => {
                if (gamePhase === 'idle') {
                  actions.setAnte(val);
                }
              }}
              gameTheme={currentLocation.theme}
            />
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.betDisplay}>
              <Text style={styles.betLabel}>TOTAL BET</Text>
              <Text style={styles.betValueText}>${currentBet.toLocaleString()}</Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              {gamePhase !== 'idle' && gamePhase !== 'showdown' && (
                <Pressable
                  onPress={actions.handleRegame}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                >
                  <Text style={styles.secondaryText}>FOLD</Text>
                </Pressable>
              )}

              <Pressable
                onPress={actions.playHand}
                disabled={(gamePhase === 'idle' && baseBet <= 0)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: currentLocation.theme.primary },
                  pressed && { opacity: 0.8 },
                  (gamePhase === 'idle' && baseBet <= 0) && { opacity: 0.5 }
                ]}>
                <Text style={styles.primaryText}>
                  {gamePhase === 'idle' ? 'DEAL' : gamePhase === 'showdown' ? 'NEW HAND' : 'CHECK / CALL'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default PokerGameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 50 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  limitPill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  limitText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800' },

  boardCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    minHeight: 140,
    alignItems: 'center'
  },
  tableCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    minHeight: 140,
    alignItems: 'center'
  },
  sectionLabel: { color: '#9CA3AF', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 4 },

  cardRow: { flexDirection: 'row', gap: 8 },
  card: {
    width: 60,
    height: 84,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  cardHidden: { backgroundColor: '#B91C1C', borderWidth: 2, borderColor: '#FFF' },
  cardBack: { fontSize: 32 },
  cardRank: { fontSize: 20, fontWeight: '900', color: '#111827' },
  cardSuit: { fontSize: 20 },

  controlsSection: { marginTop: 'auto', gap: 16 },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 80
  },
  betDisplay: { gap: 2 },
  betLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700' },
  betValueText: { color: '#F3F4F6', fontSize: 20, fontWeight: '800' },

  actionButtons: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120
  },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonPressed: { opacity: 0.7 },
  secondaryText: { color: '#EF4444', fontWeight: '800', fontSize: 14 },
});