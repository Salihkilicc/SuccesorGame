// src/features/profile/components/LuxoNetModalWrapper.tsx
//
// ============================================================================
//  LUXONET MODAL WRAPPER
// ============================================================================
//
//  Wraps the existing LuxoNet / ShoppingScreen into a full-screen executive
//  modal with VIP Sovereign Access header controls.
//
// ============================================================================

import React from 'react';
import { Modal, View, StyleSheet, Pressable, Text, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShoppingScreen from '../../shopping/screens/ShoppingScreen';

interface LuxoNetModalWrapperProps {
    visible: boolean;
    onClose: () => void;
}

export const LuxoNetModalWrapper: React.FC<LuxoNetModalWrapperProps> = ({
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
                <LinearGradient
                    colors={['#181520', '#100E17', '#0A090F']}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={styles.safeArea}>
                    {/* VIP Sovereign Header Bar */}
                    <View style={styles.headerBar}>
                        <View style={styles.vipTag}>
                            <Text style={styles.vipTagText}>VIP SOVEREIGN VAULT</Text>
                        </View>
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Integrated Existing LuxoNet/ShoppingScreen */}
                    <View style={styles.screenContainer}>
                        <ShoppingScreen />
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A090F',
    },
    safeArea: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#282136',
    },
    vipTag: {
        backgroundColor: '#35210D',
        borderWidth: 1,
        borderColor: '#FF9500',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    vipTagText: {
        color: '#FBBF24',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#201A2C',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#372D4C',
    },
    closeButtonText: {
        color: '#CBD5E1',
        fontSize: 14,
        fontWeight: '700',
    },
    screenContainer: {
        flex: 1,
    },
});

export default LuxoNetModalWrapper;
