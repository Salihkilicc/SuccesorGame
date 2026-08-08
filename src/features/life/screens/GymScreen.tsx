import React from 'react';
import { StyleSheet, View, Platform, UIManager } from 'react-native';
import { useGymSystem } from '../components/Gym/useGymSystem';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import all Gym Views
import GymHubView from '../components/Gym/GymHubView';
import GymMartialArtsView from '../components/Gym/GymMartialArtsView';
import GymWorkoutConfigView from '../components/Gym/GymWorkoutConfigView';
import GymLockerRoomView from '../components/Gym/GymLockerRoomView';
import GymTrainerView from '../components/Gym/GymTrainerView';
import GymMembershipView from '../components/Gym/GymMembershipView';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GymScreen = () => {
    const { activeView } = useGymSystem();


    const renderOverlay = () => {
        // Only render overlay if NOT on HUB
        if (activeView === 'HUB') return null;

        switch (activeView) {
            case 'MARTIAL_ARTS':
                return <GymMartialArtsView />;
            case 'WORKOUT':
                return <GymWorkoutConfigView />;
            case 'SUPPLEMENTS':
                return <GymLockerRoomView />;
            case 'TRAINER':
                return <GymTrainerView />;
            case 'MEMBERSHIP':
                return <GymMembershipView />;
            default:
                return null;
        }
    };

    return (
        <AppLaunchLoader
            appName="Gym"
            appIcon={<MaterialCommunityIcons name="dumbbell" size={64} color="#FFFFFF" />}
            backgroundColor="#020626"
        >
            <View style={styles.container}>
                {/* LAYER 1: Hub (Always Rendered) */}
                <View style={styles.baseLayer}>
                    <GymHubView />
                </View>

                {/* LAYER 2: Overlay (Conditionally Rendered) */}
                {activeView !== 'HUB' && (
                    <View style={styles.overlayLayer}>
                        {renderOverlay()}
                    </View>
                )}
            </View>
        </AppLaunchLoader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020626',
    },
    baseLayer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlayLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
});

export default GymScreen;
