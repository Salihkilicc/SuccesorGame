import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
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
    useLocale();
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
                        <Text style={styles.title}>{t('ui.travelTo')}</Text>
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
                                        isSelected && { borderColor: loc.theme.primary, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
                                        isLocked && styles.cardLocked,
                                        pressed && isUnlocked && { transform: [{ scale: 0.98 }] }
                                    ]}
                                >
                                    <View style={[styles.icon, { backgroundColor: isLocked ? '#535B5F' : loc.theme.primary }]}>
                                        <Text style={{ fontSize: 20 }}>{isLocked ? '🔒' : '🏛️'}</Text>
                                    </View>

                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Text style={[styles.locName, isLocked && { color: '#FFFFFF' }]}>
                                            {loc.name.toUpperCase()}
                                        </Text>
                                        <Text style={[styles.locSub, { color: isUnlocked ? loc.theme.secondary : '#666E70' }]}>
                                            {isLocked
                                                ? `Req: ${loc.requirement} Rep`
                                                : `Max Bet: $${loc.maxBet.toLocaleString()}`
                                            }
                                        </Text>
                                    </View>

                                    {isSelected && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{t('ui.current')}</Text>
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
        backgroundColor: 'rgba(28,36,44,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#434B50',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        maxHeight: '80%',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1C242C'
    },
    title: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeText: {
        color: '#FFFFFF',
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
        backgroundColor: '#434B50',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)'
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
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(207,208,210,0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)'
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800'
    }
});
