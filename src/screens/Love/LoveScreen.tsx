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
import {useStatsStore, useUserStore, useEventStore} from '../../store';
import type {RootTabParamList, LoveStackParamList} from '../../navigation';
import PartnerCard from '../../components/Love/PartnerCard';
import LoveActionButton from '../../components/Love/LoveActionButton';
import MatchPopup from '../../components/Match/MatchPopup';
import {useMatchSystem} from '../../components/Match/useMatchSystem';
import {triggerEvent} from '../../event/eventEngine';
import {useGameStore} from '../../store';

type LoveNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LoveStackParamList, 'LoveHome'>,
  BottomTabNavigationProp<RootTabParamList, 'Love'>
>;

const ACTIONS = [
  {label: 'Message', emoji: '💬'},
  {label: 'Gift', emoji: '🎁'},
  {label: 'Date', emoji: '🍷'},
  {label: 'Intimacy', emoji: '❤️'},
] as const;

const LoveScreen = () => {
  const navigation = useNavigation<LoveNavigationProp>();
  const {charisma, luck} = useStatsStore();
  const {partner} = useUserStore();
  const {lastLoveEvent, usedLoveActionToday, setField} = useEventStore();
  const {currentDay} = useGameStore();
  const {
    visible,
    matchCandidate,
    openMatch,
    closeMatch,
    acceptMatch,
    rejectMatch,
  } = useMatchSystem();

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Love</Text>
            <Text style={styles.day}>Day {currentDay}</Text>
          </View>
          <Text style={styles.subtitle}>
            Nurture connections, track mood, and plan your next move.
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.stat}>Charisma: {charisma}</Text>
          <Text style={styles.stat}>Luck: {luck}</Text>
        </View>

        {partner ? (
          <PartnerCard partner={partner} usedToday={usedLoveActionToday} />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz bir partnerin yok.</Text>
            <Text style={styles.emptyBody}>
              Life ekranında eşleşme bulabilirsin. Hazırlıklarını tamamla ve
              ilk adımı at.
            </Text>
            <Pressable
              onPress={() => openMatch()}
              style={({pressed}) => [
                styles.matchButton,
                pressed && styles.matchButtonPressed,
              ]}>
              <Text style={styles.matchButtonText}>Find Partner</Text>
            </Pressable>
            <Pressable
              onPress={handleFindMatch}
              style={({pressed}) => [
                styles.matchButton,
                pressed && styles.matchButtonPressed,
              ]}>
              <Text style={styles.matchButtonText}>
                Find Match (placeholder)
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Actions</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map(action => (
              <LoveActionButton
                key={action.label}
                label={action.label}
                emoji={action.emoji}
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
          <Pressable
            onPress={() => {
              void triggerEvent('love');
            }}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Trigger Love Event</Text>
          </Pressable>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              {lastLoveEvent ?? 'Bugün henüz özel bir olay yaşamadın.'}
            </Text>
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
    </SafeAreaView>
  );
};

export default LoveScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
  },
  day: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  matchButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  matchButtonPressed: {
    backgroundColor: '#0b1220',
    transform: [{scale: 0.98}],
  },
  matchButtonText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    color: '#4b5563',
  },
  placeholderCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: '#0b1220',
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 15,
  },
});
