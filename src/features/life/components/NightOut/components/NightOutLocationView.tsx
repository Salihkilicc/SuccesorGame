import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';
import { NightOutClub } from '../useNightOutSystem';

type NightOutLocationViewProps = {
    clubs: NightOutClub[];
    selectedClub: NightOutClub;
    onSelectClub: (club: NightOutClub) => void;
};

const NightOutLocationView = ({ clubs, selectedClub, onSelectClub }: NightOutLocationViewProps) => {
    return (
        <>
            <Text style={styles.sectionHeader}>DESTINATION</Text>
            <View style={styles.optionsGrid}>
                {clubs.map(club => {
                    const isSelected = selectedClub.id === club.id;
                    return (
                        <Pressable
                            key={club.id}
                            onPress={() => onSelectClub(club)}
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
        </>
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
});

export default NightOutLocationView;
