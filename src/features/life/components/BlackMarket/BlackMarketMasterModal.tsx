import React from 'react';
import { Modal, View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useBlackMarketSystem } from './useBlackMarketSystem';
import { BlackMarketHubView } from './BlackMarketHubView';
import { BlackMarketDealView } from './BlackMarketDealView';
import { PoliceChaseGame } from './PoliceChaseGame';
import { BlackMarketCategory } from './blackMarketData';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

/**
 * BLACK MARKET MASTER MODAL
 * 
 * Single Modal container for the entire Black Market system.
 * 
 * Architecture:
 * - Layer 1 (Base): BlackMarketView (main interface)
 * - Layer 2 (Overlay): PoliceChaseGame (triggered by raid)
 */
interface BlackMarketMasterModalProps {
    visible: boolean;
    onClose: () => void;
}

export const BlackMarketMasterModal: React.FC<BlackMarketMasterModalProps> = ({ visible, onClose }) => {
    const { data, actions } = useBlackMarketSystem();

    // -- Trigger Logic --
    // We check for raid whenever `suspicion` changes, handled by the system hook mostly,
    // but we need to show the game if triggered.
    // Actually, `useBlackMarketSystem` has `triggerRaid()` action, but we need to call it somewhere.
    // The system logic says "Triggered if suspicion > 80 during any transaction".
    // Let's handle the triggering in the `handlePurchase` or `handleConsume` wrappers here.

    // -- View Logic derived from Hook --
    const { activeView, currentDeal } = data;

    const handleBuy = () => {
        const result = actions.buyItem();
        if (result.success) {
            Alert.alert('Success', result.message);
        } else if (data.activeView !== 'RAID') {
            // Only show error if we weren't interrupted by a raid
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
        // Use the centralized resolveRaid logic from the hook
        const { message, success } = actions.resolveRaid(won);

        // Alert is already handled inside PoliceChaseGame for "Escaped/Busted".
        // Use resolveRaid to apply the logic (add item, fine, etc.)
        // We can optionally show a second alert for the specific item reward if needed, 
        // but to prevent "Multiple Alerts" annoyance reported by user, we'll keep it silent 
        // or use a Toast if we had one.
        // Actually, let's just log it or rely on the user checking inventory.
        // OR: We can show the specific item reward ONLY if won, chained after the first?
        // No, let's trust the user's flow. They asked to fix duplicate alerts.

        if (!success) {
            onClose(); // Kick out if caught
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>

                {/* Layer 1: Hub View */}
                {/* Always visible as background, but accessible only if activeView !== RAID */}
                <BlackMarketHubView
                    onOpenCategory={actions.openCategory}
                    onClose={onClose}
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
                            onClose={actions.closeRaid} // Fallback
                        />
                    </View>
                )}

            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
