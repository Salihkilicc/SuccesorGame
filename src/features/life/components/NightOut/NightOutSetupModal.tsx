
import React, { useMemo } from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
    SafeAreaView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../../core/theme';
import CrystalNavBar from '../../../../navigation/components/CrystalNavBar';
import { VENUES, Venue, RegionCode } from './data/nightOutVenues';
import { SetupStep, TravelMethod } from './useNightOutSystem';

import RegionSelectView from './components/RegionSelectView';
import VenueSelectView from './components/VenueSelectView';
import TravelMethodView from './components/TravelMethodView';
import ConfirmationView from './components/ConfirmationView';

type NightOutSetupModalProps = {
    visible: boolean;
    onClose: () => void;
    // Multi-step flow props
    step: SetupStep;
    selectedRegion: RegionCode | null;
    selectedClub: Venue | null;
    travelCostAmount: number;
    hasPrivateJet: boolean;
    totalCost: number;
    // Navigation & Hangar
    goBack: () => void;
    isHangarOpen: boolean;
    setIsHangarOpen: (isOpen: boolean) => void;
    // Actions
    selectRegion: (region: RegionCode) => void;
    selectVenue: (venue: Venue) => void;
    selectTravelMethod: (method: TravelMethod) => void;
    confirmNightOut: () => void;
};

const { width } = Dimensions.get('window');

const NightOutSetupModal = ({
    visible,
    onClose,
    step,
    selectedRegion,
    selectedClub,
    travelCostAmount,
    hasPrivateJet,
    totalCost,
    goBack,
    isHangarOpen,
    setIsHangarOpen,
    selectRegion,
    selectVenue,
    selectTravelMethod,
    confirmNightOut,
}: NightOutSetupModalProps) => {
    useLocale();
    const navigation = useNavigation<any>();

    // Filter venues by selected region
    const filteredVenues = useMemo(() => {
        if (!selectedRegion) return [];
        return VENUES.filter(v => v.region === selectedRegion);
    }, [selectedRegion]);

    // Progress indicator
    const getStepNumber = () => {
        switch (step) {
            case 'region_select': return 1;
            case 'venue_select': return 2;
            case 'travel_select': return 3;
            case 'completed': return 4;
            default: return 1;
        }
    };

    const getTotalSteps = () => {
        // If USA (Local) venue selected, skip travel step
        if (selectedClub?.region === 'USA') return 3;
        return 4;
    };

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.card}>
                {/* Header with Progress & Back Button */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Pressable
                            onPress={() => {
                                if (step === 'region_select') {
                                    onClose();
                                } else {
                                    goBack();
                                }
                            }}
                            style={({ pressed }) => ({
                                padding: 8,
                                opacity: pressed ? 0.7 : 1
                            })}>
                            <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' }}>←</Text>
                        </Pressable>
                    </View>
                    <View style={styles.headerCenter}>
                        <Text style={styles.title}>{t('life.nightOut')}</Text>
                        <Text style={styles.progress}>
                            Step {getStepNumber()} of {getTotalSteps()}
                        </Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                {/* Step Content */}
                <View style={styles.content}>
                    {step === 'region_select' && (
                        <RegionSelectView
                            selectedRegion={selectedRegion}
                            onSelectRegion={selectRegion}
                        />
                    )}

                    {step === 'venue_select' && selectedRegion && (
                        <VenueSelectView
                            region={selectedRegion}
                            venues={filteredVenues}
                            selectedVenue={selectedClub}
                            onSelectVenue={selectVenue}
                            onBack={goBack}
                        />
                    )}

                    {step === 'travel_select' && (
                        <TravelMethodView
                            hasPrivateJet={hasPrivateJet}
                            onSelectMethod={selectTravelMethod}
                            onBack={goBack}
                            isHangarOpen={isHangarOpen}
                            setIsHangarOpen={setIsHangarOpen}
                        />
                    )}

                    {step === 'completed' && selectedClub && (
                        <ConfirmationView
                            venue={selectedClub}
                            travelCost={travelCostAmount}
                            totalCost={totalCost}
                            onConfirm={confirmNightOut}
                            onCancel={onClose}
                        />
                    )}
                </View>
            </SafeAreaView>

            {/* Bottom Stats Footer */}
            <CrystalNavBar activeTab="Life" variant="dark" />
        </View>
    );
};

export default NightOutSetupModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#0B0635',
    },
    card: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0B0635',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 70 : 50, // Screen pulled down further 
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerLeft: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#C8C0EF',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    progress: {
        fontSize: 12,
        color: '#C8C0EF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
});
