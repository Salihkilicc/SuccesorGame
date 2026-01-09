import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useAchievementStore } from '../../core/store/useAchievementStore';
import { ACHIEVEMENTS } from '../../achievements/achievements';
import { theme } from '../../core/theme';

const AchievementToast = () => {
  const { lastUnlockedId } = useAchievementStore();
  const [visible, setVisible] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const achievement = ACHIEVEMENTS.find(a => a.id === lastUnlockedId);

  useEffect(() => {
    if (!achievement) return;
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
        setVisible(false),
      );
    }, 2500);
    return () => clearTimeout(timer);
  }, [achievement, opacity]);

  if (!visible || !achievement) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.icon}>🏅</Text>
      <Text style={styles.text}>Achievement unlocked: {achievement.title}</Text>
    </Animated.View>
  );
};

export default AchievementToast;

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    flex: 1,
    fontWeight: '700',
  },
});
