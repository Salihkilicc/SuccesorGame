import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PremiumBadge from '../common/PremiumBadge';
import { useUserStore } from '../../core/store';
import type { AssetsStackParamList } from '../../navigation';
import { theme } from '../../core/theme';

const StockInfoSection = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const { hasPremium } = useUserStore();

  const goPremium = () => navigation.navigate('Premium');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Info</Text>
      <Text style={styles.row}>🎯 Target Price: $165</Text>
      <Text style={styles.row}>
        Company Bio: Yapay zeka donanım sektöründe yükselen bir firma.
      </Text>
      <View style={styles.sentimentChip}>
        <Text style={styles.sentimentText}>Market Sentiment: Mildly Positive</Text>
      </View>
      <View style={styles.expertCard}>
        {hasPremium ? (
          <View style={styles.expertRow}>
            <PremiumBadge size="small" />
            <Text style={styles.expertText}>Analyst: Orta vadede güçlü AL bölgesi.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.lockedText}>Expert yorumları Premium ile açılır.</Text>
            <Pressable
              onPress={goPremium}
              style={({ pressed }) => [styles.goPremiumButton, pressed && styles.goPremiumButtonPressed]}>
              <Text style={styles.goPremiumLabel}>Go Premium</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

export default StockInfoSection;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  row: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  expertCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  expertText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '600',
    flex: 1,
  },
  lockedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  sentimentChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sentimentText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  goPremiumButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  goPremiumButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  goPremiumLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
});
