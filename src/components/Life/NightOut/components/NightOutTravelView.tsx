import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../theme';
import { InventoryItem } from '../../../../store/useUserStore';

type NightOutTravelViewProps = {
    needsTravel: boolean;
    aircrafts: InventoryItem[];
    selectedAircraft: InventoryItem | null;
    onSelectAircraft: (aircraft: InventoryItem) => void;
};

const NightOutTravelView = ({
    needsTravel,
    aircrafts,
    selectedAircraft,
    onSelectAircraft
}: NightOutTravelViewProps) => {
    if (!needsTravel) return null;

    return (
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
                                onPress={() => onSelectAircraft(aircraft)}
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
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 1,
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
});

export default NightOutTravelView;
