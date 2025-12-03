import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StatBar from '../../components/common/StatBar';
import MatchPopup from '../../components/Match/MatchPopup';
import {useMatchSystem} from '../../components/Match/useMatchSystem';
import {triggerEvent} from '../../event/eventEngine';
import type {LifeStackParamList, RootTabParamList} from '../../navigation';
import {useEventStore, useGameStore} from '../../store';

type LifeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LifeStackParamList, 'LifeHome'>,
  BottomTabNavigationProp<RootTabParamList, 'Life'>
>;

type LifeActionType =
  | 'nightOut'
  | 'spa'
  | 'gym'
  | 'shopping'
  | 'travel'
  | 'casino';

type LifeActionButtonProps = {
  emoji: string;
  label: string;
  description: string;
  onPress: () => void;
};

const ACTIONS: Array<{
  key: LifeActionType;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    key: 'nightOut',
    label: 'Night Out',
    description: 'Celebrate with friends',
    emoji: '🎉',
  },
  {
    key: 'spa',
    label: 'Spa & Relax',
    description: 'Reset your mind and body',
    emoji: '🧖',
  },
  {
    key: 'gym',
    label: 'Gym',
    description: 'Train discipline and strength',
    emoji: '🏋️',
  },
  {
    key: 'shopping',
    label: 'Shopping',
    description: 'Upgrade your lifestyle',
    emoji: '🛍',
  },
  {
    key: 'travel',
    label: 'Travel',
    description: 'Change your scenery',
    emoji: '✈️',
  },
  {
    key: 'casino',
    label: 'Casino',
    description: 'High risk, high thrill',
    emoji: '🎰',
  },
];

const LifeScreen = () => {
  const navigation = useNavigation<LifeNavigationProp>();
  const {lastLifeEvent} = useEventStore();
  const {currentDay, advanceDay} = useGameStore();
  const {
    visible,
    matchCandidate,
    openMatch,
    closeMatch,
    acceptMatch,
    rejectMatch,
  } = useMatchSystem();

  const handleAction = (type: LifeActionType) => {
    switch (type) {
      case 'nightOut':
        console.log('[Life] Action triggered: Night Out');
        break;
      case 'spa':
        console.log('[Life] Action triggered: Spa & Relax');
        break;
      case 'gym':
        console.log('[Life] Action triggered: Gym');
        break;
      case 'shopping':
        console.log('[Life] Action triggered: Shopping');
        break;
      case 'travel':
        console.log('[Life] Action triggered: Travel');
        break;
      case 'casino':
        console.log('[Life] Navigating to Casino');
        navigation.navigate('Assets', {screen: 'Casino'});
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatBar />
      <View style={styles.body}>
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.title}>LIFE</Text>
          <Text style={styles.subtitle}>Day {currentDay} — Downtown District</Text>
        </View>
        <Pressable
          onPress={advanceDay}
          style={({pressed}) => [
            styles.nextDayButton,
            pressed && styles.nextDayButtonPressed,
          ]}>
          <Text style={styles.nextDayText}>Next Day</Text>
        </Pressable>
      </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map(action => (
                <LifeActionButton
                  key={action.key}
                  emoji={action.emoji}
                  label={action.label}
                  description={action.description}
                  onPress={() => handleAction(action.key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Life Event</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {lastLifeEvent ?? 'Bugün henüz özel bir sosyal olay yaşanmadı.'}
              </Text>
              <Pressable
                onPress={() => {
                  void triggerEvent('life');
                }}
                style={({pressed}) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}>
                <Text style={styles.secondaryButtonText}>Random Life Event</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encounters & Matches</Text>
            <Text style={styles.placeholderText}>
              Burada Tinder-style eşleşme pop-up&apos;ları tetiklenecek.
            </Text>
            <Pressable
              onPress={openMatch}
              style={({pressed}) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Test Match Popup</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <MatchPopup
        visible={visible}
        candidate={matchCandidate}
        onAccept={acceptMatch}
        onReject={rejectMatch}
        onClose={closeMatch}
      />
    </SafeAreaView>
  );
};

const LifeActionButton = ({
  emoji,
  label,
  description,
  onPress,
}: LifeActionButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.actionButton,
      pressed && styles.actionButtonPressed,
    ]}>
    <View style={styles.actionHeader}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
    <Text style={styles.actionDescription}>{description}</Text>
  </Pressable>
);

export default LifeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 16,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E8EDF5',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3AEC2',
  },
  nextDayButton: {
    backgroundColor: '#1B2340',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  nextDayButtonPressed: {
    backgroundColor: '#202A4A',
    transform: [{scale: 0.98}],
  },
  nextDayText: {
    color: '#E6ECF7',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#0F1424',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
  },
  actionButtonPressed: {
    backgroundColor: '#131A2D',
    transform: [{scale: 0.98}],
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6ECF7',
  },
  actionDescription: {
    fontSize: 12,
    color: '#9AA7BC',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#0F1424',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
    gap: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#D8DEEC',
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9AA7BC',
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#1B2340',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  secondaryButtonPressed: {
    backgroundColor: '#202A4A',
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: '#E6ECF7',
    fontWeight: '700',
    fontSize: 14,
  },
});
