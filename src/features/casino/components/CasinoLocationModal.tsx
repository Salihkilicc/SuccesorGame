import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
// import { BlurView } from '@react-native-community/blur'; // Removed due to missing package
// Assuming we don't have BlurView installed or configured, I'll use View.
import { CASINO_LOCATIONS, LocationId, CasinoLocation } from '../data/casinoData';
import { theme } from '../../../core/theme';

interface CasinoLocationModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocationId: LocationId;
    unlockedLocations: CasinoLocation[];
    onSelectLocation: (id: LocationId) => void;
}

const CasinoLocationModal = ({ visible, onClose, currentLocationId, unlockedLocations, onSelectLocation }: CasinoLocationModalProps) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>TRAVEL TO...</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.list}>
                        {CASINO_LOCATIONS.map((loc) => {
                            const isUnlocked = unlockedLocations.some(l => l.id === loc.id);
                            const isSelected = currentLocationId === loc.id;
                            const isLocked = !isUnlocked;

                            return (
                                <Pressable
                                    key={loc.id}
                                    onPress={() => {
                                        if (isUnlocked) {
                                            onSelectLocation(loc.id as LocationId);
                                            onClose();
                                        }
                                    }}
                                    style={({ pressed }) => [
                                        styles.card,
                                        isSelected && { borderColor: loc.theme.primary, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
                                        isLocked && styles.cardLocked,
                                        pressed && isUnlocked && { transform: [{ scale: 0.98 }] }
                                    ]}
                                >
                                    <View style={[styles.icon, { backgroundColor: isLocked ? '#374151' : loc.theme.primary }]}>
                                        <Text style={{ fontSize: 20 }}>{isLocked ? '🔒' : '🏛️'}</Text>
                                    </View>

                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Text style={[styles.locName, isLocked && { color: '#6B7280' }]}>
                                            {loc.name.toUpperCase()}
                                        </Text>
                                        <Text style={[styles.locSub, { color: isUnlocked ? loc.theme.secondary : '#4B5563' }]}>
                                            {isLocked
                                                ? `Req: ${loc.requirement} Rep`
                                                : `Max Bet: $${loc.maxBet.toLocaleString()}`
                                            }
                                        </Text>
                                    </View>

                                    {isSelected && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>CURRENT</Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CasinoLocationModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#111827',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#374151',
        maxHeight: '80%',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937'
    },
    title: {
        color: '#F9FAFB',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    list: {
        padding: 16,
        gap: 12
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#374151'
    },
    cardLocked: {
        opacity: 0.5,
        borderStyle: 'dashed'
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    locName: {
        color: '#F3F4F6',
        fontSize: 16,
        fontWeight: '800'
    },
    locSub: {
        fontSize: 12,
        fontWeight: '600'
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(16,185,129,0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981'
    },
    badgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800'
    }
});
