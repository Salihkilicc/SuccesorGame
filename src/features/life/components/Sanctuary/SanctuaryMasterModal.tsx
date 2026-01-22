import React, { useEffect } from 'react';
import { Modal, StyleSheet, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import Views
import SanctuaryHubView from './SanctuaryHubView';
import SanctuaryMassageView from './SanctuaryMassageView';
import SanctuaryGroomingView from './SanctuaryGroomingView';
import SanctuarySurgeryView from './SanctuarySurgeryView';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SanctuaryMasterModalProps = {
    isHubVisible: boolean;
    activeView: 'HUB' | 'MASSAGE' | 'GROOMING' | 'SURGERY' | 'SUN_STUDIO';
    closeSanctuary: () => void;
    navigate: (view: 'HUB' | 'MASSAGE' | 'GROOMING' | 'SURGERY' | 'SUN_STUDIO') => void;
    goBack: () => void;
    isVIPMember: boolean;
    buyMembership: () => void;
    performSurgery: (doctorId: string) => void;
    getFreshCut: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
    activeBuffs: { freshCut: boolean };
    usageTracker: { surgery: number | null; massage: number | null; grooming: number | null };
};

/**
 * SANCTUARY MASTER MODAL
 * 
 * The unified Modal for the Sanctuary "Spa" system.
 * Uses a gym-style "Fade Screen" architecture.
 * Controlled by props passed from LifeScreen -> useSanctuarySystem hook.
 */
const SanctuaryMasterModal = ({
    isHubVisible,
    activeView,
    closeSanctuary,
    navigate,
    goBack,
    isVIPMember,
    buyMembership,
    performSurgery,
    getFreshCut,
    handleServicePurchase
}: SanctuaryMasterModalProps) => {

    const navigation = useNavigation<any>();

    const handleGoHome = () => {
        closeSanctuary();
        navigation.navigate('Home');
    };

    // Animate view transitions
    useEffect(() => {
        if (isHubVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, [activeView, isHubVisible]);

    const renderOverlay = () => {
        if (activeView === 'HUB') return null;

        switch (activeView) {
            case 'MASSAGE':
                return (
                    <SanctuaryMassageView
                        visible={true}
                        onClose={goBack}
                        isVIPMember={isVIPMember}
                        handleServicePurchase={handleServicePurchase}
                        onGoHome={handleGoHome}
                    />
                );
            case 'GROOMING':
                return (
                    <SanctuaryGroomingView
                        visible={true}
                        onClose={goBack}
                        getFreshCut={getFreshCut}
                        handleServicePurchase={handleServicePurchase}
                        onGoHome={handleGoHome}
                    />
                );
            case 'SURGERY':
                return (
                    // @ts-ignore - Prop mismatch fix pending on file rename/refactor
                    <SanctuarySurgeryView
                        visible={true}
                        onClose={goBack}
                        performSurgery={performSurgery}
                        handleServicePurchase={handleServicePurchase}
                        onGoHome={handleGoHome}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            visible={isHubVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeSanctuary}
            statusBarTranslucent={true}
        >
            {/* LAYER 1: Hub (Always Rendered) */}
            <View style={styles.baseLayer}>
                <SanctuaryHubView
                    closeSanctuary={closeSanctuary}
                    navigate={navigate}
                    isVIPMember={isVIPMember}
                    buyMembership={buyMembership}
                    onGoHome={handleGoHome}
                />
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
        backgroundColor: '#111827', // Dark background for smooth fade
    },
});

export default SanctuaryMasterModal;
