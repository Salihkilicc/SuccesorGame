import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation';

import { useNightOutSystem } from '../components/NightOut/useNightOutSystem';
import NightOutSetupModal from '../components/NightOut/NightOutSetupModal';
import NightOutOutcomeModal from '../components/NightOut/NightOutOutcomeModal';
import HookupGameModal from '../components/NightOut/HookupGameModal';
import NightEndModal from '../components/NightOut/NightEndModal';
import PregnancyRevealModal from '../components/NightOut/PregnancyRevealModal';
import NightConclusionModal from '../components/NightOut/NightConclusionModal';

import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NightOutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NightOutScreen = () => {
    const navigation = useNavigation<NightOutNavigationProp>();

    const triggerEncounterBool = useCallback((_context: string) => false, []);

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
        step,
        selectedRegion,
        selectedClub,
        travelCostAmount,
        hasPrivateJet,
        totalCost,
        goBack: goBackNightOut,
        isHangarOpen,
        setIsHangarOpen,
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
    } = useNightOutSystem(triggerEncounterBool);

    // Called when user presses back on the first step
    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <AppLaunchLoader
                appName="Night Out"
                appIcon={<MaterialCommunityIcons name="glass-cocktail" size={64} color="#EDE8E4" />}
                backgroundColor="#0F0E0D"
            >
                {/* Main Setup Flow — shown as full screen */}
                <NightOutSetupModal
                    visible={true}
                    onClose={handleClose}
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

                {/* Outcome & Chained Modals — appear on top of the screen */}
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
                    onClose={() => {
                        handleConclusionClose();
                        navigation.goBack();
                    }}
                />
                <PregnancyRevealModal
                    visible={pregnancyModalVisible}
                    onClose={() => setPregnancyModalVisible(false)}
                />
            </AppLaunchLoader>
        </View>
    );
};

export default NightOutScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0E0D',
    },
});
