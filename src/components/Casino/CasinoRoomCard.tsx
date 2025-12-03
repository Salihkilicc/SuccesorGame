import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';

type Props = {
  name: string;
  requirement: string;
  locked: boolean;
  onPress: () => void;
};

const CasinoRoomCard = ({name, requirement, locked, onPress}: Props) => {
  const content = (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{name}</Text>
        {locked ? <Text style={styles.lockedTag}>LOCKED</Text> : null}
      </View>
      <Text style={styles.requirement}>{requirement}</Text>
    </View>
  );

  if (locked) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({pressed}) => [
      styles.card,
      pressed && styles.cardPressed,
    ]}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <Text style={styles.requirement}>{requirement}</Text>
    </Pressable>
  );
};

export default CasinoRoomCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#f3f4f6',
    transform: [{scale: 0.99}],
  },
  cardLocked: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  requirement: {
    fontSize: 13,
    color: '#4b5563',
  },
  lockedTag: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
});
