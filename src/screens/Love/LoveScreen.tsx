import React from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStatsStore, useUserStore, useEventStore} from '../../store';
import type {RootTabParamList, LoveStackParamList} from '../../navigation';
import PartnerCard from '../../components/Love/PartnerCard';
import LoveActionButton from '../../components/Love/LoveActionButton';
import MatchPopup from '../../components/Match/MatchPopup';
import {useMatchSystem} from '../../components/Match/useMatchSystem';
import {triggerEvent} from '../../event/eventEngine';
import {theme} from '../../theme';
import AppScreen from '../../components/layout/AppScreen';

type LoveNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LoveStackParamList, 'LoveHome'>,
  BottomTabNavigationProp<RootTabParamList, 'Love'>
>;

const ACTIONS = [
  {label: 'Message', emoji: '💬', description: 'Soft interaction'},
  {label: 'Gift', emoji: '🎁', description: 'Small surprise'},
  {label: 'Date', emoji: '🍷', description: 'Plan a special moment'},
  {label: 'Intimacy', emoji: '❤️', description: 'More intense vibe'},
] as const;

const LoveScreen = () => {
  const navigation = useNavigation<LoveNavigationProp>();
  const {charisma, luck} = useStatsStore();
  const {partner} = useUserStore();
  const {lastLoveEvent, usedLoveActionToday, setField} = useEventStore();
  const {
    visible,
    matchCandidate,
    openMatch,
    closeMatch,
    acceptMatch,
    rejectMatch,
  } = useMatchSystem();

  const handleGoHome = () => {
    const rootNav = navigation.getParent()?.getParent();
    if (rootNav) {
      rootNav.navigate('Home' as never);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleFindMatch = () => {
    console.log('[Love] Find match placeholder');
    navigation.navigate('Life', {screen: 'LifeHome'});
  };

  const handleActionPress = (action: string) => {
    console.log(`[Love] Action pressed: ${action}`);
    if (!usedLoveActionToday) {
      setField('usedLoveActionToday', true);
    }
  };

  return (
    <AppScreen
      title="LOVE"
      subtitle="Relationship & Emotions"
      leftNode={
        <Pressable
          onPress={handleGoHome}
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.statRow}>
          <Text style={styles.stat}>Charisma: {charisma}</Text>
          <Text style={styles.stat}>Luck: {luck}</Text>
        </View>

          {partner ? (
            <PartnerCard partner={partner} usedToday={usedLoveActionToday} />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💔</Text>
              <Text style={styles.emptyTitle}>Henüz bir partnerin yok.</Text>
              <Text style={styles.emptyBody}>
                Life ekranında tanışacağın kişiler kaderini değiştirebilir.
              </Text>
              <Pressable
                onPress={() => openMatch()}
                style={({pressed}) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}>
                <Text style={styles.ctaButtonText}>Find Match</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map(action => (
                <LoveActionButton
                  key={action.label}
                  title={action.label}
                  emoji={action.emoji}
                  description={action.description}
                  onPress={() => handleActionPress(action.label)}
                  disabled={usedLoveActionToday}
                />
              ))}
            </View>
            <Text style={styles.helperText}>
              {usedLoveActionToday
                ? 'Bugünkü etkileşimini kullandın.'
                : 'Bugün 1 aksiyon hakkın var.'}
            </Text>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Love Event</Text>
          <View style={styles.eventCard}>
            <Text style={styles.eventIcon}>💌</Text>
            <Text style={styles.placeholderText}>
              {lastLoveEvent ?? 'Bugün henüz özel bir aşk olayı yaşanmadı.'}
            </Text>
            <Pressable
              onPress={() => {
                void triggerEvent('love');
              }}
              style={({pressed}) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Trigger Love Event (Test)</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <MatchPopup
        visible={visible}
        candidate={matchCandidate}
        onAccept={acceptMatch}
        onReject={rejectMatch}
        onClose={closeMatch}
      />
    </AppScreen>
  );
};

export default LoveScreen;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  stat: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.cardSoft,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  ctaButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.98}],
  },
  ctaButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  eventIcon: {
    fontSize: 18,
  },
  placeholderText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.97}],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
});
