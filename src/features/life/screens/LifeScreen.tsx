import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView, Alert, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';

// Components & Systems
import { theme } from '../../../core/theme';
import { useUserStore, useStatsStore, usePlayerStore, useGameStore } from '../../../core/store';
import type { RootStackParamList } from '../../../navigation';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

// Type Definitions
type LifeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Modals & Systems ---
import MatchPopup from '../../../components/Match/MatchPopup';
import { useMatchSystem } from '../../../components/Match/useMatchSystem';
import { useNightOutSystem } from '../components/NightOut/useNightOutSystem';
import NightOutSetupModal from '../components/NightOut/NightOutSetupModal';
import NightOutOutcomeModal from '../components/NightOut/NightOutOutcomeModal';
import HookupGameModal from '../components/NightOut/HookupGameModal';
import NightEndModal from '../components/NightOut/NightEndModal';
import PregnancyRevealModal from '../components/NightOut/PregnancyRevealModal';
import NightConclusionModal from '../components/NightOut/NightConclusionModal';

import { useGymSystem } from '../components/Gym/useGymSystem';
import GymMasterModal from '../components/Gym/GymMasterModal';

import { useSanctuarySystem } from '../components/Sanctuary/store/useSanctuarySystem';

import { useEducationSystem } from '../components/Education/store/useEducationSystem';
import { EducationMasterModal } from '../components/Education/modals/EducationMasterModal';
import { EducationExamModal } from '../components/Education/modals/EducationExamModal';

import { useLuxurySystem } from '../../shopping/hooks/useLuxurySystem';

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
  { key: 'nightOut', label: 'Night Out', icon: 'glass-cocktail', gradient: GRADIENTS.purplePink },
  { key: 'spa', label: 'Spa & Relax', icon: 'spa', gradient: GRADIENTS.tealCyan },
  { key: 'gym', label: 'Gym', icon: 'dumbbell', gradient: GRADIENTS.orangeYellow },
  { key: 'shopping', label: 'Shopping', icon: 'shopping', gradient: GRADIENTS.pinkRed },
];

const SECTION_LIFESTYLE = [
  // Organization & Productivity
  { key: 'notes', label: 'Notes', icon: 'notebook', gradient: GRADIENTS.tealCyan },
  { key: 'education', label: 'Education', icon: 'school', gradient: GRADIENTS.greenTeal },
  { key: 'travel', label: 'Travel', icon: 'airplane', gradient: GRADIENTS.blueSky },

  // Personal Assets & Data
  { key: 'belongings', label: 'Belongings', icon: 'briefcase', gradient: GRADIENTS.brownGold },
  { key: 'dna', label: 'DNA / Stats', icon: 'dna', gradient: GRADIENTS.bluePurple },
];

const LifeScreen = () => {
  const navigation = useNavigation<LifeNavigationProp>();

  // Systems Logic
  useLuxurySystem();

  // -- Store --
  const { visible, matchCandidate, openMatch, closeMatch, acceptMatch, rejectMatch } = useMatchSystem();

  // Helper function for encounters triggered from within LifeScreen components (like Travel/NightOut)
  const triggerEncounterBool = useCallback((context: string, countryId?: string) => {
    // Encounters are now handled on the Underworld screen, so we might need a global encounter system OR we just return false for now to avoid errors on this screen
    // TODO: move encounter trigger logic out of here if we don't want encounters to pop up over life screen.
    return false;
  }, []);

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

  // Sanctuary System
  const {
    isHubVisible, activeView, openSanctuary, closeSanctuary, navigate: navSanctuary, goBack: goBackSanctuary,
    performSurgery, getFreshCut, handleServicePurchase, buyMembership, isVIPMember, isResultVisible, resultData, activeBuffs, usageTracker
  } = useSanctuarySystem();

  // Stats Data
  const userMoney = useStatsStore(state => state.money);
  const { core: playerCore, attributes: playerAttributes } = usePlayerStore();

  // -- Navigation Handlers --

  const handleAction = (key: string) => {
    switch (key) {
      // Leisure
      case 'nightOut': startNightOut(); break;
      case 'spa': navigation.navigate('Sanctuary'); break;
      case 'gym': navigation.navigate('Gym'); break; // Screen navigation
      case 'shopping': navigation.navigate('Assets', { screen: 'Shopping' }); break;

      // Lifestyle
      case 'travel': navigation.navigate('Travel'); break;
      case 'belongings': navigation.navigate('Assets', { screen: 'Belongings' }); break;
      case 'myCompany': navigation.navigate('Assets', { screen: 'MyCompany' }); break;
      case 'education': openEducation(); break;
      case 'dna': navigation.navigate('DNA'); break;
      case 'contacts': handleBottomNav('Contacts'); break;
      case 'settings': Alert.alert('Settings', 'Settings screen is coming soon!'); break;
      case 'health': Alert.alert('Health', 'Health app is coming soon!'); break;
      case 'calendar': Alert.alert('Calendar', 'Calendar app is coming soon!'); break;
      case 'notes': Alert.alert('Notes', 'Notes app is coming soon!'); break;
      case 'mail': Alert.alert('Mail', 'Mail app is coming soon!'); break;
      case 'weather': Alert.alert('Weather', 'Weather app is coming soon!'); break;

      default: break;
    }
  };

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('Home', undefined);
        break;
      case 'Stats':
        navigation.navigate('FinancialReport');
        break;
      case 'Contacts':
        navigation.navigate('Love');
        break;
      case 'Profile':
        navigation.navigate('DNA');
        break;
    }
  };

  const renderAppIcon = (item: { key: string; label: string; icon: string; gradient: string[] }) => (
    <Pressable key={item.key} style={({ pressed }) => [styles.appCard, pressed && styles.appCardPressed]} onPress={() => handleAction(item.key)}>
      <LinearGradient
        colors={item.gradient}
        style={styles.appCardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name={item.icon} size={42} color="#FFFFFF" style={styles.appIconVector} />
      </LinearGradient>
      <Text style={styles.appIconLabel} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* ULTRA PREMIUM BACKGROUND - Deep Dark Luxury Palette */}
      <LinearGradient
        colors={['#0a0a0c', '#000000', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>LIFESTYLE</Text>
          <View style={styles.headerAccent} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leisure</Text>
            <View style={styles.grid}>
              {SECTION_LEISURE.map(renderAppIcon)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Essentials</Text>
            <View style={styles.grid}>
              {SECTION_LIFESTYLE.map(renderAppIcon)}
            </View>
          </View>

          {/* Spacer for Bottom Bar */}
          <View style={{ height: 40 }} />

          {/* DEBUG SECTION - Redesigned for premium look */}
          <View style={styles.debugRow}>
            <Pressable
              style={({ pressed }) => [styles.debugButton, { backgroundColor: 'rgba(192, 57, 43, 0.15)', borderColor: 'rgba(192, 57, 43, 0.3)', flex: 1, marginRight: 12 }, pressed && { opacity: 0.7 }]}
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
              <Text style={[styles.debugButtonText, { color: '#e74c3c' }]}>Reset</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.debugButton, { backgroundColor: 'rgba(39, 174, 96, 0.15)', borderColor: 'rgba(39, 174, 96, 0.3)', flex: 2 }, pressed && { opacity: 0.7 }]}
              onPress={() => {
                useStatsStore.getState().earnMoney(100_000_000);
                Alert.alert('Success', '$100M added to your balance!');
              }}
            >
              <Text style={[styles.debugButtonText, { color: '#2ecc71' }]}>Add $100M</Text>
            </Pressable>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Universal Crystal Navigation Bar */}
        <CrystalNavBar activeTab="Life" variant="dark" />

      </SafeAreaView>

      {/* --- MODALS --- */}
      < MatchPopup
        visible={visible}
        candidate={matchCandidate}
        onAccept={acceptMatch}
        onReject={rejectMatch}
        onClose={closeMatch}
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
      <EducationMasterModal />
      <EducationExamModal />
    </View >
  );
};

export default LifeScreen;

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: '#E5E5E5',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  headerAccent: {
    width: 44,
    height: 2,
    backgroundColor: '#D4AF37', // Gold accent
    marginTop: 14,
    borderRadius: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 140, // Enough space for Bottom Bar
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
    marginBottom: 20,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  appCard: {
    width: '21%', // 4 columns roughly ((100 - (18 * 3))/4)
    aspectRatio: 0.75, // Taller to fit label
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  appCardPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  appCardInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18, // iOS App Icon curvature
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appIconVector: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  appIconLabel: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  debugRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 4,
    width: '100%',
    alignItems: 'center',
  },
  debugButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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