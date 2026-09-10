// @english-ok shelved: nothing mounts this component, so nobody reads
// these words. Translating a dead screen is work that cannot be checked.
// See the SHELVED note below.
// @orphan-ok shelved: nothing mounts this. The door into the shop is the
// profile banner -> navigate('Shopping'). See the note below.
// src/features/profile/components/LuxoNetInventoryModal.tsx
//
// ============================================================================
//  SHELVED: nothing mounts this, and the door it belonged to moved
// ============================================================================
//
//  Reported by the reachability audit as a component nothing renders, and it
//  is right. The route into the shop was settled in task 94: PROFILE -> the
//  VIP banner -> `navigate('Shopping')`, which is the real ShoppingScreen on
//  the root stack. `useProfileLogic` still carries `openLuxoNetModal` and
//  `isLuxoNetModalVisible`, and they now push a screen rather than open this.
//
//  Kept rather than deleted, deliberately. It is a finished piece of UI with
//  its own translation keys, and the four item `useLuxoNetStore` catalogue it
//  reads is the same one core/luxury/upkeep.ts calls "the only place in the
//  project that priced maintenance" and expects to read again.
//
//  If it is ever mounted again, two things in it need fixing first and both
//  are already on the audit's list: it draws its own close glyph on top of a
//  header that has one, and its acquire button paints #000000 without saying
//  what fill is under it (a #FF9500 to #D97706 gradient, which measures 9.55
//  and 6.59 - readable, but the audit cannot see a gradient and says so).
// ============================================================================
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
