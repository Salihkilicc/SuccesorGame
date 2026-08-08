import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../../../core/theme';
import { RegionCode } from '../data/nightOutVenues';

type RegionSelectViewProps = {
    selectedRegion: RegionCode | null;
    onSelectRegion: (region: RegionCode) => void;
};

type RegionInfo = {
    code: RegionCode;
    name: string;
    emoji: string;
    venueCount: number;
    isLocal?: boolean;
};

const REGIONS: RegionInfo[] = [
    { code: 'USA', name: t('life.northAmerica'), emoji: '🗽', venueCount: 5, isLocal: true },
    { code: 'EUROPE', name: t('life.europe'), emoji: '🇪🇺', venueCount: 4 },
    { code: 'ASIA', name: t('life.asia'), emoji: '⛩️', venueCount: 3 },
    { code: 'AFRICA', name: t('life.africa'), emoji: '🦁', venueCount: 2 },
];

const RegionSelectView = ({ selectedRegion, onSelectRegion }: RegionSelectViewProps) => {
    useLocale();
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>{t('life.chooseYourDestination')}</Text>
            <Text style={styles.subheader}>{t('life.whereDoYouWantTo')}</Text>

            <View style={styles.grid}>
                {REGIONS.map((region) => {
                    const isSelected = selectedRegion === region.code;
                    return (
                        <Pressable
                            key={region.code}
                            onPress={() => onSelectRegion(region.code)}
                            style={({ pressed }) => [
                                styles.card,
                                isSelected && styles.cardSelected,
                                region.isLocal && styles.cardLocal,
                                pressed && styles.cardPressed,
                            ]}>
                            <Text style={styles.emoji}>{region.emoji}</Text>
                            <Text style={[styles.regionName, isSelected && styles.textSelected]}>
                                {region.name}
                            </Text>

                            {region.isLocal && (
                                <View style={styles.localBadge}>
                                    <Text style={styles.localBadgeText}>📍 LOCAL</Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </ScrollView>
    );
};

export default RegionSelectView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subheader: {
        fontSize: 14,
        color: '#7B68D7',
        textAlign: 'center',
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    card: {
        width: '45%',
        backgroundColor: '#0B0635',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        minHeight: 160, // Increased height for large cards
        justifyContent: 'center',
    },
    cardSelected: {
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0B0635',
    },
    cardLocal: {
        borderColor: 'rgba(255,255,255,0.06)', // Blue for USA Local
    },
    cardPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.8,
    },
    emoji: {
        fontSize: 48, // Larger emojis
        marginBottom: 12,
    },
    regionName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    textSelected: {
        color: '#7B68D7',
    },
    venueCount: {
        fontSize: 12,
        color: '#7B68D7',
        marginTop: 4,
    },
    localBadge: {
        backgroundColor: '#7B68D7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    localBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
