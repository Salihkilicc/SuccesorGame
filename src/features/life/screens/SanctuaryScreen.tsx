import React from 'react';
import { StyleSheet, View, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSanctuarySystem } from '../components/Sanctuary/store/useSanctuarySystem';

// Import Views
import SanctuaryHubView from '../components/Sanctuary/SanctuaryHubView';
import SanctuaryMassageView from '../components/Sanctuary/modals/SanctuaryMassageView';
import SanctuaryGroomingView from '../components/Sanctuary/modals/SanctuaryGroomingView';
import SanctuarySurgeryView from '../components/Sanctuary/modals/SanctuarySurgeryView';
import SanctuaryResultModal from '../components/Sanctuary/modals/SanctuaryResultModal';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SanctuaryScreen = () => {
    const navigation = useNavigation<any>();

    const {
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
        usageTracker,
        isResultVisible,
        resultData
    } = useSanctuarySystem();

    const handleGoHome = () => {
        closeSanctuary();
        navigation.goBack();
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
                    // @ts-ignore
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
        <AppLaunchLoader
            appName="Sanctuary"
            appIcon={<MaterialCommunityIcons name="spa" size={64} color="#FFFFFF" />}
            backgroundColor="#020626"
        >
            <View style={styles.container}>
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

                <SanctuaryResultModal
                    visible={isResultVisible}
                    resultData={resultData}
                    onClose={closeSanctuary}
                />
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
        backgroundColor: '#422B71', // Dark background for smooth fade
    },
});

export default SanctuaryScreen;
