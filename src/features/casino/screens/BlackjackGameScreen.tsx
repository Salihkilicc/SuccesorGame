// src/features/casino/screens/BlackjackGameScreen.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup';
import { useBlackjackLogic, Card } from '../logic/useBlackjackLogic';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import { CustomChipSelector } from '../components/CustomChipSelector';

const BlackjackGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount ?? 500;

  // Global Casino System for Theme & Rep
  const { currentLocation, casinoReputation } = useCasinoSystem();

  // Logic Hook
  const { state, actions } = useBlackjackLogic(initialBet);
  const { playerCards, dealerCards, bet, roundState, status, resultPopup, playerTotal, dealerTotal, money } = state;

  // Krupiyenin kapalı kartı sadece oyuncu oynarken gizli
  const hideDealerHole = roundState === 'player';

  // Kart Bileşeni (Render Helper)
  const renderCard = (card: Card, idx: number) => (
    <View key={`${card.rank}${card.suit}-${idx}`} style={styles.card}>
      <Text style={styles.cardRank}>{card.rank}</Text>
      <Text style={[styles.cardSuit, { color: ['♥', '♦'].includes(card.suit) ? '#ef4444' : '#e2e8f0' }]}>
        {card.suit}
      </Text>
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

        {/* INFO BAR */}
        <View style={styles.topRow}>
          <Text style={[styles.statusText, { color: currentLocation.theme.primary }]}>
            {status.toUpperCase()}
          </Text>
          <View style={styles.limitPill}>
            <Text style={styles.limitText}>MAX BET: ${(currentLocation.maxBet).toLocaleString()}</Text>
          </View>
        </View>

        {/* DEALER HAND */}
        <View style={[styles.handCard, { borderColor: currentLocation.theme.secondary }]}>
          <Text style={styles.handLabel}>DEALER ({!hideDealerHole ? dealerTotal : '?'})</Text>
          <View style={styles.cardRow}>
            {dealerCards.map((card, idx) => {
              if (idx === 1 && hideDealerHole) {
                return (
                  <View key={`hidden-${idx}`} style={[styles.card, styles.hiddenCard]}>
                    <Text style={styles.cardRank}>?</Text>
                  </View>
                );
              }
              return renderCard(card, idx);
            })}
          </View>
        </View>

        {/* LOGO / TABLE CENTER */}
        <View style={styles.tableCenter}>
          <Text style={[styles.tableLogo, { color: currentLocation.theme.primary, opacity: 0.2 }]}>
            BLACKJACK PAYS 3:2
          </Text>
        </View>

        {/* PLAYER HAND */}
        <View style={[styles.handCard, { borderColor: currentLocation.theme.primary }]}>
          <Text style={styles.handLabel}>YOU ({playerTotal})</Text>
          <View style={styles.cardRow}>{playerCards.map(renderCard)}</View>
        </View>

        {/* BET CONTROLS */}
        <View style={styles.controlsSection}>

          {/* Only show chips if in betting phase (idle or dealing?) 
               Actually for blackjack, we usually bet before deal. 
               If roundState is 'player' or 'dealer', betting is locked. 
          {/* Only show chips if in betting phase */}
          <View style={{ opacity: roundState === 'player' ? 0.5 : 1 }}>
            <CustomChipSelector
              chips={currentLocation.chips}
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
              <Text style={styles.betLabel}>BET</Text>
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
                  <Text style={styles.primaryText}>{roundState === 'done' ? 'NEW DEAL' : 'DEAL'}</Text>
                </Pressable>
              )}

              {/* HIT / STAND */}
              {roundState === 'player' && (
                <>
                  <Pressable onPress={actions.hit} style={({ pressed }) => [styles.gameBtn, styles.hitBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <Text style={styles.gameBtnText}>HIT</Text>
                  </Pressable>
                  <Pressable onPress={actions.stand} style={({ pressed }) => [styles.gameBtn, styles.standBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <Text style={styles.gameBtnText}>STAND</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 50 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  limitPill: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  limitText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600' },

  handCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    minHeight: 140
  },
  handLabel: { color: '#9CA3AF', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  cardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  card: {
    width: 64,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2
  },
  hiddenCard: { backgroundColor: '#B91C1C', borderWidth: 2, borderColor: '#FFF' },
  cardRank: { fontSize: 20, fontWeight: '900', color: '#111827' },
  cardSuit: { fontSize: 20 },

  tableCenter: { alignItems: 'center', paddingVertical: 10 },
  tableLogo: { fontWeight: '900', fontSize: 14, letterSpacing: 2 },

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
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120
  },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  gameBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 90,
    alignItems: 'center'
  },
  hitBtn: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
  standBtn: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  gameBtnText: { color: '#FFF', fontWeight: '900' }
});