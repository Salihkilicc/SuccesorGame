import React, {useState} from 'react';
import {ScrollView, View, Text, StyleSheet, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import RoomSelector from '../../components/Casino/RoomSelector';
import BetModal from '../../components/Casino/BetModal';
import type {RoomId} from '../../components/Casino/RoomSelector';
import {useStatsStore, useUserStore, useEventStore} from '../../store';
import {triggerEvent} from '../../event/eventEngine';
import type {AssetsStackParamList} from '../../navigation';
import {theme} from '../../theme';
import {checkAllAchievementsAfterStateChange} from '../../achievements/checker';
import AppScreen from '../../components/layout/AppScreen';

const CasinoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const {hasPremium} = useUserStore();
  const {lastCasinoEvent} = useEventStore();
  const {casinoReputation, setCasinoReputation, netWorth, charisma, money} = useStatsStore();
  const [selectedRoom, setSelectedRoom] = useState<RoomId | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleRoomSelect = (roomId: RoomId) => {
    setSelectedRoom(roomId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRoom(null);
  };

  const handleBetResult = ({win}: {win: boolean; amount: number}) => {
    const delta = win ? 3 : -2;
    const nextRep = Math.min(100, Math.max(0, casinoReputation + delta));
    setCasinoReputation(nextRep);
    console.log(`[Casino] Result ${win ? 'WIN' : 'LOSE'} | rep ${nextRep}`);
    checkAllAchievementsAfterStateChange();
    // Future: triggerEvent('casino') for streak-based events.
  };

  return (
    <AppScreen title="CASINO" subtitle="Risk • Luck • Reputation">
      <View style={styles.infoStrip}>
        <Text style={styles.infoText}>💰 Current Cash: ${money.toLocaleString()}</Text>
        <Text style={styles.infoText}>
          ⭐ Casino Reputation: {casinoReputation}/100
          {casinoReputation >= 70 ? ' • You’re becoming a regular here.' : ''}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <RoomSelector
            hasPremium={hasPremium}
            netWorth={netWorth}
            charisma={charisma}
            onRoomSelect={handleRoomSelect}
            onRequestPremium={() => navigation.navigate('Premium')}
          />
        </View>

        <View style={styles.section}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs}}>
            <Text style={styles.eventIcon}>🎲</Text>
            <Text style={styles.sectionTitle}>Last Casino Event</Text>
          </View>
          <Text style={styles.eventText}>
            {lastCasinoEvent ?? 'Henüz özel bir casino olayı yaşanmadı.'}
          </Text>
          <Pressable
            onPress={() => {
              void triggerEvent('casino');
            }}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Trigger Casino Event (Test)</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BetModal
        visible={modalVisible}
        roomId={selectedRoom}
        onClose={handleCloseModal}
        onBetResult={handleBetResult}
      />
    </AppScreen>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  infoStrip: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
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
  },
  eventIcon: {
    fontSize: 16,
  },
  eventText: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
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
});
