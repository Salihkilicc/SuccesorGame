// @orphan-todo casino came off the shelf with this already unmounted. It is
// leftover from the module's own history rather than new debt, and it is
// listed here so the casino's clean-up pass has a worklist instead of a
// memory. Kept, not deleted.
import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import { theme } from '../../../core/theme';

type Props = {
  name: string;
  requirement: string;
  locked: boolean;
  onPress: () => void;
};

const CasinoRoomCard = ({name, requirement, locked, onPress}: Props) => {
    useLocale();
  const content = (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{name}</Text>
        {locked ? <Text style={styles.lockedTag}>{t('ui.locked')}</Text> : null}
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
    backgroundColor: '#323A40',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#1C242C',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#323A40',
    transform: [{scale: 0.99}],
  },
  cardLocked: {
    backgroundColor: '#323A40',
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: theme.colors.textPrimary,
  },
  requirement: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  lockedTag: {
    backgroundColor: '#323A40',
    color: theme.colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
});
