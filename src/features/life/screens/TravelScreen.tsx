import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Travel Components and System
import { useTravelSystem } from '../components/Travel/useTravelSystem';
import TravelHubModal from '../components/Travel/TravelHubModal';
import TravelBookingModal from '../components/Travel/TravelBookingModal';
import TravelExperienceModal from '../components/Travel/TravelExperienceModal';
import SouvenirMiniGame from '../components/Travel/SouvenirMiniGame';
import SouvenirCollectionModal from '../components/Travel/SouvenirCollectionModal';

const TravelScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    // Empty trigger as we don't handle encounters directly in this level anymore
    const dummyTrigger = (context: string, countryId?: string) => false;

    const {
        currentView, selectedSpot, travelClass, bringPartner, resultData: travelResultData, vacationSpots,
        openTravel, closeTravel, setTravelClass, setBringPartner, openBooking, startTrip, onExperienceComplete, onMiniGameComplete, openCollection, closeCollection, closeBooking, hasSouvenir,
    } = useTravelSystem(dummyTrigger);

    // currentView'in önce non-null bir değer aldığını takip et
    const hasSeenActiveViewRef = useRef(false);

    useEffect(() => {
        if (isFocused) {
            openTravel();
        } else {
            closeTravel();
            hasSeenActiveViewRef.current = false;
        }
    }, [isFocused, openTravel, closeTravel]);

    // currentView non-null olduysa kaydet; null'a dönünce geri git
    useEffect(() => {
        if (currentView !== null) {
            // Bir travel view'i gerçekten görüldü
            hasSeenActiveViewRef.current = true;
        } else if (hasSeenActiveViewRef.current) {
            // Travel tamamlandı → geri dön
            hasSeenActiveViewRef.current = false;
            navigation.goBack();
        }
    }, [currentView, navigation]);

    const handleHomePress = () => {
        closeTravel();
        navigation.goBack();
    };

    return (
        <AppLaunchLoader
            appName="Travel"
            appIcon={<MaterialCommunityIcons name="airplane" size={64} color="#FFFFFF" />}
            backgroundColor="#12379F"
        >
            <View style={styles.container}>
                <TravelHubModal
                    visible={currentView === 'HUB'}
                    vacationSpots={vacationSpots}
                    onSelectSpot={openBooking}
                    onClose={() => navigation.goBack()}
                    onOpenCollection={openCollection}
                    onHomePress={handleHomePress}
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
                    onHomePress={handleHomePress}
                />
                <TravelExperienceModal
                    visible={currentView === 'EXPERIENCE'}
                    spot={selectedSpot}
                    resultData={travelResultData}
                    onComplete={onExperienceComplete}
                    onHomePress={handleHomePress}
                />
                <SouvenirMiniGame
                    visible={currentView === 'MINIGAME'}
                    souvenir={selectedSpot?.souvenir || null}
                    onComplete={onMiniGameComplete}
                    onHomePress={handleHomePress}
                />
                <SouvenirCollectionModal
                    visible={currentView === 'COLLECTION'}
                    collectedIds={vacationSpots.filter(spot => hasSouvenir(spot.souvenir.id)).map(spot => spot.souvenir.id)}
                    onClose={closeCollection}
                    onHomePress={handleHomePress}
                />
            </View>
        </AppLaunchLoader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#12379F',
    },
});

export default TravelScreen;
