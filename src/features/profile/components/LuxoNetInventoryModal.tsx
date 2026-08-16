// src/features/profile/components/LuxoNetInventoryModal.tsx
//
// ============================================================================
//  LUXONET INVENTORY / BELONGINGS MODAL
// ============================================================================
//
//  Executive modal presenting the player's owned luxury assets using the
//  official ScreenHeader component.
//
// ============================================================================

import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import ScreenHeader from '../../../components/common/ScreenHeader';
import BelongingsScreen from '../../shopping/screens/BelongingsScreen';

interface LuxoNetInventoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LuxoNetInventoryModal: React.FC<LuxoNetInventoryModalProps> = ({
    visible,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Official Game Screen Header */}
                <ScreenHeader
                    title="INVENTORY"
                    category="company"
                    onBack={onClose}
                    inset={false}
                />

                {/* Integrated Belongings/Inventory Screen */}
                <View style={styles.screenWrap}>
                    <BelongingsScreen />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    screenWrap: {
        flex: 1,
    },
});

export default LuxoNetInventoryModal;
