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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  tabPressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: '#A0A0A0',
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  labelActive: {
    color: '#D4AF37',
  },
});
