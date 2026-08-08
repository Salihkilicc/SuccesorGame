import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// 5 tane ../ koyuyoruz
import { theme } from '../../../../../core/theme';
import { Venue } from '../data/nightOutVenues';

type NightOutLocationViewProps = {
    clubs: Venue[];
    selectedClub: Venue;
    onSelectClub: (club: Venue) => void;
};

const NightOutLocationView = ({ clubs, selectedClub, onSelectClub }: NightOutLocationViewProps) => {
    useLocale();
    return (
        <>
            <Text style={styles.sectionHeader}>{t('life.destination')}</Text>
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
                                {club.location}, {club.region}
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
        color: '#7B68D7',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 1,
    },
    optionsGrid: {
        gap: 8,
    },
    optionButton: {
        backgroundColor: '#07062E',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    optionButtonSelected: {
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#020626', // subtle gold tint
    },
    optionText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    optionTextSelected: {
        color: '#7B68D7',
    },
    optionSubText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 2,
    },
    feeText: {
        color: '#7B68D7',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
});

export default NightOutLocationView;
