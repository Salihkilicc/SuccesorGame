import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import PremiumBadge from '../common/PremiumBadge';
import {theme} from '../../theme';

export type RoomId = 'standard' | 'high' | 'vip' | 'ultra';

type RoomSelectorProps = {
  onRoomSelect: (roomId: RoomId) => void;
  hasPremium: boolean;
  netWorth: number;
  charisma: number;
  onRequestPremium?: () => void;
};

const MIN_HIGH_NET_WORTH = 100_000;
const MIN_ULTRA_NET_WORTH = 1_000_000;

const ROOMS: Array<{
  id: RoomId;
  label: string;
  minBet: string;
  emoji: string;
  requiresPremium?: boolean;
  minNetWorth?: number;
  minCharisma?: number;
  flavor?: string;
}> = [
  {id: 'standard', label: 'Standard Room', minBet: '$1K', emoji: '🎰', flavor: 'Casual bets & chill vibe.'},
  {
    id: 'high',
    label: 'High Roller',
    minBet: '$10K',
    emoji: '🔥',
    minNetWorth: MIN_HIGH_NET_WORTH,
    minCharisma: 60,
    flavor: 'Serious money, serious faces.',
  },
  {
    id: 'vip',
    label: 'VIP Room',
    minBet: '$50K — premium required',
    emoji: '💎',
    requiresPremium: true,
    flavor: 'Private tables & signature drinks.',
  },
  {
    id: 'ultra',
    label: 'Ultra VIP',
    minBet: '$250K — premium + $1M NW',
    emoji: '🃏',
    requiresPremium: true,
    minNetWorth: MIN_ULTRA_NET_WORTH,
    flavor: 'Only legends play here.',
  },
];

const RoomSelector = ({onRoomSelect, hasPremium, netWorth, charisma, onRequestPremium}: RoomSelectorProps) => {
  return (
    <View style={styles.container}>
      {ROOMS.map(room => {
        const lockedByPremium = room.requiresPremium && !hasPremium;
        const lockedByNetWorth =
          typeof room.minNetWorth === 'number' ? netWorth < room.minNetWorth : false;
        const lockedByCharisma =
          typeof room.minCharisma === 'number' ? charisma < room.minCharisma : false;
        const lockedHighRoller =
          room.id === 'high' ? lockedByNetWorth && lockedByCharisma : false;
        const locked =
          lockedByPremium || (room.id === 'high' ? lockedHighRoller : lockedByNetWorth || lockedByCharisma);

        const handlePress = () => {
          if (lockedByPremium && onRequestPremium) {
            onRequestPremium();
            return;
          }
          if (locked) {
            console.log(`[Casino] Locked room: ${room.id}`);
            return;
          }
          onRoomSelect(room.id);
        };

        return (
          <Pressable
            key={room.id}
            onPress={handlePress}
            style={({pressed}) => [
              styles.card,
              locked && styles.cardLocked,
              pressed && !locked && styles.cardPressed,
            ]}>
            <View style={styles.cardTop}>
              <Text style={styles.emoji}>{room.emoji}</Text>
              {room.requiresPremium ? (
                <PremiumBadge
                  size="small"
                  style={locked ? styles.premiumBadgeLocked : undefined}
                />
              ) : null}
              {locked ? <Text style={styles.lockBadge}>LOCKED</Text> : null}
            </View>
            <Text style={styles.label}>{room.label}</Text>
            <Text style={styles.meta}>Min Bet: {room.minBet}</Text>
            <Text style={styles.flavor}>{room.flavor}</Text>
            {locked ? (
              <Text style={styles.lockReason}>
                {lockedByPremium
                  ? 'Premium gerekli.'
                  : room.id === 'high'
                  ? `Net worth ${MIN_HIGH_NET_WORTH.toLocaleString()}$+ veya charisma 60+ gerekli.`
                  : `Net worth ${room.minNetWorth?.toLocaleString()}$+ gerekli.`}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

export default RoomSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.99}],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    marginTop: 2,
  },
  flavor: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  lockReason: {
    color: theme.colors.warning,
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  premiumBadgeLocked: {
    opacity: 0.8,
  },
  lockBadge: {
    backgroundColor: theme.colors.textMuted,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.typography.caption,
    overflow: 'hidden',
  },
});
