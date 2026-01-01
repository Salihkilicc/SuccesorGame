import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../components/layout/AppScreen';
import { theme } from '../../theme';
import GameResultPopup from './components/GameResultPopup';
import { usePokerLogic, Card } from './logic/usePokerLogic'; // Logic yolunu kontrol et

const PokerGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount ?? 10_000;

  // Tüm mantık hook'ta
  const { state, actions } = usePokerLogic(initialBet);
  const { playerHand, board, revealedBoard, status, resultPopup, gamePhase, currentBet, money } = state;

  // Kart Çizdirme Helper
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
    <AppScreen
      title="Texas Shuffle"
      subtitle="Progressive Hold’em"
      leftNode={
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }
      rightNode={
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.exitButton, pressed && styles.exitButtonPressed]}>
          <Text style={styles.exitText}>EXIT</Text>
        </Pressable>
      }>

      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.betBox}>
            <Text style={styles.betLabel}>Total Bet</Text>
            <Text style={styles.betValue}>${currentBet.toLocaleString()}</Text>
          </View>
        </View>

        {/* ORTA MASA (Board) */}
        <View style={styles.boardCard}>
          <Text style={styles.sectionLabel}>Board</Text>
          <View style={styles.cardRow}>
            {board.slice(0, revealedBoard).map((card, idx) => renderCard(card, idx))}
            {board.slice(revealedBoard).map((card, idx) => renderCard(card, idx + revealedBoard, true))}
          </View>
        </View>

        {/* OYUNCU ELİ */}
        <View style={styles.tableCard}>
          <Text style={styles.sectionLabel}>You</Text>
          <View style={styles.cardRow}>{playerHand.map((card, idx) => renderCard(card, idx))}</View>
        </View>

        {/* BUTONLAR */}
        <View style={styles.buttonRow}>
          {gamePhase !== 'idle' && gamePhase !== 'showdown' && (
            <Pressable
              onPress={actions.handleRegame}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryText}>REGAME (FOLD)</Text>
            </Pressable>
          )}

          <Pressable
            onPress={actions.playHand}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, { flex: 1 }]}>
            <Text style={styles.primaryText}>
              {gamePhase === 'idle' ? 'DEAL HAND' : gamePhase === 'showdown' ? 'NEW HAND' : 'CONTINUE'}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </AppScreen>
  );
};

export default PokerGameScreen;

// STYLES (Orijinal ile aynı, buraya kopyala-yapıştır yapabilirsin)
const styles = StyleSheet.create({
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  betBox: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'flex-end' },
  betLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption },
  betValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  tableCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm },
  boardCard: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm },
  sectionLabel: { color: theme.colors.textPrimary, fontWeight: '800' },
  cardRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  card: { width: 60, height: 84, borderRadius: theme.radius.md, backgroundColor: theme.colors.cardSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs },
  cardHidden: { backgroundColor: '#2A2D3A' },
  cardBack: { fontSize: 40, color: theme.colors.textMuted },
  cardRank: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  cardSuit: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  primaryButton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.lg, alignItems: 'center' },
  primaryButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  primaryText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 1 },
  backButton: { width: 42, height: 42, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardSoft },
  backButtonPressed: { transform: [{ scale: 0.96 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: 18 },
  exitButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  exitButtonPressed: { opacity: 0.7 },
  exitText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.md },
  secondaryButton: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  secondaryButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  secondaryText: { color: theme.colors.textSecondary, fontWeight: '800', fontSize: theme.typography.body },
});