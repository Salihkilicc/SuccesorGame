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
import { HookupModal } from '../components/HookupModal';
import { useNightOutSystem } from '../components/NightOut/useNightOutSystem';
import NightOutSetupModal from '../components/NightOut/NightOutSetupModal';
import NightOutOutcomeModal from '../components/NightOut/NightOutOutcomeModal';
import HookupGameModal from '../components/NightOut/HookupGameModal';
import NightEndModal from '../components/NightOut/NightEndModal';
import PregnancyRevealModal from '../components/NightOut/PregnancyRevealModal';
import NightConclusionModal from '../components/NightOut/NightConclusionModal';
import { useGymSystem } from '../components/Gym/useGymSystem';
import GymMasterModal from '../components/Gym/GymMasterModal';
import { useTravelSystem } from '../components/Travel/useTravelSystem';
import TravelHubModal from '../components/Travel/TravelHubModal';
import TravelBookingModal from '../components/Travel/TravelBookingModal';
import TravelExperienceModal from '../components/Travel/TravelExperienceModal';
import SouvenirMiniGame from '../components/Travel/SouvenirMiniGame';
import SouvenirCollectionModal from '../components/Travel/SouvenirCollectionModal';

import { useSanctuarySystem } from '../components/Sanctuary/store/useSanctuarySystem';
import SanctuaryMasterModal from '../components/Sanctuary/SanctuaryMasterModal';
import SanctuaryResultModal from '../components/Sanctuary/modals/SanctuaryResultModal';

import { BlackMarketMasterModal } from '../components/BlackMarket/BlackMarketMasterModal';
import { Alert } from 'react-native';
import { useEncounterSystem } from '../../love/components/useEncounterSystem';
import { EncounterModal } from '../../love/components/EncounterModal';
import BreakupModal from '../../love/components/BreakupModal';

// --- NEW EDUCATION SYSTEM IMPORTS ---
import { useEducationSystem } from '../components/Education/store/useEducationSystem';
import { EducationMasterModal } from '../components/Education/modals/EducationMasterModal';
import { EducationExamModal } from '../components/Education/modals/EducationExamModal';

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
    isModalVisible,
    currentCandidate,
    matchStatus,
    startHookup,
    swipeRight,
    swipeLeft,
    nextCandidate,
    closeHookupModal,
  } = useHookupSystem();

  // Encounter System Hook
  const {
    isVisible: isEncounterVisible,
    currentScenario: encounterScenario,
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
    nightEndModalVisible,
    pregnancyModalVisible,
    conclusionModalVisible,
    conclusionData,
    hookupGameVisible,
    currentScenario,
    currentPartner,
    // Multi-step flow state
    step,
    selectedRegion,
    selectedClub,
    travelCostAmount,
    hasPrivateJet,
    totalCost,
    // Navigation & Hangar
    goBack: goBackNightOut,
    isHangarOpen,
    setIsHangarOpen,

    // Actions
    setSetupModalVisible,
    startNightOut,
    selectRegion,
    selectVenue,
    selectTravelMethod,
    confirmNightOut,
    handleHookupAccept,
    handleOutcomeClose,
    handleNightEndDecision,
    setPregnancyModalVisible,
    setConclusionModalVisible,
    handleConclusionClose,
    handleHookupGameSuccess,
    handleHookupGameFail,
  } = useNightOutSystem(triggerEncounter);

  // Gym System Hook
  const { actions } = useGymSystem();
  const { openGym } = actions;

  // --- EDUCATION SYSTEM HOOK ---
  const { openEducation } = useEducationSystem();

  const {
    // State
    currentView,
    selectedSpot,
    travelClass,
    bringPartner,
    resultData: travelResultData,
    vacationSpots,

    // Actions
    openTravel,
    closeTravel,
    setTravelClass,
    setBringPartner,
    openBooking,
    startTrip,
    onExperienceComplete,
    onMiniGameComplete,
    openCollection,
    closeCollection,
    closeBooking,
    setCurrentView,

    // Store methods
    hasSouvenir,
  } = useTravelSystem();

  const {
    // Visibility & Nav
    isHubVisible,
    activeView,
    openSanctuary,
    closeSanctuary,
    navigate,
    goBack,

    // Actions
    performSurgery,
    getFreshCut,
    handleServicePurchase,
    buyMembership,

    // State
    isVIPMember,
    isResultVisible,
    resultData,
    activeBuffs,
    usageTracker,
  } = useSanctuarySystem();

  // Black Market State
  const [isBlackMarketVisible, setBlackMarketVisible] = useState(false);

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

  const handleTravelHome = () => {
    closeTravel();
    // Navigate home similar to Night Out
    const rootNav = navigation.getParent()?.getParent();
    if (rootNav) {
      rootNav.navigate('Home' as never);
      return;
    }
    navigation.navigate('Home' as never);
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
        // Navigate to new Portfolio Screen
        navigation.navigate('Assets', { screen: 'Belongings' } as any);
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
        visible={isModalVisible}
        candidate={currentCandidate}
        matchStatus={matchStatus}
        onSwipeRight={swipeRight}
        onSwipeLeft={swipeLeft}
        nextCandidate={nextCandidate}
        onClose={closeHookupModal}
      />

      {/* Night Out Modals */}
      <NightOutSetupModal
        visible={setupModalVisible}
        onClose={() => setSetupModalVisible(false)}
        step={step}
        selectedRegion={selectedRegion}
        selectedClub={selectedClub}
        travelCostAmount={travelCostAmount}
        hasPrivateJet={hasPrivateJet}
        totalCost={totalCost}
        selectRegion={selectRegion}
        selectVenue={selectVenue}
        selectTravelMethod={selectTravelMethod}
        confirmNightOut={confirmNightOut}
        goBack={goBackNightOut}
        isHangarOpen={isHangarOpen}
        setIsHangarOpen={setIsHangarOpen}
      />
      <NightOutOutcomeModal
        visible={outcomeModalVisible}
        type={outcomeType}
        onClose={handleOutcomeClose}
        onHookupAccept={handleHookupAccept}
      />
      <HookupGameModal
        visible={hookupGameVisible}
        scenario={currentScenario}
        partner={currentPartner}
        onSuccess={handleHookupGameSuccess}
        onFail={handleHookupGameFail}
      />
      <NightEndModal
        visible={nightEndModalVisible}
        onDecision={handleNightEndDecision}
      />
      <NightConclusionModal
        visible={conclusionModalVisible}
        data={conclusionData}
        onClose={handleConclusionClose}
      />
      <PregnancyRevealModal
        visible={pregnancyModalVisible}
        onClose={() => setPregnancyModalVisible(false)}
      />

      {/* Gym System (Layered Master Modal) */}
      <GymMasterModal />

      {/* EDUCATION SYSTEM (Layered Master Modal) */}
      <EducationMasterModal />
      <EducationExamModal />

      {/* Travel Modals */}
      <TravelHubModal
        visible={currentView === 'HUB'}
        vacationSpots={vacationSpots}
        onSelectSpot={openBooking}
        onClose={closeTravel}
        onOpenCollection={openCollection}
        onHomePress={handleTravelHome}
      />
      <TravelBookingModal
        visible={currentView === 'BOOKING'}
        spot={selectedSpot}
        travelClass={travelClass}
        bringPartner={bringPartner}
        onSelectClass={setTravelClass}
        onTogglePartner={setBringPartner}
        onConfirm={startTrip}
        onClose={closeBooking}
        onHomePress={handleTravelHome}
      />
      <TravelExperienceModal
        visible={currentView === 'EXPERIENCE'}
        spot={selectedSpot}
        resultData={travelResultData}
        onComplete={onExperienceComplete}
        onHomePress={handleTravelHome}
      />
      <SouvenirMiniGame
        visible={currentView === 'MINIGAME'}
        souvenir={selectedSpot?.souvenir || null}
        onComplete={onMiniGameComplete}
        onHomePress={handleTravelHome}
      />
      <SouvenirCollectionModal
        visible={currentView === 'COLLECTION'}
        collectedIds={vacationSpots.filter(spot => hasSouvenir(spot.souvenir.id)).map(spot => spot.souvenir.id)}
        onClose={closeCollection}
        onHomePress={handleTravelHome}
      />

      {/* The Wellness Sanctuary Modals */}
      {/* The Wellness Sanctuary Master System */}
      <SanctuaryMasterModal
        isHubVisible={isHubVisible}
        activeView={activeView}
        closeSanctuary={closeSanctuary}
        navigate={navigate}
        goBack={goBack}
        isVIPMember={isVIPMember}
        buyMembership={buyMembership}
        performSurgery={performSurgery}
        getFreshCut={getFreshCut}
        handleServicePurchase={handleServicePurchase}
        activeBuffs={activeBuffs}
        usageTracker={usageTracker}
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



      {/* ENCOUNTER MODAL (CINEMATIC) */}
      <EncounterModal
        visible={isEncounterVisible}
        candidate={encounterCandidate}
        scenario={encounterScenario}
        context={encounterScenario?.id.split('_')[0] || 'Unknown'}
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