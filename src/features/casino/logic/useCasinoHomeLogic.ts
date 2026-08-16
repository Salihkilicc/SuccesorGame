// src/features/casino/logic/useCasinoHomeLogic.ts
import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useStatsStore } from '../../../core/store';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import { LocationId, CasinoLocation } from '../data/casinoData';

export interface CasinoHomeLogicReturn {
    state: {
        currentLocation: CasinoLocation;
        currentLocationId: LocationId;
        unlockedLocations: CasinoLocation[];
        casinoReputation: number;
        money: number;
        locationModalVisible: boolean;
    };
    actions: {
        setCurrentLocationId: (id: LocationId) => void;
        openLocationModal: () => void;
        closeLocationModal: () => void;
        handleGamePress: (screenName: string, params?: Record<string, any>) => void;
        handleBack: () => void;
    };
}

export const useCasinoHomeLogic = (): CasinoHomeLogicReturn => {
    const navigation = useNavigation<any>();
    const { money } = useStatsStore();

    const {
        currentLocation,
        currentLocationId,
        setCurrentLocationId,
        unlockedLocations,
        casinoReputation,
    } = useCasinoSystem();

    const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

    const openLocationModal = useCallback(() => {
        setLocationModalVisible(true);
    }, []);

    const closeLocationModal = useCallback(() => {
        setLocationModalVisible(false);
    }, []);

    const handleGamePress = useCallback(
        (screenName: string, params?: Record<string, any>) => {
            navigation.navigate(screenName, {
                ...params,
                betAmount: 0,
                locationId: currentLocation.id,
            });
        },
        [navigation, currentLocation.id],
    );

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return {
        state: {
            currentLocation,
            currentLocationId,
            unlockedLocations,
            casinoReputation,
            money,
            locationModalVisible,
        },
        actions: {
            setCurrentLocationId,
            openLocationModal,
            closeLocationModal,
            handleGamePress,
            handleBack,
        },
    };
};
