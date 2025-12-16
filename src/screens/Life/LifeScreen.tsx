import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MatchPopup from '../../components/Match/MatchPopup';
import { useMatchSystem } from '../../components/Match/useMatchSystem';
import { triggerEvent } from '../../event/eventEngine';
import type { LifeStackParamList, RootStackParamList, RootTabParamList } from '../../navigation';
import { useEventStore } from '../../store';
import { theme } from '../../theme';
import AppScreen from '../../components/layout/AppScreen';
import { useHookupSystem } from '../../components/Life/useHookupSystem';
import HookupModal from '../../components/Life/HookupModal';
import { useNightOutSystem } from '../../components/Life/NightOut/useNightOutSystem';
import NightOutSetupModal from '../../components/Life/NightOut/NightOutSetupModal';
import NightOutOutcomeModal from '../../components/Life/NightOut/NightOutOutcomeModal';
import CondomDecisionModal from '../../components/Life/NightOut/CondomDecisionModal';
import { useGymSystem } from '../../components/Life/Gym/useGymSystem';
import GymMembershipModal from '../../components/Life/Gym/GymMembershipModal';
import GymHubModal from '../../components/Life/Gym/GymHubModal';
import { useTravelSystem } from '../../components/Life/Travel/useTravelSystem';
import TravelDestinationModal from '../../components/Life/Travel/TravelDestinationModal';
import TravelCompanionModal from '../../components/Life/Travel/TravelCompanionModal';
import TravelResultModal from '../../components/Life/Travel/TravelResultModal';

import { useSanctuarySystem } from '../../components/Life/Sanctuary/useSanctuarySystem';
import SanctuaryHubModal from '../../components/Life/Sanctuary/SanctuaryHubModal';
import GroomingLoungeModal from '../../components/Life/Sanctuary/GroomingLoungeModal';
import RoyalMassageModal from '../../components/Life/Sanctuary/RoyalMassageModal';
import SunStudioModal from '../../components/Life/Sanctuary/SunStudioModal';
import PlasticSurgeryModal from '../../components/Life/Sanctuary/PlasticSurgeryModal';
import SanctuaryResultModal from '../../components/Life/Sanctuary/SanctuaryResultModal';

import { useBlackMarketSystem } from '../../components/Life/BlackMarket/useBlackMarketSystem';
import BlackMarketHubModal from '../../components/Life/BlackMarket/BlackMarketHubModal';
import BelongingsModal from '../../components/Life/BlackMarket/BelongingsModal';
import { Alert } from 'react-native';
import { useEffect } from 'react';

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
  | 'network';

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
    {
      key: 'blackMarket',
      label: 'Black Market',
      description: 'Shadow deals for rare items',
      emoji: '🕶',
    },
    {
      key: 'belongings',
      label: 'My Belongings',
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
  } = useNightOutSystem();

  const {
    membershipModalVisible,
    hubModalVisible,
    trainerModalVisible,
    supplementModalVisible,
    fitnessConfigVisible,
    martialArtsModalVisible,
    resultModalVisible,

    workoutInProgress,
    selectedFitnessType,
    selectedMartialArt,
    lastResult,
    gymState,

    setMembershipModalVisible,
    setHubModalVisible,
    setTrainerModalVisible,
    setSupplementModalVisible,
    setFitnessConfigVisible,
    setMartialArtsModalVisible,
    setResultModalVisible,

    setSelectedFitnessType,
    setSelectedMartialArt,

    openGym,
    buyMembership,
    hireTrainer,
    // attemptUnlockElite,
    // attemptUnlockElite,
    startFitnessWorkout,
    startMartialArtsTraining
  } = useGymSystem();

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
  } = useTravelSystem();

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

  const {
    isHubVisible: isBlackMarketVisible,
    isBelongingsVisible,
    isOfferVisible,
    currentOffer,
    effectMessage,
    openBlackMarket,
    closeBlackMarket,
    openBelongings,
    closeBelongings,
    generateRandomOffer,
    acceptOffer,
    rejectOffer,
    buyWeapon,
    buySubstance,
    clearEffect
  } = useBlackMarketSystem();

  // Effect for Substance consumption
  useEffect(() => {
    if (effectMessage) {
      Alert.alert(
        "Whoa...",
        effectMessage,
        [{ text: "I'm okay... I think.", onPress: clearEffect }]
      );
    }
  }, [effectMessage, clearEffect]);

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
      case 'gym':
        console.log('[Life] Action triggered: Gym');
        openGym();
        break;
      case 'shopping':
        console.log('[Life] Navigating to Shopping');
        // @ts-ignore - we know this path exists in the root navigator
        navigation.navigate('Assets', { screen: 'Shopping' });
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
        openBlackMarket();
        break;
      case 'belongings':
        console.log('[Life] Action triggered: Belongings');
        openBelongings();
        break;
      case 'hookup':
        console.log('[Life] Action triggered: Hookup');
        startHookup();
        break;
      case 'network':
        console.log('[Life] Action triggered: Network (placeholder)');
        break;
      default:
        break;
    }
  };

  return (
    <AppScreen
      title="LIFE"
      subtitle="Downtown District"
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
      <GymMembershipModal
        visible={membershipModalVisible}
        onClose={() => setMembershipModalVisible(false)}
        onPurchase={buyMembership}
      />
      <GymHubModal
        visible={hubModalVisible}
        onClose={() => setHubModalVisible(false)}
        gymStatus={gymState.gymStatus}
        trainerId={gymState.trainerId}
        onHireTrainer={hireTrainer}
        onStartFitness={startFitnessWorkout}
        martialArtsLevels={gymState.martialArts}
        onStartMartialArts={startMartialArtsTraining}
        workoutInProgress={workoutInProgress}
        lastResult={lastResult}
        onResultClose={() => setResultModalVisible(false)}
        showResult={resultModalVisible}
      />

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

      {/* BLACK MARKET MODALS */}
      <BlackMarketHubModal
        visible={isBlackMarketVisible}
        onClose={closeBlackMarket}
        onSelectArt={() => generateRandomOffer('art')}
        onSelectAntique={() => generateRandomOffer('antique')}
        onSelectJewel={() => generateRandomOffer('jewel')}
        onBuyWeapon={buyWeapon}
        onBuySubstance={buySubstance}
        // Offer Logic
        offerVisible={isOfferVisible}
        offerItem={currentOffer}
        onAcceptOffer={acceptOffer}
        onRejectOffer={rejectOffer}
      />

      <BelongingsModal
        visible={isBelongingsVisible}
        onClose={closeBelongings}
      />
    </AppScreen>
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
