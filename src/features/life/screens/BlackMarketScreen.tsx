import React from 'react';
import { StyleSheet, View, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlackMarketSystem } from '../components/BlackMarket/useBlackMarketSystem';
import { BlackMarketHubView } from '../components/BlackMarket/BlackMarketHubView';
import { BlackMarketDealView } from '../components/BlackMarket/BlackMarketDealView';
import { PoliceChaseGame } from '../components/BlackMarket/PoliceChaseGame';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BlackMarketScreen: React.FC = () => {
    const navigation = useNavigation();
    const { data, actions } = useBlackMarketSystem();
    const { activeView, currentDeal } = data;

    const handleClose = () => {
        navigation.goBack();
    };

    const handleBuy = () => {
        const result = actions.buyItem();
        if (result.success) {
            Alert.alert('Success', result.message);
        } else if (data.activeView !== 'RAID') {
            Alert.alert('Error', result.message);
        }
    };

    const handleConsume = () => {
        if (!currentDeal) return;
        const result = actions.consumeDrug(currentDeal);
        if (result.success) {
            Alert.alert('Consumed', result.message);
            if (result.warning) Alert.alert('Warning', result.warning);
        } else if (data.activeView !== 'RAID') {
            Alert.alert('Error', result.message);
        }
    };

    const handlePoliceGameComplete = (won: boolean) => {
        const { success } = actions.resolveRaid(won);
        if (!success) {
            handleClose(); // Kick out if caught
        }
    };

    return (
        <AppLaunchLoader
            appName="Black Market"
            appIcon={<MaterialCommunityIcons name="incognito" size={64} color="#FFFFFF" />}
            backgroundColor="#020626"
        >
            <SafeAreaView style={styles.container}>
                {/* Layer 1: Hub View */}
                <BlackMarketHubView
                    onOpenCategory={actions.openCategory}
                    onClose={handleClose}
                />

                {/* Layer 2: Deal Overlay */}
                {activeView === 'DEAL' && currentDeal && (
                    <View style={StyleSheet.absoluteFill}>
                        <BlackMarketDealView
                            deal={currentDeal}
                            onBuy={handleBuy}
                            onPass={actions.passItem}
                            onConsume={handleConsume}
                            isDrug={currentDeal.isDrug || false}
                        />
                    </View>
                )}

                {/* Layer 3: Police Game Overlay */}
                {activeView === 'RAID' && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
                        <PoliceChaseGame
                            onComplete={handlePoliceGameComplete}
                            onClose={actions.closeRaid}
                        />
                    </View>
                )}
            </SafeAreaView>
        </AppLaunchLoader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020626',
    },
});

export default BlackMarketScreen;
