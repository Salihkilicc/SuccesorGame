import React from 'react';
import { Modal, StyleSheet, View, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppLaunchLoader from '../../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import Views
import SanctuaryHubView from './SanctuaryHubView';
import SanctuaryMassageView from './modals/SanctuaryMassageView';
import SanctuaryGroomingView from './modals/SanctuaryGroomingView';
import SanctuarySurgeryView from './modals/SanctuarySurgeryView';

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
    usageTracker: { surgery: boolean; massage: boolean; grooming: boolean };
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
    handleServicePurchase,
    activeBuffs,
    usageTracker
}: SanctuaryMasterModalProps) => {

    const navigation = useNavigation<any>();

    const handleGoHome = () => {
        closeSanctuary();
        navigation.navigate('Home');
    };


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
                        activeBuffs={activeBuffs}
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
            transparent={false}
            animationType="none"
            onRequestClose={closeSanctuary}
            statusBarTranslucent={true}
        >
            {isHubVisible && (
                <AppLaunchLoader
                    appName="Sanctuary"
                    appIcon={<MaterialCommunityIcons name="spa" size={64} color="#EDE8E4" />}
                    backgroundColor="#5FB37A"
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
                </AppLaunchLoader>
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
        backgroundColor: '#5FB37A', // Dark background for smooth fade
    },
});

export default SanctuaryMasterModal;
