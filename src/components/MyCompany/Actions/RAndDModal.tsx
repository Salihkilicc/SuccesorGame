import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useStatsStore, TechLevels } from '../../../core/store';
import { checkAllAchievementsAfterStateChange } from '../../../achievements/checker';
import { theme } from '../../../core/theme';

export type RAndDModalProps = {
  visible: boolean;
  onClose: () => void;
  onResult?: (success: boolean) => void;
};

type TechCategory = keyof TechLevels;

interface TechUpgrade {
  level: number;
  cost: number;
  title: string;
  reward: string;
  req?: { category: TechCategory; level: number };
}

const TECH_TREE: Record<TechCategory, TechUpgrade[]> = {
  hardware: [
    { level: 1, cost: 0, title: 'Basic Accessories', reward: 'Start' },
    { level: 2, cost: 1_000_000_000, title: 'Miniaturization', reward: 'Unlocks MyPhone' },
    { level: 3, cost: 4_200_000_000, title: 'Silicon Processors', reward: 'Unlocks MyMac' },
    { level: 4, cost: 10_500_000_000, title: 'Wearable Sensors', reward: 'Unlocks MyWatch & MyPods' },
  ],
  software: [
    { level: 1, cost: 0, title: 'Basic OS', reward: 'Start' },
    { level: 2, cost: 1_800_000_000, title: 'Cloud Integration', reward: 'Unlocks MyPad' },
    { level: 3, cost: 7_000_000_000, title: 'MyAI Integration', reward: 'Sales Price limit +20% & Demand Boost' },
  ],
  future: [
    { level: 1, cost: 0, title: 'Research Lab', reward: 'Requires Hardware Lvl 4 to Unlock', req: { category: 'hardware', level: 4 } },
    { level: 2, cost: 35_000_000_000, title: 'Autonomous Driving', reward: 'Unlocks MyCar' },
    { level: 3, cost: 70_000_000_000, title: 'Spatial Computing', reward: 'Unlocks MyVision' },
  ],
};

const RAndDModal = ({ visible, onClose, onResult }: RAndDModalProps) => {
  const { companyCapital, setField, techLevels, setTechLevel } = useStatsStore();

  const handleUpgrade = (category: TechCategory, nextLevel: number, cost: number) => {
    if (companyCapital < cost) {
      Alert.alert('Insufficient Funds', "Your company doesn't have enough capital for this investment.");
      return;
    }

    setField('companyCapital', companyCapital - cost);
    setTechLevel(category, nextLevel);

    // Find the upgrade info for messages
    const upgradeInfo = TECH_TREE[category].find(u => u.level === nextLevel);
    if (upgradeInfo) {
      Alert.alert('Research Complete', `You have unlocked: ${upgradeInfo.title}!`);
    }

    checkAllAchievementsAfterStateChange();
    onResult?.(true);
  };

  const renderCategory = (category: TechCategory, label: string) => {
    const currentLevel = techLevels[category];
    const upgrades = TECH_TREE[category];
    const nextUpgrade = upgrades.find(u => u.level === currentLevel + 1);
    const isMaxLevel = currentLevel >= upgrades[upgrades.length - 1].level;

    // Check requirements (specifically for Future category starting)
    // Actually, Future Level 1 requirement is special.
    // If we are at level 1 (default) and want to go to level 2, fine.
    // But if we are "at level 0" conceptually? No, everything starts at 1.
    // The requirement for Future is to even *start*. But the object says Level 1 req: Hardware 4.
    // So if Future is Level 1, we check if we meet requirements.
    // If not, we show "Locked".

    let isLocked = false;
    let lockReason = '';

    // Special verification for Category C Level 1 visibility/status
    if (category === 'future' && currentLevel === 1) {
      const req = upgrades[0].req; // Level 1 block
      if (req && techLevels[req.category] < req.level) {
        isLocked = true;
        lockReason = `Requires ${req.category} Lv${req.level}`;
      }
    }

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{label}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv. {currentLevel}</Text>
          </View>
        </View>

        {/* Progress Bar of sorts or steps */}
        <View style={styles.stepsContainer}>
          {upgrades.map((u) => {
            const isActive = u.level <= currentLevel;
            return (
              <View key={u.level} style={[styles.stepDot, isActive && styles.stepDotActive]} />
            );
          })}
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.currentStatusLabel}>Current Tech:</Text>
          <Text style={styles.currentStatusValue}>
            {upgrades.find(u => u.level === currentLevel)?.title || 'Unknown'}
          </Text>
        </View>

        {!isMaxLevel && nextUpgrade && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Next: {nextUpgrade.title}</Text>
            <Text style={styles.upgradeReward}>{nextUpgrade.reward}</Text>

            {isLocked ? (
              <View style={styles.lockedBtn}>
                <Text style={styles.lockedText}>LOCKED ({lockReason})</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleUpgrade(category, nextUpgrade.level, nextUpgrade.cost)}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  pressed && styles.upgradeBtnPressed,
                  companyCapital < nextUpgrade.cost && styles.upgradeBtnDisabled
                ]}>
                <Text style={styles.upgradeBtnText}>
                  Upgrade (${nextUpgrade.cost / 1_000_000_000}B)
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {isMaxLevel && (
          <View style={styles.maxLevelContainer}>
            <Text style={styles.maxLevelText}>MAX LEVEL REACHED</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>R&D Labs</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Invest in technology to unlock new products.</Text>
          <Text style={styles.capitalText}>Available Capital: ${(companyCapital / 1_000_000_000).toFixed(2)}B</Text>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderCategory('hardware', 'Category A: Hardware Engineering')}
            {renderCategory('software', 'Category B: Software & Ecosystem')}
            {renderCategory('future', 'Category C: Future Projects')}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default RAndDModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  closeIcon: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  capitalText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 0,
  },
  categoryContainer: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  levelBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  stepsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.colors.success,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  currentStatusLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  currentStatusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  upgradeCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  upgradeReward: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  upgradeBtn: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  upgradeBtnPressed: {
    opacity: 0.8,
  },
  upgradeBtnDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  upgradeBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  lockedBtn: {
    backgroundColor: theme.colors.cardSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  lockedText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  maxLevelContainer: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.success + '20',
    borderRadius: theme.radius.sm,
  },
  maxLevelText: {
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
});
