// src/features/casino/screens/BlackjackGameScreen.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppScreen from '../../../components/layout/AppScreen'; // Yolunu kontrol et
import { theme } from '../../../core/theme';
import GameResultPopup from '../components/GameResultPopup'; // Yolunu kontrol et
import { useBlackjackLogic, Card } from '../logic/useBlackjackLogic'; // Yeni hook

const BlackjackGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialBet = route.params?.betAmount ?? 5000;

  // Tüm mantığı hook'tan çekiyoruz
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
    <AppScreen
      title="Blackjack"
      subtitle="Beat the dealer to 21"
      leftNode={
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>

      <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO BAR */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Bankroll ${money.toLocaleString()}</Text>
            <Text style={styles.subtitle}>{status}</Text>
          </View>
          <View style={styles.betBox}>
            <Text style={styles.betLabel}>Bet</Text>
            <Text style={styles.betValue}>${bet.toLocaleString()}</Text>
          </View>
        </View>

        {/* DEALER HAND */}
        <View style={styles.handCard}>
          <Text style={styles.handLabel}>Dealer</Text>
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
          {!hideDealerHole && <Text style={styles.totalText}>Total: {dealerTotal}</Text>}
        </View>

        {/* PLAYER HAND */}
        <View style={styles.handCard}>
          <Text style={styles.handLabel}>You</Text>
          <View style={styles.cardRow}>{playerCards.map(renderCard)}</View>
          <Text style={styles.totalText}>Total: {playerTotal}</Text>
        </View>

        {/* CONTROLS */}
        <View style={styles.betControls}>
          <Pressable onPress={() => actions.adjustBet(-1000)} disabled={roundState === 'player'} style={({ pressed }) => [styles.betButton, pressed && styles.betButtonPressed, roundState === 'player' && styles.disabledButton]}>
            <Text style={styles.betButtonText}>-</Text>
          </Pressable>
          <Pressable onPress={() => actions.adjustBet(1000)} disabled={roundState === 'player'} style={({ pressed }) => [styles.betButton, pressed && styles.betButtonPressed, roundState === 'player' && styles.disabledButton]}>
            <Text style={styles.betButtonText}>+</Text>
          </Pressable>
          <Pressable onPress={actions.deal} disabled={roundState === 'player'} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, roundState === 'player' && styles.disabledButton]}>
            <Text style={styles.primaryText}>DEAL</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={actions.hit} disabled={roundState !== 'player'} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed, roundState !== 'player' && styles.disabledButton]}>
            <Text style={styles.secondaryText}>HIT</Text>
          </Pressable>
          <Pressable onPress={actions.stand} disabled={roundState !== 'player'} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed, roundState !== 'player' && styles.disabledButton]}>
            <Text style={styles.secondaryText}>STAND</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

export default BlackjackGameScreen;

// STYLES (Aynen koruyoruz, sadece dosyanın sonuna ekle)
const styles = StyleSheet.create({
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  betBox: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'flex-end' },
  betLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption },
  betValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  handCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm },
  handLabel: { color: theme.colors.textPrimary, fontWeight: '800' },
  cardRow: { flexDirection: 'row', gap: theme.spacing.sm },
  card: { width: 60, height: 84, borderRadius: theme.radius.md, backgroundColor: theme.colors.cardSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs },
  hiddenCard: { backgroundColor: theme.colors.background },
  cardRank: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  cardSuit: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  totalText: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
  betControls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  betButton: { width: 48, height: 48, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardSoft },
  betButtonPressed: { transform: [{ scale: 0.97 }] },
  betButtonText: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
  primaryButton: { flex: 1, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md },
  primaryButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  primaryText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 1 },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  secondaryButton: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  secondaryButtonPressed: { transform: [{ scale: 0.98 }] },
  secondaryText: { color: theme.colors.textPrimary, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
  backButton: { width: 42, height: 42, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardSoft },
  backButtonPressed: { transform: [{ scale: 0.96 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: 18 },
});