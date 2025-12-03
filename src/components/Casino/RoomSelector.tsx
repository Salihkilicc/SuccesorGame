import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';

export type RoomId = 'standard' | 'high' | 'vip' | 'ultra';

type RoomSelectorProps = {
  onRoomSelect: (roomId: RoomId) => void;
  hasPremium: boolean;
};

const ROOMS: Array<{
  id: RoomId;
  label: string;
  minBet: string;
  emoji: string;
  premium?: boolean;
}> = [
  {id: 'standard', label: 'Standard Room', minBet: '$1K', emoji: '🎰'},
  {id: 'high', label: 'High Roller', minBet: '$10K', emoji: '🔥'},
  {id: 'vip', label: 'VIP Room', minBet: '$50K — premium required', emoji: '💎', premium: true},
  {id: 'ultra', label: 'Ultra VIP', minBet: '$250K — premium required', emoji: '🃏', premium: true},
];

const RoomSelector = ({onRoomSelect, hasPremium}: RoomSelectorProps) => (
  <View style={styles.container}>
    {ROOMS.map(room => {
      const locked = room.premium && !hasPremium;
      return (
        <Pressable
          key={room.id}
          onPress={() => (!locked ? onRoomSelect(room.id) : null)}
          style={({pressed}) => [
            styles.card,
            locked && styles.cardLocked,
            pressed && !locked && styles.cardPressed,
          ]}>
          <View style={styles.row}>
            <Text style={styles.emoji}>{room.emoji}</Text>
            <View style={{flex: 1}}>
              <Text style={styles.label}>{room.label}</Text>
              <Text style={styles.meta}>Min bet: {room.minBet}</Text>
            </View>
            {room.premium ? (
              <Text style={[styles.badge, locked && styles.badgeLocked]}>PREMIUM</Text>
            ) : null}
          </View>
        </Pressable>
      );
    })}
  </View>
);

export default RoomSelector;

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    backgroundColor: '#0F1424',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
  },
  cardLocked: {
    opacity: 0.4,
  },
  cardPressed: {
    backgroundColor: '#131A2D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    color: '#E6ECF7',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#9AA7BC',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#1B2340',
    color: '#E6ECF7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  badgeLocked: {
    backgroundColor: '#2B1B1B',
    color: '#F87171',
    borderColor: '#5C2626',
  },
});
