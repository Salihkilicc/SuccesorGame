// src/features/casino/screens/CasinoScreen.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStatsStore } from '../../../core/store';

import { useCasinoSystem } from '../hooks/useCasinoSystem';
import CasinoHeader from '../components/CasinoHeader';
import CasinoLocationModal from '../components/CasinoLocationModal';
import { GameRoomCard } from '../components/GameRoomCard';

const CasinoScreen = () => {
  const navigation = useNavigation<any>();
  const { money } = useStatsStore();

  // Use the new hook for Logic & State
  const {
    currentLocation,
    currentLocationId,
    setCurrentLocationId,
    unlockedLocations,
    casinoReputation
  } = useCasinoSystem();

  // Local UI States
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // HANDLERS
  const handleGamePress = (screenName: string, params?: any) => {
    // Navigate directly to the game. 
    // The game screen handles betting via CustomChipSelector.
    navigation.navigate(screenName, {
      ...params,
      betAmount: 0, // Let game screen initialize or set default
      locationId: currentLocation.id
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

      {/* 1. HEADER */}
      <CasinoHeader
        onBack={() => navigation.goBack()}
        location={currentLocation}
        reputation={casinoReputation}
        cash={money}
        onLocationPress={() => setLocationModalVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2. GAME LOBBY */}
        <View style={styles.gameSection}>
          <Text style={styles.sectionHeader}>HIGH ROLLER SUITE</Text>

          {/* BLACKJACK */}
          <GameRoomCard
            title="Blackjack"
            subtitle="High Stakes Tables"
            image={require('../assets/blackjack_thumb.png')}
            onPress={() => handleGamePress('BlackjackGame', { title: 'Blackjack 21' })}
          />

          {/* ROULETTE */}
          <GameRoomCard
            title="Roulette"
            subtitle="European & American"
            image={require('../assets/roulette_thumb.png')}
            onPress={() => handleGamePress('RouletteGame', { title: 'European Roulette' })}
          />

          {/* SLOTS */}
          <GameRoomCard
            title="Slots"
            subtitle="Progressive Jackpots"
            image={require('../assets/slots_thumb.png')}
            onPress={() => handleGamePress('SlotsGame', { title: 'Slots' })}
          />

          {/* POKER */}
          <GameRoomCard
            title="Poker"
            subtitle="Texas Hold'em"
            image={require('../assets/poker_thumb.png')}
            onPress={() => handleGamePress('PokerGame', { title: "Texas Hold'em" })}
          />
        </View>
      </ScrollView>

      {/* 3. MODALS */}
      <CasinoLocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        currentLocationId={currentLocationId}
        unlockedLocations={unlockedLocations}
        onSelectLocation={setCurrentLocationId}
      />

    </SafeAreaView>
  );
};

export default CasinoScreen;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' }, // Dark bg
  content: { paddingBottom: 40, paddingTop: 20 },

  // Headers
  sectionHeader: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center'
  },

  // Game Section
  gameSection: {
    paddingHorizontal: 16,
    gap: 16
  }
});