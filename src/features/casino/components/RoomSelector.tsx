import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PremiumBadge from '../../../components/common/PremiumBadge';
import SectionCard from '../../../components/common/SectionCard';
import { theme } from '../../../core/theme';

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
    { id: 'standard', label: 'Standard Room', minBet: '$1K', emoji: '🎰', flavor: 'Casual bets & chill vibe.' },
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

const RoomSelector = ({ onRoomSelect, hasPremium, netWorth, charisma, onRequestPremium }: RoomSelectorProps) => {
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

        const lockReason = lockedByPremium
          ? 'Premium required'
          : room.id === 'high'
            ? `Net worth $${MIN_HIGH_NET_WORTH.toLocaleString()}+ or Cha 60+`
            : `Net worth $${room.minNetWorth?.toLocaleString()}+ required`;

        return (
          <SectionCard
            key={room.id}
            title={`${room.emoji} ${room.label}`}
            subtitle={room.flavor}
            rightText={locked ? 'LOCKED' : room.minBet}
            onPress={handlePress}
            style={[styles.card, locked && styles.cardLocked]}
            danger={locked}
          />
        );
      })}
    </View>
  );
};

export default RoomSelector;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.sm,
  },
  cardLocked: {
    opacity: 0.7,
  },
});
