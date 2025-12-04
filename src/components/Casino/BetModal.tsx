import React, {useMemo} from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {useStatsStore} from '../../store';
import type {RoomId} from './RoomSelector';
import {theme} from '../../theme';

type BetModalProps = {
  visible: boolean;
  roomId: RoomId | null;
  onClose: () => void;
  onBetResult: (result: {win: boolean; amount: number}) => void;
};

const MIN_BETS: Record<RoomId, number> = {
  standard: 1_000,
  high: 10_000,
  vip: 50_000,
  ultra: 250_000,
};

const BetModal = ({visible, roomId, onClose, onBetResult}: BetModalProps) => {
  const {money, luck, riskApetite, setField} = useStatsStore();
  const minBet = useMemo(() => (roomId ? MIN_BETS[roomId] : 0), [roomId]);

  const handleBet = (multiplier: number) => {
    if (!roomId) {
      return;
    }
    const betAmount = minBet * multiplier;
    if (money < betAmount) {
      console.log('[Casino] Not enough money for bet');
      return;
    }

    const baseChance =
      roomId === 'ultra'
        ? 0.38
        : roomId === 'vip'
        ? 0.44
        : roomId === 'high'
        ? 0.5
        : 0.55;
    const luckFactor = luck * 0.002; // 0-0.2
    const riskFactor = (riskApetite - 50) * 0.001; // slight tilt based on appetite
    const finalChance = Math.max(0.05, Math.min(0.95, baseChance + luckFactor + riskFactor));
    const win = Math.random() < finalChance;

    const delta = win ? betAmount : -betAmount;
    setField('money', money + delta);
    console.log(
      `[Casino] Result ${win ? 'WIN' : 'LOSE'} | Bet ${betAmount} | Chance ${
        Math.round(finalChance * 1000) / 10
      }% (placeholder)`,
    );
    // TODO: Later hook into eventEngine for streaks/bonuses.

    onBetResult({win, amount: betAmount});
    onClose();
  };

  const title =
    roomId === 'ultra'
      ? 'ULTRA VIP ROOM'
      : roomId === 'vip'
      ? 'VIP ROOM'
      : roomId === 'high'
      ? 'HIGH ROLLER ROOM'
      : 'STANDARD ROOM';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Min bet: ${minBet.toLocaleString()} — Luck & Risk Appetite influence odds.
          </Text>

          <View style={styles.betRow}>
            {[1, 2, 5].map(multiplier => (
              <Pressable
                key={multiplier}
                onPress={() => handleBet(multiplier)}
                style={({pressed}) => [
                  styles.betButton,
                  pressed && styles.betButtonPressed,
                ]}>
                <Text style={styles.betButtonText}>
                  Bet {multiplier}x (${(minBet * multiplier).toLocaleString()})
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({pressed}) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Text style={styles.helper}>Feeling lucky? Play smart, keep your rep high.</Text>
        </View>
      </View>
    </Modal>
  );
};

export default BetModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 440,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.subtitle + 4,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  betRow: {
    gap: theme.spacing.sm,
  },
  betButton: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  betButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  betButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  closeButton: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  helper: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontSize: theme.typography.caption,
  },
});
