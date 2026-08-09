import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStatsStore, TechLevels } from '../../../core/store';
import { checkAllAchievementsAfterStateChange } from '../../../achievements/checker';
import ScreenHeader from '../../common/ScreenHeader';
import { theme } from '../../../core/theme';
import { formatMoney } from '../../../core/utils';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';

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
    { level: 1, cost: 0, get title() { return t('action.basicAccessories'); }, reward: 'Start' },
    { level: 2, cost: 1_000_000_000, get title() { return t('action.miniaturization'); }, reward: 'Unlocks MyPhone' },
    { level: 3, cost: 4_200_000_000, get title() { return t('action.siliconProcessors'); }, reward: 'Unlocks MyMac' },
    { level: 4, cost: 10_500_000_000, get title() { return t('action.wearableSensors'); }, reward: 'Unlocks MyWatch & MyPods' },
  ],
  software: [
    { level: 1, cost: 0, get title() { return t('action.basicOs'); }, reward: 'Start' },
    { level: 2, cost: 1_800_000_000, get title() { return t('action.cloudIntegration'); }, reward: 'Unlocks MyPad' },
    { level: 3, cost: 7_000_000_000, get title() { return t('action.myaiIntegration'); }, reward: 'Sales Price limit +20% & Demand Boost' },
  ],
  future: [
    { level: 1, cost: 0, get title() { return t('action.researchLab'); }, reward: 'Requires Hardware Lvl 4 to Unlock', req: { category: 'hardware', level: 4 } },
    { level: 2, cost: 35_000_000_000, get title() { return t('action.autonomousDriving'); }, reward: 'Unlocks MyCar' },
    { level: 3, cost: 70_000_000_000, get title() { return t('action.spatialComputing'); }, reward: 'Unlocks MyVision' },
  ],
};

const RAndDModal = ({ visible, onClose, onResult }: RAndDModalProps) => {
    // This component is superseded by RAndDModalRevised below (which is the
    // default export). Kept per the no-deletion rule, and kept compiling.
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        cancelLabel?: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);

    useLocale();
  const navigation = useNavigation<any>();
  const { companyCapital, setField, techLevels, setTechLevel } = useStatsStore();

  const handleUpgrade = (category: TechCategory, nextLevel: number, cost: number) => {
    if (companyCapital < cost) {
      setPanel({
        title: t('alert.insufficientFunds'),
        summary: "Your company doesn't have enough capital for this investment.",
        lines: [
          { label: 'Cost', value: formatMoney(cost) },
          { label: 'You have', value: formatMoney(companyCapital), strong: true },
        ],
        confirmLabel: 'OK',
        tone: 'danger',
      });
      return;
    }

    setField('companyCapital', companyCapital - cost);
    setTechLevel(category, nextLevel);

    // Find the upgrade info for messages
    const upgradeInfo = TECH_TREE[category].find(u => u.level === nextLevel);
    if (upgradeInfo) {
      setPanel({
        title: t('alert.researchComplete'),
        summary: `You have unlocked: ${upgradeInfo.title}`,
        lines: [{ label: 'Spent', value: formatMoney(cost) }],
        confirmLabel: 'OK',
      });
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
            <Text style={styles.levelText}>{t('action.lvV1', { v1: currentLevel })}</Text>
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
          <Text style={styles.currentStatusLabel}>{t('action.currentTech')}</Text>
          <Text style={styles.currentStatusValue}>
            {upgrades.find(u => u.level === currentLevel)?.title || 'Unknown'}
          </Text>
        </View>

        {!isMaxLevel && nextUpgrade && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>{t('action.nextV1', { v1: nextUpgrade.title })}</Text>
            <Text style={styles.upgradeReward}>{nextUpgrade.reward}</Text>

            {isLocked ? (
              <View style={styles.lockedBtn}>
                <Text style={styles.lockedText}>{t('action.lockedV1', { v1: lockReason })}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleUpgrade(category, nextUpgrade.level, nextUpgrade.cost)}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  pressed && styles.upgradeBtnPressed,
                  companyCapital < nextUpgrade.cost && styles.upgradeBtnDisabled
                ]}>
                <Text style={styles.upgradeBtnText}>{t('action.upgradeV1B', { v1: nextUpgrade.cost / 1_000_000_000 })}</Text>
              </Pressable>
            )}
          </View>
        )}

        {isMaxLevel && (
          <View style={styles.maxLevelContainer}>
            <Text style={styles.maxLevelText}>{t('action.maxLevelReached')}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleHomePress = () => {
    onClose();
    navigation.navigate('Home');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScreenHeader
            title={t('action.rDLabs')}
            onBack={onClose}
            inset={false}
            category="research"
          />
          <Text style={styles.subtitle}>{t('action.investInTechnologyToUnlock')}</Text>
          <Text style={styles.capitalText}>{t('action.availableCapitalV1', { v1: formatMoney(companyCapital) })}</Text>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {renderCategory('hardware', 'Category A: Hardware Engineering')}
            {renderCategory('software', 'Category B: Software & Ecosystem')}
            {renderCategory('future', 'Category C: Future Projects')}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Persistent Bottom Bar - Absolute inside the Card or Backdrop? 
              Since this modal is a 'Card' in center, adding a full width bottom bar might look weird if inside the card.
              However, the user asked for "bottom stat bar... into every page inner pages".
              Since this looks like a Dialog/Popup, maybe putting it at the bottom of the SCREEN (outside the card) is better?
              But the Backdrop has padding. 
              
              Let's put it fixed at the bottom of the BACKDROP (screen).
          */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          </View>

        </View>

        {/* Actually, BottomStatsBar has absolute positioning. 
             If I put it inside 'backdrop', I need to be careful. 
             'backdrop' has padding.
             Better to put it OUTSIDE 'card', but inside 'backdrop'.
             Or structure: <Modal><View style={{flex:1}}><Backdrop><Card/></Backdrop><BottomBar/></View></Modal>
             
             Let's change the structure slightly to support full screen usage.
         */}
      </View>

      {/* Re-implementing structure to ensure bar is at screen bottom */}
    </Modal>
  );
};
// Revamped Modal to allow Bottom Bar outside the centered card
const RAndDModalRevised = ({ visible, onClose, onResult }: RAndDModalProps) => {
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        cancelLabel?: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);

  const navigation = useNavigation<any>();
  const { companyCapital, setField, techLevels, setTechLevel } = useStatsStore(); // Added missing props logic

  // ... logic ...
  // (Repeating logic is verbose, I'll stick to the previous Component definition but adjust JSX)

  const handleUpgrade = (category: TechCategory, nextLevel: number, cost: number) => {
    if (companyCapital < cost) {
      setPanel({
        title: t('alert.insufficientFunds'),
        summary: "Your company doesn't have enough capital for this investment.",
        lines: [
          { label: 'Cost', value: formatMoney(cost) },
          { label: 'You have', value: formatMoney(companyCapital), strong: true },
        ],
        confirmLabel: 'OK',
        tone: 'danger',
      });
      return;
    }

    setField('companyCapital', companyCapital - cost);
    setTechLevel(category, nextLevel);

    // Find the upgrade info for messages
    const upgradeInfo = TECH_TREE[category].find(u => u.level === nextLevel);
    if (upgradeInfo) {
      setPanel({
        title: t('alert.researchComplete'),
        summary: `You have unlocked: ${upgradeInfo.title}`,
        lines: [{ label: 'Spent', value: formatMoney(cost) }],
        confirmLabel: 'OK',
      });
    }

    checkAllAchievementsAfterStateChange();
    onResult?.(true);
  };

  const renderCategory = (category: TechCategory, label: string) => {
    // ... same renderCategory logic ...
    const currentLevel = techLevels[category];
    const upgrades = TECH_TREE[category];
    const nextUpgrade = upgrades.find(u => u.level === currentLevel + 1);
    const isMaxLevel = currentLevel >= upgrades[upgrades.length - 1].level;

    let isLocked = false;
    let lockReason = '';

    if (category === 'future' && currentLevel === 1) {
      const req = upgrades[0].req;
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
            <Text style={styles.levelText}>{t('action.lvV1', { v1: currentLevel })}</Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          {upgrades.map((u) => {
            const isActive = u.level <= currentLevel;
            return (
              <View key={u.level} style={[styles.stepDot, isActive && styles.stepDotActive]} />
            );
          })}
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.currentStatusLabel}>{t('action.currentTech')}</Text>
          <Text style={styles.currentStatusValue}>
            {upgrades.find(u => u.level === currentLevel)?.title || 'Unknown'}
          </Text>
        </View>

        {!isMaxLevel && nextUpgrade && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>{t('action.nextV1', { v1: nextUpgrade.title })}</Text>
            <Text style={styles.upgradeReward}>{nextUpgrade.reward}</Text>

            {isLocked ? (
              <View style={styles.lockedBtn}>
                <Text style={styles.lockedText}>{t('action.lockedV1', { v1: lockReason })}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleUpgrade(category, nextUpgrade.level, nextUpgrade.cost)}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  pressed && styles.upgradeBtnPressed,
                  companyCapital < nextUpgrade.cost && styles.upgradeBtnDisabled
                ]}>
                <Text style={styles.upgradeBtnText}>{t('action.upgradeV1B', { v1: nextUpgrade.cost / 1_000_000_000 })}</Text>
              </Pressable>
            )}
          </View>
        )}

        {isMaxLevel && (
          <View style={styles.maxLevelContainer}>
            <Text style={styles.maxLevelText}>{t('action.maxLevelReached')}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleHomePress = () => {
    onClose();
    navigation.navigate('Home');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Full Screen Container */}
      <View style={{ flex: 1 }}>

        {/* Backdrop with reduced opacity for outside click or just visual */}
        <View style={styles.backdrop}>

          {/* The Card */}
          <View style={styles.card}>
            <ScreenHeader
              title={t('action.rDLabs')}
              onBack={onClose}
              inset={false}
              category="research"
            />
            <Text style={styles.subtitle}>{t('action.investInTechnologyToUnlock')}</Text>
            <Text style={styles.capitalText}>{t('action.availableCapitalV1', { v1: formatMoney(companyCapital) })}</Text>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {renderCategory('hardware', 'Category A: Hardware Engineering')}
              {renderCategory('software', 'Category B: Software & Ecosystem')}
              {renderCategory('future', 'Category C: Future Projects')}
            </ScrollView>
          </View>

        </View>

        {/* Bottom Bar fixed at bottom of screen, outside backdrop padding/centering */}
      </View>
    
            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                note={panel?.note}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                cancelLabel={panel?.cancelLabel}
                onConfirm={panel?.onConfirm}
                onCancel={() => setPanel(null)}
            />
        </Modal>
  );
};

export default RAndDModalRevised;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,36,44,0.8)',
    justifyContent: 'center',
    padding: theme.spacing.md,
    paddingBottom: 80, // Make room for bottom bar if card is long
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    maxHeight: '85%', // Reduce height to not overlap navbar
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
    color: theme.colors.onLight,
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
    backgroundColor: theme.colors.accent,
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
    // Grey rather than a dark tone, so the label stays black in BOTH states.
    // The enabled fill is the bright blue and takes black text; if disabled
    // went dark, the same label would have to be white and could not be.
    backgroundColor: theme.colors.disabled,
    opacity: 0.6,
  },
  upgradeBtnText: {
    color: theme.colors.onLight,
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
    backgroundColor: theme.colors.accent + '20',
    borderRadius: theme.radius.sm,
  },
  maxLevelText: {
    // The badge is `success + '20'` - a 12.5% TINT, not a cyan fill. It
    // resolves to #23335D over the card, and cyan on that measures 5.28.
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
});
