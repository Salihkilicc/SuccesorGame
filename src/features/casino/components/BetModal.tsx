import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import type { RoomId } from './RoomSelector';
import { theme } from '../../../core/theme';
import GameModal from '../../../components/common/GameModal';
import GameButton from '../../../components/common/GameButton';

type BetModalProps = {
  visible: boolean;
  roomId: RoomId | null;
  onClose: () => void;
  onBetResult: (result: { win: boolean; amount: number }) => void;
};

const MIN_BETS: Record<RoomId, number> = {
  standard: 1_000,
  high: 10_000,
  vip: 50_000,
  ultra: 250_000,
};

const BetModal = ({ visible, roomId, onClose, onBetResult }: BetModalProps) => {
  const { money, setField } = useStatsStore();
  const { hidden, personality } = usePlayerStore();
  const luck = hidden.luck;
  const riskApetite = personality.riskAppetite;

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
      `[Casino] Result ${win ? 'WIN' : 'LOSE'} | Bet ${betAmount} | Chance ${Math.round(finalChance * 1000) / 10
      }% (placeholder)`,
    );
    // TODO: Later hook into eventEngine for streaks/bonuses.

    onBetResult({ win, amount: betAmount });
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
    <GameModal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={`Min bet: $${minBet.toLocaleString()} — Luck & Risk Appetite influence odds.`}
    >
      <View style={styles.betRow}>
        {[1, 2, 5].map(multiplier => (
          <GameButton
            key={multiplier}
            title={`Bet ${multiplier}x ($${(minBet * multiplier).toLocaleString()})`}
            onPress={() => handleBet(multiplier)}
            variant="primary"
            style={styles.betButton}
            textStyle={styles.betButtonText}
          />
        ))}
      </View>

      <GameButton
        title="Close"
        onPress={onClose}
        variant="ghost"
        style={styles.closeButton}
      />
      <Text style={styles.helper}>Feeling lucky? Play smart, keep your rep high.</Text>
    </GameModal>
  );
};

export default BetModal;

const styles = StyleSheet.create({
  betRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  betButton: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  betButtonText: {
    color: theme.colors.accent,
  },
  closeButton: {
    marginTop: theme.spacing.sm,
  },
  helper: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.lg,
  },
});
