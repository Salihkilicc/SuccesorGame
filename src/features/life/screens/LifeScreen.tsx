import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MatchPopup from '../../../components/Match/MatchPopup';
import { useMatchSystem } from '../../../components/Match/useMatchSystem';
import { triggerEvent } from '../../../event/eventEngine';
import type { LifeStackParamList, RootStackParamList, RootTabParamList } from '../../../navigation';
import { useEventStore, useUserStore, useStatsStore, usePlayerStore } from '../../../core/store';
import { theme } from '../../../core/theme';
import AppScreen from '../../../components/layout/AppScreen';
import { useHookupSystem } from '../components/useHookupSystem';
import HookupModal from '../components/HookupModal';
import { useNightOutSystem } from '../components/NightOut/useNightOutSystem';
import NightOutSetupModal from '../components/NightOut/NightOutSetupModal';
import NightOutOutcomeModal from '../components/NightOut/NightOutOutcomeModal';
import CondomDecisionModal from '../components/NightOut/CondomDecisionModal';
import { useGymSystem } from '../components/Gym/useGymSystem';
import GymMasterModal from '../components/Gym/GymMasterModal';
import { useTravelSystem } from '../components/Travel/useTravelSystem';
import TravelDestinationModal from '../components/Travel/TravelDestinationModal';
import TravelCompanionModal from '../components/Travel/TravelCompanionModal';
import TravelResultModal from '../components/Travel/TravelResultModal';

import { useSanctuarySystem } from '../components/Sanctuary/useSanctuarySystem';
import SanctuaryHubModal from '../components/Sanctuary/SanctuaryHubModal';
import GroomingLoungeModal from '../components/Sanctuary/GroomingLoungeModal';
import RoyalMassageModal from '../components/Sanctuary/RoyalMassageModal';
import SunStudioModal from '../components/Sanctuary/SunStudioModal';
import PlasticSurgeryModal from '../components/Sanctuary/PlasticSurgeryModal';
import SanctuaryResultModal from '../components/Sanctuary/SanctuaryResultModal';

import { BlackMarketMasterModal } from '../components/BlackMarket/BlackMarketMasterModal';
import BelongingsModal from '../components/BlackMarket/BelongingsModal';
import { Alert } from 'react-native';
import { useEncounterSystem } from '../../love/components/useEncounterSystem';
import { EncounterModal } from '../../love/components/EncounterModal';
import BreakupModal from '../../love/components/BreakupModal';

// --- NEW EDUCATION SYSTEM IMPORTS ---
import { useEducationSystem } from '../components/Education/useEducationSystem';
import { EducationMasterModal } from '../components/Education/EducationMasterModal';

type LifeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LifeStackParamList, 'LifeHome'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Life'>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

type LifeActionType =
  | 'nightOut'
  | 'spa'
  | 'gym'
  | 'shopping'
  | 'travel'
  | 'casino'
  | 'blackMarket'
  | 'belongings'
  | 'hookup'
  | 'network'
  | 'education'
  | 'dna';

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
    {
      key: 'blackMarket',
      label: 'Black Market',
      description: 'Shadow deals for rare items',
      emoji: '🕶',
    },
    {
      key: 'belongings',
      label: 'Belongings',
      description: 'Your secret vault',
      emoji: '🗝️',
    },
    {
      key: 'hookup',
      label: 'Hookup',
      description: 'Casual chemistry',
      emoji: '🔥',
    },
    {
      key: 'network',
      label: 'Network',
      description: 'Meet investors and mentors',
      emoji: '🤝',
    },
    {
      key: 'education',
      label: 'Education',
      description: 'Degrees & Certificates',
      emoji: '🎓',
    },
    {
      key: 'dna',
      label: 'DNA / Stats',
      description: 'View Genetics & Skills',
      emoji: '🧬',
    },
  ];

const LifeScreen = () => {
  const navigation = useNavigation<LifeNavigationProp>();
  const { lastLifeEvent } = useEventStore();
  const {
    visible,
    matchCandidate,
    openMatch,
    closeMatch,
    acceptMatch,
    rejectMatch,
  } = useMatchSystem();

  const {
    isHookupVisible,
    hookupCandidate,
    startHookup,
    acceptHookup,
    rejectHookup,
    closeHookupModal,
  } = useHookupSystem();

  // Encounter System Hook
  const {
    isVisible: isEncounterVisible,
    currentScenario,
    candidate: encounterCandidate,
    triggerEncounter,
    handleDate,
    closeEncounter,
    getCheatingConsequence
  } = useEncounterSystem();

  const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

  const {
    setupModalVisible,
    outcomeModalVisible,
    outcomeType,
    condomModalVisible,
    selectedClub,
    selectedAircraft,
    aircrafts,
    needsTravel,
    totalCost,
    setSetupModalVisible,
    startNightOut,
    setSelectedClub,
    setSelectedAircraft,
    confirmNightOut,
    handleHookupAccept,
    handleOutcomeClose,
    handleCondomDecision,
  } = useNightOutSystem(triggerEncounter);

  // Gym System Hook
  const { actions } = useGymSystem();
  const { openGym } = actions;

  // --- EDUCATION SYSTEM HOOK ---
  const { openEducation } = useEducationSystem();

  const {
    // Visibility
    destinationModalVisible,
    companionModalVisible,
    resultModalVisible: travelResultVisible,

    // Actions
    openTravel,
    closeTravel,
    goToCompanionSelection,
    confirmTrip,

    // State Setters
    setSelectedCountry,
    setSelectedVibe,
    setSelectedActivity,

    // Selection Values
    selectedCountry,
    selectedVibe,
    selectedActivity,

    // Computed / Context
    hasPartner,
    hasChildren,
    partnerName,
    childrenCount,

    // Results
    totalCost: travelCost,
    enjoyment: travelEnjoyment,
    selectedCompanion
  } = useTravelSystem(triggerEncounter);

  const {
    isHubVisible,
    closeSanctuary,
    openSanctuary,
    // Sub-modals
    isGroomingVisible, setGroomingVisible, openGrooming,
    isMassageVisible, setMassageVisible, openMassage,
    isSunStudioVisible, setSunStudioVisible, openSunStudio,
    isSurgeryVisible, setSurgeryVisible, openSurgery,

    // Result
    isResultVisible, resultData,
    handleServicePurchase
  } = useSanctuarySystem();

  // Black Market State
  const [isBlackMarketVisible, setBlackMarketVisible] = useState(false);
  const [isBelongingsVisible, setBelongingsVisible] = useState(false);

  // Handle encounter date with cheating consequence check
  const handleEncounterDate = useCallback(() => {
    const result = handleDate();
    if (result.wasCaught) {
      setCheatingConsequence({ settlement: result.settlement, partnerName: 'Your Partner' });
    }
  }, [handleDate]);

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

  const { core, attributes, reputation, blackMarket, updateCore, updateAttribute } = usePlayerStore();
  const { money, earnMoney } = useStatsStore();
  const { health, stress, happiness } = core;

  const handleAction = (type: LifeActionType) => {
    switch (type) {
      case 'nightOut':
        console.log('[Life] Action triggered: Night Out');
        startNightOut();
        break;

      case 'spa':
        console.log('[Life] Action triggered: Spa & Relax -> Sanctuary');
        openSanctuary();
        break;

      case 'dna':
        navigation.navigate('DNA');
        break;

      case 'gym':
        if (Math.random() < 0.05) {
          if (triggerEncounter('gym')) {
            console.log('[Life] Gym Encounter Triggered!');
            return;
          }
        }
        openGym();
        break;

      case 'shopping':
        console.log('[Life] Navigating to Shopping');
        navigation.navigate('Assets', { screen: 'Shopping' } as any);
        break;

      case 'travel':
        console.log('[Life] Action triggered: Travel');
        openTravel();
        break;

      case 'casino':
        console.log('[Life] Navigating to Casino');
        navigation.navigate('Casino');
        break;
      case 'blackMarket':
        console.log('[Life] Action triggered: Black Market');
        setBlackMarketVisible(true);
        break;
      case 'belongings':
        console.log('[Life] Action triggered: Belongings');
        setBelongingsVisible(true);
        break;
      case 'hookup':
        console.log('[Life] Action triggered: Hookup');
        startHookup();
        break;
      case 'network':
        console.log('[Life] Action triggered: Network (placeholder)');
        break;
      case 'education':
        console.log('[Life] Opening Education Hub');
        openEducation();
        break;
      default:
        break;
    }
  };

  return (
    <AppScreen
      title="LIFE"
      subtitle="Downtown District"
      compact
      leftNode={
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* DEV BUTTON */}
        <Pressable
          onPress={() => earnMoney(1_000_000_000)}
          style={({ pressed }) => ({
            backgroundColor: '#8e44ad',
            padding: 10,
            alignItems: 'center',
            marginHorizontal: 16,
            marginTop: 10,
            borderRadius: 8,
            opacity: pressed ? 0.8 : 1
          })}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>🐛 DEV: +$1B Cash</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle Actions</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map(action => {
              const isBlackMarket = action.key === 'blackMarket';
              const isSuspicious = isBlackMarket && (blackMarket?.suspicion || 0) > 50;

              return (
                <LifeActionButton
                  key={action.key}
                  emoji={isSuspicious ? '🚨' : action.emoji}
                  label={action.label}
                  description={isSuspicious ? '⚠️ High heat!' : action.description}
                  onPress={() => handleAction(action.key)}
                />
              );
            })}
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
              style={({ pressed }) => [
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
            onPress={() => openMatch()}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Test Match Popup</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* MODALS */}
      <MatchPopup
        visible={visible}
        candidate={matchCandidate}
        onAccept={acceptMatch}
        onReject={rejectMatch}
        onClose={closeMatch}
      />
      <HookupModal
        visible={isHookupVisible}
        candidate={hookupCandidate}
        onAccept={acceptHookup}
        onReject={rejectHookup}
        onClose={closeHookupModal}
      />

      {/* Night Out Modals */}
      <NightOutSetupModal
        visible={setupModalVisible}
        onClose={() => setSetupModalVisible(false)}
        onConfirm={confirmNightOut}
        selectedClub={selectedClub}
        setSelectedClub={setSelectedClub}
        selectedAircraft={selectedAircraft}
        setSelectedAircraft={setSelectedAircraft}
        aircrafts={aircrafts}
        needsTravel={needsTravel}
        totalCost={totalCost}
      />
      <NightOutOutcomeModal
        visible={outcomeModalVisible}
        type={outcomeType}
        onClose={handleOutcomeClose}
        onHookupAccept={handleHookupAccept}
      />
      <CondomDecisionModal
        visible={condomModalVisible}
        onDecision={handleCondomDecision}
      />

      {/* Gym System (Layered Master Modal) */}
      <GymMasterModal />

      {/* EDUCATION SYSTEM (Layered Master Modal) */}
      <EducationMasterModal />

      {/* Travel Modals */}
      <TravelDestinationModal
        visible={destinationModalVisible}
        onClose={closeTravel}
        onNext={goToCompanionSelection}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        selectedVibe={selectedVibe}
        setSelectedVibe={setSelectedVibe}
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
      />
      <TravelCompanionModal
        visible={companionModalVisible}
        onClose={closeTravel}
        onConfirm={confirmTrip}
        hasPartner={hasPartner}
        hasChildren={hasChildren}
        partnerName={partnerName}
        childrenCount={childrenCount}
      />
      <TravelResultModal
        visible={travelResultVisible}
        onClose={closeTravel}
        country={selectedCountry}
        activity={selectedActivity}
        companion={selectedCompanion}
        partnerName={partnerName}
        cost={travelCost}
        enjoyment={travelEnjoyment}
      />

      {/* The Wellness Sanctuary Modals */}
      <SanctuaryHubModal
        visible={isHubVisible}
        onClose={closeSanctuary}
        onOpenGrooming={openGrooming}
        onOpenMassage={openMassage}
        onOpenSunStudio={openSunStudio}
        onOpenSurgery={openSurgery}
      />
      <GroomingLoungeModal
        visible={isGroomingVisible}
        onClose={() => setGroomingVisible(false)}
        handleServicePurchase={handleServicePurchase}
      />
      <RoyalMassageModal
        visible={isMassageVisible}
        onClose={() => setMassageVisible(false)}
        handleServicePurchase={handleServicePurchase}
      />
      <SunStudioModal
        visible={isSunStudioVisible}
        onClose={() => setSunStudioVisible(false)}
        handleServicePurchase={handleServicePurchase}
      />
      <PlasticSurgeryModal
        visible={isSurgeryVisible}
        onClose={() => setSurgeryVisible(false)}
        handleServicePurchase={handleServicePurchase}
      />

      {/* RESULT MODAL */}
      <SanctuaryResultModal
        visible={isResultVisible}
        resultData={resultData}
        onClose={closeSanctuary}
      />

      {/* BLACK MARKET MASTER MODAL */}
      <BlackMarketMasterModal
        visible={isBlackMarketVisible}
        onClose={() => setBlackMarketVisible(false)}
      />

      {/* BELONGINGS MODAL */}
      <BelongingsModal
        visible={isBelongingsVisible}
        onClose={() => setBelongingsVisible(false)}
      />

      {/* ENCOUNTER MODAL (CINEMATIC) */}
      <EncounterModal
        visible={isEncounterVisible}
        candidate={encounterCandidate}
        scenario={currentScenario}
        context={currentScenario?.id.split('_')[0] || 'Unknown'}
        onDate={handleEncounterDate}
        onHookup={() => {
          Alert.alert("Fling", "You had a great night! (Stress -10)");
          closeEncounter();
        }}
        onIgnore={closeEncounter}
      />

      {/* BREAKUP MODAL (HIGHEST PRIORITY) */}
      {cheatingConsequence && (
        <BreakupModal
          visible={!!cheatingConsequence}
          onClose={() => setCheatingConsequence(null)}
          partnerName={cheatingConsequence.partnerName}
          settlementCost={cheatingConsequence.settlement}
        />
      )}

    </AppScreen>
  );
};

type LifeActionButtonProps = {
  emoji: string;
  label: string;
  description: string;
  onPress: () => void;
};

const LifeActionButton = ({
  emoji,
  label,
  description,
  onPress,
}: LifeActionButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
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
    transform: [{ scale: 0.97 }],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
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
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  actionButton: {
    width: '48%',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  actionButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  actionDescription: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  card: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cardText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
});