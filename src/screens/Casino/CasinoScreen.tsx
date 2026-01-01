// src/screens/Casino/CasinoScreen.tsx
import React, { useState, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useStatsStore } from '../../store';
import CasinoBetModal from './components/CasinoBetModal';

// --- YENİ DOSYALARDAN IMPORTLAR ---
import { CASINO_LOCATIONS, SLOT_VARIANTS, HIGH_ROLLER_SLOT, LocationId } from './casinoData';
import {
  CasinoHeader,
  ReputationSection,
  LocationSelector,
  GameRow,
  SlotCard,
  HighRollerCard,
  SectionTitle
} from './components/CasinoUI';

type PendingGame = {
  type: 'SlotsGame' | 'RouletteGame' | 'PokerGame' | 'BlackjackGame';
  title: string;
  params?: any;
};

const CasinoScreen = () => {
  const navigation = useNavigation<any>();
  const { casinoReputation, money } = useStatsStore();

  // STATES
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('greece');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [betModalVisible, setBetModalVisible] = useState(false);
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);

  const currentLocation = useMemo(() => CASINO_LOCATIONS.find(l => l.id === selectedLocation) || CASINO_LOCATIONS[0], [selectedLocation]);

  // HANDLERS
  const handleGamePress = (type: PendingGame['type'], title: string, params?: any) => {
    setPendingGame({ type, title, params });
    setBetModalVisible(true);
  };

  const handlePlayGame = (betAmount: number) => {
    setBetModalVisible(false);
    if (pendingGame) {
      navigation.navigate(pendingGame.type, { ...pendingGame.params, betAmount });
    }
    setPendingGame(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* 1. HEADER */}
      <CasinoHeader onBack={() => navigation.goBack()} money={money} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 2. TOP INFO (Location & Rep) */}
        <View style={styles.topRow}>
          <LocationSelector name={currentLocation.name} onPress={() => setLocationModalVisible(true)} />
          <ReputationSection reputation={casinoReputation} />
        </View>

        {/* 3. GAME LIST */}

        {/* SLOTS */}
        <View style={styles.section}>
          <SectionTitle title="Slots" />
          <View style={styles.slotGrid}>
            {SLOT_VARIANTS.map(item => (
              <SlotCard
                key={item.id}
                title={item.title}
                icon={item.icon}
                note={item.note}
                onPress={() => handleGamePress('SlotsGame', item.title, { variant: item.id })}
              />
            ))}
          </View>
        </View>

        {/* HIGH ROLLER */}
        <View style={styles.section}>
          <HighRollerCard
            {...HIGH_ROLLER_SLOT}
            onPress={() => handleGamePress('SlotsGame', HIGH_ROLLER_SLOT.title, { variant: HIGH_ROLLER_SLOT.id })}
          />
        </View>

        {/* TABLE GAMES */}
        <View style={styles.section}>
          <SectionTitle title="Roulette" />
          <GameRow
            title="European Roulette"
            note="Single zero, tailored limits"
            onPress={() => handleGamePress('RouletteGame', 'European Roulette')}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Texas Shuffle" />
          <GameRow
            title="Texas Hold'em"
            note="Heads-up energy"
            onPress={() => handleGamePress('PokerGame', "Texas Hold'em")}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Blackjack" />
          <GameRow
            title="Blackjack 21"
            note="Smooth dealing, quick payouts"
            onPress={() => handleGamePress('BlackjackGame', 'Blackjack 21')}
          />
        </View>

      </ScrollView>

      {/* 4. MODALS (Yerel olarak kalabilirler veya ayrı dosyaya da alınabilirler) */}
      <CasinoBetModal
        visible={betModalVisible}
        onClose={() => setBetModalVisible(false)}
        onPlay={handlePlayGame}
        gameTitle={pendingGame?.title ?? 'Game'}
        minBet={10000}
        maxBet={100000}
      />

      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        selectedId={selectedLocation}
        onSelect={(id) => { setSelectedLocation(id); setLocationModalVisible(false); }}
      />
    </SafeAreaView>
  );
};

export default CasinoScreen;

// --- LOCATION MODAL COMPONENT (Sadece bu dosyada kullanılıyor, burada kalabilir) ---
const LocationModal = ({ visible, onClose, selectedId, onSelect }: { visible: boolean, onClose: () => void, selectedId: LocationId, onSelect: (id: LocationId) => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
        <Text style={styles.modalTitle}>Select Casino Location</Text>
        <View style={{ gap: 8 }}>
          {CASINO_LOCATIONS.map(loc => {
            const isGreece = loc.id === 'greece';
            return (
              <Pressable
                key={loc.id}
                disabled={!isGreece}
                onPress={() => isGreece && onSelect(loc.id)}
                style={[
                  styles.modalOption,
                  selectedId === loc.id && styles.modalOptionSelected,
                  !isGreece && { opacity: 0.5 },
                ]}>
                <Text style={[styles.modalOptionText, !isGreece && { color: theme.colors.textMuted }]}>
                  {loc.name}
                </Text>
                {!isGreece && <Text style={{ fontSize: 14 }}>🔒</Text>}
                {isGreece && selectedId === loc.id && <Text style={{ color: theme.colors.accent }}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.xl, paddingBottom: theme.spacing.xl * 2 },
  topRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  section: { gap: theme.spacing.md },
  slotGrid: { flexDirection: 'row', gap: theme.spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: '#1E2230', borderRadius: 24, padding: 24, gap: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
  modalOptionSelected: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent, borderWidth: 1 },
  modalOptionText: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
});