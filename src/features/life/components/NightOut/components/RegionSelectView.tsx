import React from 'react';
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
    { code: 'USA', name: 'North America', emoji: '🗽', venueCount: 5, isLocal: true },
    { code: 'EUROPE', name: 'Europe', emoji: '🇪🇺', venueCount: 4 },
    { code: 'ASIA', name: 'Asia', emoji: '⛩️', venueCount: 3 },
    { code: 'AFRICA', name: 'Africa', emoji: '🦁', venueCount: 2 },
];

const RegionSelectView = ({ selectedRegion, onSelectRegion }: RegionSelectViewProps) => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>Choose Your Destination</Text>
            <Text style={styles.subheader}>Where do you want to go tonight?</Text>

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
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subheader: {
        fontSize: 14,
        color: '#888',
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
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
        minHeight: 160, // Increased height for large cards
        justifyContent: 'center',
    },
    cardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#252525',
    },
    cardLocal: {
        borderColor: '#3498db', // Blue for USA Local
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
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    textSelected: {
        color: theme.colors.primary,
    },
    venueCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    localBadge: {
        backgroundColor: '#3498db',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    localBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
});
