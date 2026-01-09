import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import type { CategoryKey } from './marketTypes';

type Props = {
  initial?: CategoryKey;
  onChange?: (value: CategoryKey) => void;
};

const CATEGORIES: CategoryKey[] = ['bonds', 'crypto', 'stocks'];

const CategoryTabs = ({ initial = 'bonds', onChange }: Props) => {
  const [active, setActive] = useState<CategoryKey>(initial);

  useEffect(() => {
    onChange?.(active);
  }, [active, onChange]);

  return (
    <View style={styles.container}>
      {CATEGORIES.map(item => {
        const isActive = active === item;
        return (
          <Pressable
            key={item}
            onPress={() => setActive(item)}
            style={({ pressed }) => [styles.tab, isActive && styles.tabActive, pressed && styles.tabPressed]}>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default CategoryTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  tabPressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  labelActive: {
    color: theme.colors.accent,
  },
});
