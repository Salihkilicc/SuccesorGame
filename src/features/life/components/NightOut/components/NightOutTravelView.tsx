import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';
import { InventoryItem } from '../../../../../core/store/useUserStore';

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
    useLocale();
    if (!needsTravel) return null;

    return (
        <View style={styles.travelSection}>
            <Text style={styles.sectionHeader}>{t('life.travelMethodInternational')}</Text>
            {aircrafts.length === 0 ? (
                <View style={styles.charterBox}>
                    <Text style={styles.charterTitle}>{t('life.charterFlightJet')}</Text>
                    <Text style={styles.charterSub}>{t('life.youOwnNoAircrafts')}</Text>
                    <Text style={styles.charterCost}>{t('life.cost50000')}</Text>
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
                                <Text style={styles.optionSubText}>{t('life.ownedAircraft')}</Text>
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
        color: '#C8C0EF',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 1,
    },
    travelSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 10,
    },
    charterBox: {
        backgroundColor: '#281F50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    charterTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    charterSub: {
        color: '#C8C0EF',
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
        backgroundColor: '#281F50',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    optionButtonSelected: {
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#422B71', // subtle gold tint
    },
    optionText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    optionTextSelected: {
        color: '#C8C0EF',
    },
    optionSubText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 2,
    },
});

export default NightOutTravelView;
