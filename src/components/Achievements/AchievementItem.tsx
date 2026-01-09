import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Achievement } from '../../achievements/achievements';
import { theme } from '../../core/theme';
import { useAchievementStore } from '../../core/store/useAchievementStore';

type Props = {
  achievement: Achievement;
};

const AchievementItem = ({ achievement }: Props) => {
  const { unlockedIds } = useAchievementStore();
  const unlocked = unlockedIds.includes(achievement.id);
  const isHidden = achievement.hidden && !unlocked;

  const title = isHidden ? '???' : achievement.title;
  const description = isHidden ? 'Secret achievement' : achievement.description;

  return (
    <View style={[styles.card, unlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{achievement.category.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Text style={[styles.status, unlocked ? styles.statusUnlocked : styles.statusLocked]}>
          {unlocked ? '✓' : '🔒'}
        </Text>
      </View>
    </View>
  );
};

export default AchievementItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardUnlocked: {
    borderColor: theme.colors.success,
  },
  cardLocked: {
    opacity: 0.95,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  category: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.6,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    marginTop: theme.spacing.xs,
  },
  status: {
    fontSize: 18,
  },
  statusUnlocked: {
    color: theme.colors.success,
  },
  statusLocked: {
    color: theme.colors.textMuted,
  },
});
