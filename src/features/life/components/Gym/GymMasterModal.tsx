import React, { useEffect } from 'react';
import { Modal, StyleSheet, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useGymSystem } from './useGymSystem';

// Import all Gym Views
import GymHubView from './GymHubView';
import GymMartialArtsView from './GymMartialArtsView';
import GymWorkoutConfigView from './GymWorkoutConfigView';
import GymLockerRoomView from './GymLockerRoomView';
import GymTrainerView from './GymTrainerView';
import GymMembershipView from './GymMembershipView';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * GYM MASTER MODAL
 * 
 * The single native Modal for the entire Gym system.
 * 
 * Architecture:
 * - Layer 1 (Base): GymHubView (always rendered)
 * - Layer 2 (Overlay): Sub-views rendered absolutely on top with smooth transitions
 * 
 * Animation:
 * - Uses LayoutAnimation for smooth fade in/out when activeView changes
 */
const GymMasterModal = () => {
    const { isVisible, activeView, actions } = useGymSystem();
    const { closeGym } = actions;

    // Animate view transitions
    useEffect(() => {
        if (isVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, [activeView, isVisible]);

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
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeGym}
            statusBarTranslucent={true}
        >
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
        </Modal>
    );
};

const styles = StyleSheet.create({
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

export default GymMasterModal;
