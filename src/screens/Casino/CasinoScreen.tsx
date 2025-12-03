import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import StatBar from '../../components/common/StatBar';
import RoomSelector from '../../components/Casino/RoomSelector';
import BetModal from '../../components/Casino/BetModal';
import type {RoomId} from '../../components/Casino/RoomSelector';
import {useStatsStore, useUserStore, useEventStore, useGameStore} from '../../store';
import {triggerEvent} from '../../event/eventEngine';

const CasinoScreen = () => {
  const {hasPremium} = useUserStore();
  const {lastCasinoEvent} = useEventStore();
  const {currentDay} = useGameStore();
  const {casinoReputation, setCasinoReputation} = useStatsStore();
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
    // Future: triggerEvent('casino') for streak-based events.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatBar />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>CASINO</Text>
          <Text style={styles.subtitle}>Day {currentDay} • Risk • Luck • Reputation</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Selector</Text>
          <RoomSelector hasPremium={hasPremium} onRoomSelect={handleRoomSelect} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Casino Event 🚬</Text>
          <Text style={styles.eventText}>
            {lastCasinoEvent ?? 'Henüz bir casino olayı yaşanmadı.'}
          </Text>
          <Pressable
            onPress={() => {
              void triggerEvent('casino');
            }}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Trigger Casino Event</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BetModal
        visible={modalVisible}
        roomId={selectedRoom}
        onClose={handleCloseModal}
        onBetResult={handleBetResult}
      />
    </SafeAreaView>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E8EDF5',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3AEC2',
  },
  section: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  eventText: {
    fontSize: 13,
    color: '#A3AEC2',
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#1B2340',
    paddingVertical: 12,
    borderRadius: 10,
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
