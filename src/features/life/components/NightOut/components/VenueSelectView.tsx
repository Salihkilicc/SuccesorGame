import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../../../core/theme';
import { RegionCode, Venue } from '../data/nightOutVenues';

type VenueSelectViewProps = {
    region: RegionCode;
    venues: Venue[];
    selectedVenue: Venue | null;
    onSelectVenue: (venue: Venue) => void;
    onBack: () => void;
};

const VenueSelectView = ({ region, venues, selectedVenue, onSelectVenue, onBack }: VenueSelectViewProps) => {
    const renderStars = (tier: number) => {
        return '⭐'.repeat(tier);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Venue</Text>
                <Text style={styles.subtitle}>{region}</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.venueList}>
                    {venues.map((venue) => {
                        const isSelected = selectedVenue?.id === venue.id;
                        return (
                            <Pressable
                                key={venue.id}
                                onPress={() => onSelectVenue(venue)}
                                style={({ pressed }) => [
                                    styles.venueCard,
                                    isSelected && { borderColor: venue.themeColor },
                                    pressed && styles.venueCardPressed,
                                ]}>
                                <View style={styles.venueHeader}>
                                    <Text style={styles.venueEmoji}>{venue.emoji}</Text>
                                    <View style={styles.venueInfo}>
                                        <Text style={[styles.venueName, isSelected && { color: venue.themeColor }]}>
                                            {venue.name}
                                        </Text>
                                        <Text style={styles.venueLocation}>{venue.location}</Text>
                                    </View>
                                </View>

                                <View style={styles.venueDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.tierStars}>{renderStars(venue.tier)}</Text>
                                        <Text style={styles.entryFee}>${venue.entryFee.toLocaleString()}</Text>
                                    </View>
                                </View>

                                {isSelected && (
                                    <View style={[styles.selectedBadge, { backgroundColor: venue.themeColor }]}>
                                        <Text style={styles.selectedBadgeText}>✓ SELECTED</Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

export default VenueSelectView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    backButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scrollView: {
        flex: 1,
    },
    venueList: {
        gap: 12,
    },
    venueCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#333',
    },
    venueCardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    },
    venueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    venueEmoji: {
        fontSize: 36,
        marginRight: 12,
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    venueLocation: {
        fontSize: 13,
        color: '#888',
    },
    venueDetails: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tierStars: {
        fontSize: 14,
    },
    entryFee: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    selectedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    selectedBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
});
