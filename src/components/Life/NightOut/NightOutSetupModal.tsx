import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    ScrollView,
} from 'react-native';
import { theme } from '../../../theme';
import { CLUBS, NightOutClub } from './useNightOutSystem';
import { InventoryItem } from '../../../store/useUserStore';

type NightOutSetupModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedClub: NightOutClub;
    setSelectedClub: (club: NightOutClub) => void;
    selectedAircraft: InventoryItem | null;
    setSelectedAircraft: (item: InventoryItem | null) => void;
    aircrafts: InventoryItem[];
    needsTravel: boolean;
    totalCost: number;
};

const { width } = Dimensions.get('window');

const NightOutSetupModal = ({
    visible,
    onClose,
    onConfirm,
    selectedClub,
    setSelectedClub,
    selectedAircraft,
    setSelectedAircraft,
    aircrafts,
    needsTravel,
    totalCost,
}: NightOutSetupModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>PLAN YOUR NIGHT</Text>
                    <Text style={styles.subtitle}>Select a destination & travel method</Text>

                    <ScrollView style={styles.scrollContent}>
                        {/* LOCATION SELECTOR */}
                        <Text style={styles.sectionHeader}>DESTINATION</Text>
                        <View style={styles.optionsGrid}>
                            {CLUBS.map(club => {
                                const isSelected = selectedClub.id === club.id;
                                return (
                                    <Pressable
                                        key={club.id}
                                        onPress={() => setSelectedClub(club)}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.optionButtonSelected,
                                        ]}>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected,
                                            ]}>
                                            {club.name}
                                        </Text>
                                        <Text style={styles.optionSubText}>
                                            {club.location}, {club.country}
                                        </Text>
                                        <Text style={styles.feeText}>
                                            Entry: ${club.entryFee.toLocaleString()}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* AIRCRAFT SELECTOR (Conditional) */}
                        {needsTravel && (
                            <View style={styles.travelSection}>
                                <Text style={styles.sectionHeader}>
                                    TRAVEL METHOD (International)
                                </Text>
                                {aircrafts.length === 0 ? (
                                    <View style={styles.charterBox}>
                                        <Text style={styles.charterTitle}>Charter Flight Jet</Text>
                                        <Text style={styles.charterSub}>You own no aircrafts.</Text>
                                        <Text style={styles.charterCost}>Cost: $50,000</Text>
                                    </View>
                                ) : (
                                    <View style={styles.optionsGrid}>
                                        {aircrafts.map(aircraft => {
                                            const isSelected = selectedAircraft?.id === aircraft.id;
                                            return (
                                                <Pressable
                                                    key={aircraft.id}
                                                    onPress={() => setSelectedAircraft(aircraft)}
                                                    style={[
                                                        styles.optionButton,
                                                        isSelected && styles.optionButtonSelected,
                                                    ]}>
                                                    <Text
                                                        style={[
                                                            styles.optionText,
                                                            isSelected && styles.optionTextSelected,
                                                        ]}>
                                                        {aircraft.name}
                                                    </Text>
                                                    <Text style={styles.optionSubText}>
                                                        Owned Aircraft
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.totalLabel}>TOTAL COST</Text>
                            <Text style={styles.totalValue}>
                                ${totalCost.toLocaleString()}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.confirmButton,
                                pressed && styles.confirmButtonPressed,
                            ]}>
                            <Text style={styles.confirmButtonText}>GO NIGHT OUT</Text>
                        </Pressable>
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default NightOutSetupModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(400, width - 32),
        height: '80%',
        backgroundColor: '#121212',
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: '#333',
        padding: 20,
        overflow: 'hidden',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollContent: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 1,
    },
    optionsGrid: {
        gap: 8,
    },
    optionButton: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    optionButtonSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#2A1F10', // subtle gold tint
    },
    optionText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    optionTextSelected: {
        color: theme.colors.primary,
    },
    optionSubText: {
        color: '#AAA',
        fontSize: 12,
        marginTop: 2,
    },
    feeText: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    travelSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
    },
    charterBox: {
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#555',
    },
    charterTitle: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    charterSub: {
        color: '#888',
        fontSize: 12,
        marginVertical: 4,
    },
    charterCost: {
        color: theme.colors.error,
        fontWeight: '700',
    },
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    totalValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmButtonText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center'
    },
    closeText: {
        color: '#666',
        fontSize: 14
    }
});
