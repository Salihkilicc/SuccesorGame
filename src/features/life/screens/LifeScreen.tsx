import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView, Alert, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';


// Components & Systems
import { theme } from '../../../core/theme';
import { useUserStore, useStatsStore, usePlayerStore, useGameStore } from '../../../core/store';
import type { LifeStackParamList, RootStackParamList, RootTabParamList } from '../../../navigation';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

// --- Modals & Systems ---
import MatchPopup from '../../../components/Match/MatchPopup';
import { useMatchSystem } from '../../../components/Match/useMatchSystem';
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
import { useEncounterSystem } from '../../love/components/useEncounterSystem';
import { EncounterModal } from '../../love/components/EncounterModal';
import BreakupModal from '../../love/components/BreakupModal';

import { useEducationSystem } from '../components/Education/store/useEducationSystem';
import { EducationMasterModal } from '../components/Education/modals/EducationMasterModal';
import { EducationExamModal } from '../components/Education/modals/EducationExamModal';

import { useLuxurySystem } from '../../shopping/hooks/useLuxurySystem';

// Type Definitions
type LifeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LifeStackParamList, 'LifeHome'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Life'>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

// --- CONFIGURATION ---

// Gradients for Icons
const GRADIENTS = {
  purplePink: ['#8E2DE2', '#4A00E0'],
  tealCyan: ['#00b09b', '#96c93d'],
  orangeYellow: ['#F2994A', '#F2C94C'],
  pinkRed: ['#ec008c', '#fc6767'],
  blueSky: ['#2980B9', '#6DD5FA'],
  brownGold: ['#834d9b', '#d04ed6'], // Belongings
  greenTeal: ['#11998e', '#38ef7d'],
  bluePurple: ['#00c6ff', '#0072ff'],
  redCasino: ['#e52d27', '#b31217'], // Casino Red
  darkGrey: ['#232526', '#414345'],
  hookupFire: ['#DA22FF', '#9733EE'],
  networkBlue: ['#1A2980', '#26D0CE'],
};

const SECTION_LEISURE = [
  { key: 'nightOut', label: 'Night Out', icon: '🍸', gradient: GRADIENTS.purplePink },
  { key: 'spa', label: 'Spa & Relax', icon: '🧖‍♀️', gradient: GRADIENTS.tealCyan },
  { key: 'gym', label: 'Gym', icon: '🏋️', gradient: GRADIENTS.orangeYellow },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', gradient: GRADIENTS.pinkRed },
];

const SECTION_LIFESTYLE = [
  // Core System & Daily
  { key: 'calendar', label: 'Calendar', icon: '📅', gradient: GRADIENTS.orangeYellow },
  { key: 'health', label: 'Health', icon: '❤️', gradient: GRADIENTS.pinkRed },
  { key: 'contacts', label: 'Contacts', icon: '👥', gradient: GRADIENTS.purplePink },
  { key: 'mail', label: 'Mail', icon: '✉️', gradient: GRADIENTS.blueSky },

  // Organization & Productivity
  { key: 'notes', label: 'Notes', icon: '📝', gradient: GRADIENTS.tealCyan },
  { key: 'weather', label: 'Weather', icon: '🌤️', gradient: GRADIENTS.bluePurple },
  { key: 'education', label: 'Education', icon: '🎓', gradient: GRADIENTS.greenTeal },
  { key: 'travel', label: 'Travel', icon: '✈️', gradient: GRADIENTS.blueSky },

  // Personal Assets & Data
  { key: 'belongings', label: 'Belongings', icon: '👜', gradient: GRADIENTS.brownGold },
  { key: 'myCompany', label: 'My Company', icon: '🏢', gradient: GRADIENTS.networkBlue },
  { key: 'dna', label: 'DNA / Stats', icon: '🧬', gradient: GRADIENTS.bluePurple },
  { key: 'settings', label: 'Settings', icon: '⚙️', gradient: GRADIENTS.darkGrey },
];

const SECTION_UNDERWORLD = [
  { key: 'casino', label: 'Casino', icon: '🎰', gradient: GRADIENTS.redCasino },
  { key: 'blackMarket', label: 'Black Market', icon: '🕶️', gradient: GRADIENTS.darkGrey },
  { key: 'hookup', label: 'Hookup', icon: '🔥', gradient: GRADIENTS.hookupFire },
  { key: 'network', label: 'Network', icon: '🌐', gradient: GRADIENTS.networkBlue },
  { key: 'stockMarket', label: 'Stock Market', icon: '📈', gradient: GRADIENTS.greenTeal },
];

const LifeScreen = () => {
  const navigation = useNavigation<LifeNavigationProp>();

  // Systems Logic
  useLuxurySystem();

  // -- Store --
  const { visible, matchCandidate, openMatch, closeMatch, acceptMatch, rejectMatch } = useMatchSystem();
  const { isModalVisible, currentCandidate, matchStatus, startHookup, swipeRight, swipeLeft, nextCandidate, closeHookupModal } = useHookupSystem();
  const { isVisible: isEncounterVisible, currentScenario: encounterScenario, candidate: encounterCandidate, triggerEncounter, handleDate, closeEncounter } = useEncounterSystem();

  const triggerEncounterBool = useCallback((context: string, countryId?: string) => {
    const result = triggerEncounter(context, countryId);
    return !!result;
  }, [triggerEncounter]);

  const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

  // Night Out System
  const {
    setupModalVisible, outcomeModalVisible, outcomeType, nightEndModalVisible, pregnancyModalVisible, conclusionModalVisible, conclusionData, hookupGameVisible, currentScenario, currentPartner,
    step, selectedRegion, selectedClub, travelCostAmount, hasPrivateJet, totalCost, goBack: goBackNightOut, isHangarOpen, setIsHangarOpen,
    setSetupModalVisible, startNightOut, selectRegion, selectVenue, selectTravelMethod, confirmNightOut, handleHookupAccept, handleOutcomeClose, handleNightEndDecision, setPregnancyModalVisible, setConclusionModalVisible, handleConclusionClose, handleHookupGameSuccess, handleHookupGameFail,
  } = useNightOutSystem(triggerEncounterBool);

  // Gym System
  const { actions: { openGym } } = useGymSystem();

  // Education System
  const { openEducation } = useEducationSystem();

  // Travel System
  const {
    currentView, selectedSpot, travelClass, bringPartner, resultData: travelResultData, vacationSpots,
    openTravel, closeTravel, setTravelClass, setBringPartner, openBooking, startTrip, onExperienceComplete, onMiniGameComplete, openCollection, closeCollection, closeBooking, hasSouvenir,
  } = useTravelSystem(triggerEncounterBool);

  // Sanctuary System
  const {
    isHubVisible, activeView, openSanctuary, closeSanctuary, navigate: navSanctuary, goBack: goBackSanctuary,
    performSurgery, getFreshCut, handleServicePurchase, buyMembership, isVIPMember, isResultVisible, resultData, activeBuffs, usageTracker
  } = useSanctuarySystem();

  // Black Market
  const [isBlackMarketVisible, setBlackMarketVisible] = useState(false);
  const [isStatsMode, setIsStatsMode] = useState(false);

  // Stats Data
  const userMoney = useStatsStore(state => state.money);
  const { core: playerCore, attributes: playerAttributes } = usePlayerStore();

  // Handle Encounter Date
  const handleEncounterDate = useCallback(() => {
    const result = handleDate();
    if (result.wasCaught) {
      setCheatingConsequence({ settlement: result.settlement, partnerName: 'Your Partner' });
    }
  }, [handleDate]);

  // -- Navigation Handlers --

  const handleAction = (key: string) => {
    switch (key) {
      // Leisure
      case 'nightOut': startNightOut(); break;
      case 'spa': openSanctuary(); break;
      case 'gym': openGym(); break; // Removed random encounter logic
      case 'shopping': navigation.navigate('Assets', { screen: 'Shopping' } as any); break;

      // Lifestyle
      case 'travel': openTravel(); break;
      case 'belongings': navigation.navigate('Assets', { screen: 'Belongings' } as any); break;
      case 'myCompany': navigation.navigate('Assets', { screen: 'MyCompany' } as any); break;
      case 'education': openEducation(); break;
      case 'dna': navigation.navigate('DNA'); break;
      case 'contacts': handleBottomNav('Contacts'); break;
      case 'settings': Alert.alert('Settings', 'Settings screen is coming soon!'); break;
      case 'health': Alert.alert('Health', 'Health app is coming soon!'); break;
      case 'calendar': Alert.alert('Calendar', 'Calendar app is coming soon!'); break;
      case 'notes': Alert.alert('Notes', 'Notes app is coming soon!'); break;
      case 'mail': Alert.alert('Mail', 'Mail app is coming soon!'); break;
      case 'weather': Alert.alert('Weather', 'Weather app is coming soon!'); break;

      // Underworld
      case 'casino': navigation.navigate('Casino'); break;
      case 'blackMarket': setBlackMarketVisible(true); break;
      case 'hookup': startHookup(); break;
      case 'network': Alert.alert('Network', 'Networking events are coming soon!'); break;
      case 'stockMarket': navigation.navigate('Assets', { screen: 'Market' } as any); break;

      default: break;
    }
  };

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('Home' as never);
        break;
      case 'Stats':
        navigation.navigate('FinancialReport' as never);
        break;
      case 'Contacts':
        navigation.navigate('Love' as never);
        break;
      case 'Profile':
        navigation.navigate('DNA');
        break;
    }
  };

  const renderAppIcon = (item: { key: string; label: string; icon: string; gradient: string[] }) => (
    <Pressable key={item.key} style={styles.appIconContainer} onPress={() => handleAction(item.key)}>
      <LinearGradient
        colors={item.gradient}
        style={styles.appIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.appIconEmoji}>{item.icon}</Text>
      </LinearGradient>
      <Text style={styles.appIconLabel} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* PREMIUM BACKGROUND - Grey Blue Green subtle gradient */}
      <LinearGradient
        colors={['#1c1c1e', '#2c3e50', '#202020']} // Dark, Blue-ish Grey, almost Black
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.headerTitle}>LIFE</Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leisure</Text>
            <View style={styles.grid}>
              {SECTION_LEISURE.map(renderAppIcon)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle</Text>
            <View style={styles.grid}>
              {SECTION_LIFESTYLE.map(renderAppIcon)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Underworld</Text>
            <View style={styles.grid}>
              {SECTION_UNDERWORLD.map(renderAppIcon)}
            </View>
          </View>

          {/* Spacer for Bottom Bar */}
          <View style={{ height: 80 }} />

          {/* DEBUG SECTION - Squeezed Horizontal Layout */}
          <View style={styles.debugRow}>
            <Pressable
              style={[styles.debugButton, { backgroundColor: '#c0392b', flex: 1, marginRight: 8 }]}
              onPress={() => {
                Alert.alert(
                  'Reset Game',
                  'Are you sure you want to completely reset your progress?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await useGameStore.getState().resetGame();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.debugButtonText}>🔄 Reset</Text>
            </Pressable>

            <Pressable
              style={[styles.debugButton, { backgroundColor: '#27ae60', flex: 2.5 }]}
              onPress={() => {
                useStatsStore.getState().earnMoney(100_000_000);
                Alert.alert('Success', '$100M added to your balance!');
              }}
            >
              <Text style={styles.debugButtonText}>💰 Add $100M Cash</Text>
            </Pressable>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* Universal Crystal Navigation Bar (Light Variant for Life) */}
        <CrystalNavBar activeTab="Life" variant="light" />

      </SafeAreaView >

      {/* --- MODALS --- */}
      < MatchPopup
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

      <GymMasterModal />
      <EducationMasterModal />
      <EducationExamModal />

      <TravelHubModal
        visible={currentView === 'HUB'}
        vacationSpots={vacationSpots}
        onSelectSpot={openBooking}
        onClose={closeTravel}
        onOpenCollection={openCollection}
        onHomePress={() => { closeTravel(); handleBottomNav('Home'); }}
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
        onHomePress={() => { closeTravel(); handleBottomNav('Home'); }}
      />
      <TravelExperienceModal
        visible={currentView === 'EXPERIENCE'}
        spot={selectedSpot}
        resultData={travelResultData}
        onComplete={onExperienceComplete}
        onHomePress={() => { closeTravel(); handleBottomNav('Home'); }}
      />
      <SouvenirMiniGame
        visible={currentView === 'MINIGAME'}
        souvenir={selectedSpot?.souvenir || null}
        onComplete={onMiniGameComplete}
        onHomePress={() => { closeTravel(); handleBottomNav('Home'); }}
      />
      <SouvenirCollectionModal
        visible={currentView === 'COLLECTION'}
        collectedIds={vacationSpots.filter(spot => hasSouvenir(spot.souvenir.id)).map(spot => spot.souvenir.id)}
        onClose={closeCollection}
        onHomePress={() => { closeTravel(); handleBottomNav('Home'); }}
      />

      <SanctuaryMasterModal
        isHubVisible={isHubVisible}
        activeView={activeView}
        closeSanctuary={closeSanctuary}
        navigate={navSanctuary}
        goBack={goBackSanctuary}
        isVIPMember={isVIPMember}
        buyMembership={buyMembership}
        performSurgery={performSurgery}
        getFreshCut={getFreshCut}
        handleServicePurchase={handleServicePurchase}
        activeBuffs={activeBuffs}
        usageTracker={usageTracker}
      />
      <SanctuaryResultModal
        visible={isResultVisible}
        resultData={resultData}
        onClose={closeSanctuary}
      />

      <BlackMarketMasterModal
        visible={isBlackMarketVisible}
        onClose={() => setBlackMarketVisible(false)}
      />

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

      {
        cheatingConsequence && (
          <BreakupModal
            visible={!!cheatingConsequence}
            onClose={() => setCheatingConsequence(null)}
            partnerName={cheatingConsequence.partnerName}
            settlementCost={cheatingConsequence.settlement}
          />
        )
      }

    </View >
  );
};

export default LifeScreen;

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background is handled by LinearGradient
  },
  safeArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 74,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    paddingLeft: 34, // 10 original + 24 from header horizontal padding
    paddingTop: Platform.OS === 'ios' ? 70 : 90,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100, // Reduced bottom padding
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0F0F0',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  appIconContainer: {
    width: '23%',
    alignItems: 'center',
  },
  appIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // iOS-style icon shadow/depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  appIconEmoji: {
    fontSize: 32,
  },
  appIconLabel: {
    color: '#EEEEEE',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  debugRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  debugButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },


  // Crystal Floating Dock
  bottomBarContainer: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
    borderRadius: 35,
    overflow: 'hidden', // Ensures blur stays inside
    // Shadow for the dock itself
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  blurContainer: {
    borderRadius: 35,
  },
  bottomBar: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 18,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight tint on top of blur
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 35,
  },
  bottomTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bottomTabIconContainer: {
    marginBottom: 4,
  },
  bottomTabIcon: {
    fontSize: 24, // Slightly larger icons
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)', // Depth
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomTabLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});