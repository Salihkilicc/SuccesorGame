import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';
import { Venue } from '../data/nightOutVenues';

type ConfirmationViewProps = {
    venue: Venue;
    travelCost: number;
    totalCost: number;
    onConfirm: () => void;
    onCancel: () => void;
};

const ConfirmationView = ({ venue, travelCost, totalCost, onConfirm, onCancel }: ConfirmationViewProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Confirm Your Night</Text>

            {/* Venue Summary */}
            <View style={[styles.venueCard, { borderColor: venue.themeColor }]}>
                <View style={styles.venueHeader}>
                    <Text style={styles.venueEmoji}>{venue.emoji}</Text>
                    <View style={styles.venueInfo}>
                        <Text style={[styles.venueName, { color: venue.themeColor }]}>
                            {venue.name}
                        </Text>
                        <Text style={styles.venueLocation}>
                            {venue.location}, {venue.region}
                        </Text>
                    </View>
                </View>

                {/* Cost Breakdown */}
                <View style={styles.breakdown}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Entry Fee</Text>
                        <Text style={styles.breakdownValue}>${venue.entryFee.toLocaleString()}</Text>
                    </View>
                    {travelCost > 0 && (
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Travel</Text>
                            <Text style={styles.breakdownValue}>${travelCost.toLocaleString()}</Text>
                        </View>
                    )}
                    <View style={[styles.breakdownRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Cost</Text>
                        <Text style={styles.totalValue}>${totalCost.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <Pressable
                    onPress={onConfirm}
                    style={({ pressed }) => [
                        styles.confirmButton,
                        { backgroundColor: venue.themeColor },
                        pressed && styles.buttonPressed,
                    ]}>
                    <Text style={styles.confirmButtonText}>Confirm Night Out</Text>
                </Pressable>

                <Pressable
                    onPress={onCancel}
                    style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && styles.buttonPressed,
                    ]}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default ConfirmationView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 0.5,
    },
    venueCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        marginBottom: 24,
    },
    venueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    venueEmoji: {
        fontSize: 48,
        marginRight: 16,
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    venueLocation: {
        fontSize: 14,
        color: '#888',
    },
    breakdown: {
        gap: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownLabel: {
        fontSize: 15,
        color: '#aaa',
    },
    breakdownValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.primary,
    },
    actions: {
        gap: 12,
    },
    confirmButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
});
