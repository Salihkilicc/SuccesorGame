import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useStatsStore } from '../../store';
import type { CasinoStackParamList } from '../../navigation';
import CasinoBetModal from './components/CasinoBetModal';

type LocationId =
  | 'greece'
  | 'las_vegas'
  | 'monaco'
  | 'montenegro'
  | 'macau'
  | 'singapore';

type CasinoLocation = {
  id: LocationId;
  name: string;
  requirement: number;
};

const CASINO_LOCATIONS: CasinoLocation[] = [
  { id: 'greece', name: 'Greece', requirement: 0 },
  { id: 'las_vegas', name: 'Las Vegas', requirement: 20 },
  { id: 'monaco', name: 'Monaco', requirement: 40 },
  { id: 'montenegro', name: 'Montenegro', requirement: 30 },
  { id: 'macau', name: 'Macau', requirement: 50 },
  { id: 'singapore', name: 'Singapore', requirement: 60 },
];

const SLOT_VARIANTS: Array<{
  id: CasinoStackParamList['SlotsGame']['variant'];
  title: string;
  icon: string;
  note: string;
  isHighRoller?: boolean;
}> = [
    {
      id: 'street_fighter',
      title: 'Street Fighter Slots',
      icon: '🎮',
      note: 'Volatility: Medium',
    },
    {
      id: 'poseidon',
      title: "Poseidon's Fortune",
      icon: '🌊',
      note: 'Volatility: Medium-High',
    },
  ];

const HIGH_ROLLER_SLOT = {
  id: 'high_roller',
  title: 'High Roller Deluxe',
  icon: '💎',
  note: 'Volatility: High',
} as const;

type PendingGame = {
  type: 'SlotsGame' | 'RouletteGame' | 'PokerGame' | 'BlackjackGame';
  title: string;
  params?: any;
};

const CasinoScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasinoStackParamList>>();
  const { casinoReputation, money } = useStatsStore();
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('greece');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Phase 2: Bet Modal State
  const [betModalVisible, setBetModalVisible] = useState(false);
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null);

  const reputationValue = useMemo(
    () => Math.max(0, Math.min(100, Math.round(casinoReputation ?? 0))),
    [casinoReputation],
  );

  const location = useMemo(
    () =>
      CASINO_LOCATIONS.find(item => item.id === selectedLocation) ??
      CASINO_LOCATIONS[0],
    [selectedLocation],
  );

  const handleSelectLocation = (target: CasinoLocation) => {
    if (target.id !== 'greece') {
      return;
    }
    setSelectedLocation(target.id);
    setLocationModalVisible(false);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // --- Game Launch Logic ---
  const handleGamePress = (
    type: PendingGame['type'],
    title: string,
    params?: any
  ) => {
    setPendingGame({ type, title, params });
    setBetModalVisible(true);
  };

  const handlePlayGame = (betAmount: number) => {
    setBetModalVisible(false);
    if (pendingGame) {
      navigation.navigate(pendingGame.type as any, {
        ...pendingGame.params,
        betAmount, // Pass the chosen bet amount
      });
    }
    setPendingGame(null);
  };

  const renderSlotCard = (item: typeof SLOT_VARIANTS[number]) => (
    <Pressable
      key={item.id}
      onPress={() => handleGamePress('SlotsGame', item.title, { variant: item.id })}
      style={({ pressed }) => [styles.slotCard, pressed && styles.cardPressed]}>
      <Text style={styles.slotIcon}>{item.icon}</Text>
      <Text style={styles.slotTitle}>{item.title}</Text>
      <Text style={styles.slotNote}>{item.note}</Text>
      <Text style={styles.slotCta}>Play ›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. Ultra-Slim Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerLeft,
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.headerTitle}>Casino</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Text style={styles.balanceText}>
            ${money.toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* 2. Location & Reputation Row */}
        <View style={styles.topRow}>
          {/* A) Location Button */}
          <View style={styles.locationContainer}>
            <Pressable
              onPress={() => setLocationModalVisible(true)}
              style={({ pressed }) => [
                styles.locationButton,
                pressed && styles.cardPressed,
              ]}>
              <Text style={styles.locationLabel}>Selected Casino:</Text>
              <Text style={styles.locationValue}>{location.name.toUpperCase()}</Text>
            </Pressable>
            <Text style={styles.locationHint}>Tap for other casinos</Text>
          </View>

          {/* B) Reputation Bar */}
          <View style={styles.repContainer}>
            <View style={styles.repHeader}>
              <Text style={styles.repLabel}>Casino Rep</Text>
              <Text style={styles.repValueText}>{reputationValue} / 100</Text>
            </View>
            <View style={styles.repTrack}>
              <View
                style={[
                  styles.repFill,
                  { width: `${reputationValue}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 4. Game List */}

        {/* 1. Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Slots</Text>
          <View style={styles.slotGrid}>{SLOT_VARIANTS.map(renderSlotCard)}</View>
        </View>

        {/* 2. High Roller Deluxe */}
        <View style={styles.section}>
          <Pressable
            onPress={() => handleGamePress('SlotsGame', HIGH_ROLLER_SLOT.title, { variant: HIGH_ROLLER_SLOT.id })}
            style={({ pressed }) => [
              styles.highRollerCard,
              pressed && styles.cardPressed,
            ]}>
            <View style={styles.highRollerLeft}>
              <Text style={styles.highRollerIcon}>{HIGH_ROLLER_SLOT.icon}</Text>
              <View>
                <Text style={styles.highRollerTitle}>{HIGH_ROLLER_SLOT.title}</Text>
                <Text style={styles.highRollerNote}>{HIGH_ROLLER_SLOT.note}</Text>
              </View>
            </View>
            <Text style={styles.playCta}>Play ›</Text>
          </Pressable>
        </View>

        {/* 3. Roulette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roulette</Text>
          <Pressable
            onPress={() => handleGamePress('RouletteGame', 'European Roulette')}
            style={({ pressed }) => [styles.gameRow, pressed && styles.cardPressed]}>
            <View style={{ gap: 4 }}>
              <Text style={styles.gameTitle}>European Roulette</Text>
              <Text style={styles.gameNote}>Single zero, tailored limits</Text>
            </View>
            <Pressable
              onPress={() => handleGamePress('RouletteGame', 'European Roulette')}
              style={styles.playButton}>
              <Text style={styles.playButtonText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>

        {/* 4. Texas Shuffle (Poker) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Texas Shuffle</Text>
          <Pressable
            onPress={() => handleGamePress('PokerGame', "Texas Hold'em")}
            style={({ pressed }) => [styles.gameRow, pressed && styles.cardPressed]}>
            <View style={{ gap: 4 }}>
              <Text style={styles.gameTitle}>Texas Hold'em</Text>
              <Text style={styles.gameNote}>Heads-up energy</Text>
            </View>
            <Pressable
              onPress={() => handleGamePress('PokerGame', "Texas Hold'em")}
              style={styles.playButton}>
              <Text style={styles.playButtonText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>

        {/* 5. Blackjack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blackjack</Text>
          <Pressable
            onPress={() => handleGamePress('BlackjackGame', 'Blackjack 21')}
            style={({ pressed }) => [styles.gameRow, pressed && styles.cardPressed]}>
            <View style={{ gap: 4 }}>
              <Text style={styles.gameTitle}>Blackjack 21</Text>
              <Text style={styles.gameNote}>Smooth dealing, quick payouts</Text>
            </View>
            <Pressable
              onPress={() => handleGamePress('BlackjackGame', 'Blackjack 21')}
              style={styles.playButton}>
              <Text style={styles.playButtonText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>
      </ScrollView>

      {/* 3. Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLocationModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Casino Location</Text>
            <View style={styles.modalList}>
              {CASINO_LOCATIONS.map(loc => {
                const isGreece = loc.id === 'greece';
                const isSelected = selectedLocation === loc.id;

                return (
                  <Pressable
                    key={loc.id}
                    disabled={!isGreece}
                    onPress={() => {
                      if (isGreece) {
                        setSelectedLocation('greece');
                        setLocationModalVisible(false);
                      }
                    }}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                      !isGreece && styles.modalOptionLocked,
                    ]}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        !isGreece && styles.modalOptionTextLocked,
                      ]}>
                      {loc.name}
                    </Text>
                    {isGreece ? (
                      isSelected ? <Text style={styles.checkIcon}>✓</Text> : null
                    ) : (
                      <Text style={styles.lockIcon}>🔒</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4. Bet Selection Modal */}
      <CasinoBetModal
        visible={betModalVisible}
        onClose={() => setBetModalVisible(false)}
        onPlay={handlePlayGame}
        gameTitle={pendingGame?.title ?? 'Game'}
        minBet={10000}
        maxBet={100000}
      />
    </SafeAreaView>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  headerRight: {},
  balanceText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 2,
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  locationContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  locationButton: {
    backgroundColor: theme.colors.cardSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  locationLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationValue: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  locationHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    alignSelf: 'center',
  },
  repContainer: {
    flex: 1,
    padding: theme.spacing.md,
    // Matching height visually to location button for alignment if needed, but flex takes care of width
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  repHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  repValueText: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  repTrack: {
    height: 6,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    overflow: 'hidden',
  },
  repFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  slotCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  slotIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  slotTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  slotNote: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  slotCta: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  highRollerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Note: RN doesn't support linear-gradient string in bg without lib. Fallback to cardSoft or similar.
    // Making it distinct:
    backgroundColor: theme.colors.cardSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  highRollerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  highRollerIcon: {
    fontSize: 28,
  },
  highRollerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  highRollerNote: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  playCta: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  gameTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  gameNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  playButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E2230',
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalList: {
    gap: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  modalOptionLocked: {
    opacity: 0.5,
  },
  modalOptionText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOptionTextLocked: {
    color: theme.colors.textMuted,
  },
  checkIcon: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  lockIcon: {
    fontSize: 14,
  },
});

