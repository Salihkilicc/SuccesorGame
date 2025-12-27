import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { ACTIVITIES, ActivityType, COUNTRIES, TripVibe } from './useTravelSystem';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';

interface TravelDestinationModalProps {
    visible: boolean;
    onClose: () => void;
    onNext: () => void;
    selectedCountry: string;
    setSelectedCountry: (country: string) => void;
    selectedVibe: TripVibe;
    setSelectedVibe: (vibe: TripVibe) => void;
    selectedActivity: ActivityType;
    setSelectedActivity: (activity: ActivityType) => void;
}

const TravelDestinationModal = ({
    visible,
    onClose,
    onNext,
    selectedCountry,
    setSelectedCountry,
    selectedVibe,
    setSelectedVibe,
    selectedActivity,
    setSelectedActivity,
}: TravelDestinationModalProps) => {
    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Plan Your Trip ✈️"
            subtitle="Select your destination & vibe."
        >
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Country Selector */}
                <Text style={styles.label}>Destination</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {COUNTRIES.map((country) => (
                        <Pressable
                            key={country}
                            onPress={() => setSelectedCountry(country)}
                            style={[
                                styles.chip,
                                selectedCountry === country && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    selectedCountry === country && styles.chipTextSelected,
                                ]}
                            >
                                {country}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Vibe Selector */}
                <Text style={styles.label}>Vibe</Text>
                <View style={styles.vibeContainer}>
                    {(['Standard', 'Ultra-Rich'] as TripVibe[]).map((vibe) => (
                        <Pressable
                            key={vibe}
                            onPress={() => {
                                setSelectedVibe(vibe);
                                // Reset activity to first in new vibe list
                                setSelectedActivity(ACTIVITIES[vibe][0]);
                            }}
                            style={[
                                styles.vibeButton,
                                selectedVibe === vibe && styles.vibeButtonSelected,
                                vibe === 'Ultra-Rich' && styles.vibeButtonRich,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.vibeText,
                                    selectedVibe === vibe && styles.vibeTextSelected,
                                ]}
                            >
                                {vibe === 'Ultra-Rich' ? '💎 Ultra-Rich' : '🌴 Standard'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Activity Selector */}
                <Text style={styles.label}>Activity</Text>
                <View style={styles.activityGrid}>
                    {ACTIVITIES[selectedVibe].map((activity) => (
                        <Pressable
                            key={activity}
                            onPress={() => setSelectedActivity(activity)}
                            style={[
                                styles.activityCard,
                                selectedActivity === activity && styles.activityCardSelected,
                                selectedVibe === 'Ultra-Rich' && selectedActivity === activity && styles.activityCardRich,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.activityText,
                                    selectedActivity === activity && styles.activityTextSelected,
                                ]}
                            >
                                {activity}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <GameButton
                    title="Cancel"
                    onPress={onClose}
                    variant="ghost"
                    style={{ flex: 1, marginRight: 8 }}
                />
                <GameButton
                    title="Next Step →"
                    onPress={onNext}
                    variant="primary"
                    style={{ flex: 2 }}
                />
            </View>
        </GameModal>
    );
};

const styles = StyleSheet.create({
    content: {
        maxHeight: 400, // Limit height to ensure modal fits
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.subtitle,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    horizontalScroll: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
    chip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 999,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    chipTextSelected: {
        color: '#fff', // Always white on primary
        fontWeight: '600',
    },
    vibeContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    vibeButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.cardSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    vibeButtonRich: {
        // Optional special styling for unselected rich button?
    },
    vibeButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    vibeText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    vibeTextSelected: {
        color: '#fff',
    },
    activityGrid: {
        gap: theme.spacing.sm,
        marginBottom: 20,
    },
    activityCard: {
        width: '100%',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activityCardSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    activityCardRich: {
        backgroundColor: '#FFD700', // Gold-ish for ultra rich
        borderColor: '#FFD700',
    },
    activityText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    activityTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        marginTop: 10,
    },
});

export default TravelDestinationModal;
