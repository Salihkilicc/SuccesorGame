import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useGymSystem, SupplementType } from './useGymSystem';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

const SUPPLEMENTS: { type: SupplementType; icon: string; label: string; desc: string; price: number }[] = [
    { type: 'protein', icon: '🥤', label: 'Protein Shake', desc: 'Track usage', price: 50 },
    { type: 'creatine', icon: '💊', label: 'Creatine', desc: 'Track usage', price: 100 },
    { type: 'steroids', icon: '💉', label: 'Steroids', desc: '+7 Mastery, -45 Health', price: 500 },
];

/**
 * GYM LOCKER ROOM VIEW
 * 
 * Displays player stats and consumable supplements.
 * Supplements can only be used once per quarter.
 */
const GymLockerRoomView = () => {
    // --- Hook Destructuring ---
    const { data, actions } = useGymSystem();
    const { inventory, currentQuarter } = data;
    const { goBackToHub, consumeSupplement } = actions;

    const { attributes, core } = usePlayerStore();
    const { strength, charm } = attributes;
    const { health } = core;

    // --- Handler ---
    const handleConsume = (type: SupplementType) => {
        // Special warning for Steroids
        if (type === 'steroids') {
            Alert.alert(
                '⚠️ WARNING: STEROIDS',
                'Massive gains (+7 Mastery, +5 Strength) but severe health damage (-45 HP). Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Use Anyway',
                        style: 'destructive',
                        onPress: () => executeConsume(type)
                    }
                ]
            );
            return;
        }

        executeConsume(type);
    };

    const executeConsume = (type: SupplementType) => {
        const result = consumeSupplement(type);
        if (result.success) {
            Alert.alert('Consumed! 💪', result.message);
        } else {
            Alert.alert('Cannot Use', result.message);
        }
    };

    const isUsed = (type: SupplementType) => {
        return inventory[type] === currentQuarter;
    };

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goBackToHub} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.title}>LOCKER ROOM</Text>
                            <Text style={styles.subtitle}>Supplements & Gear</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Stats Summary */}
                    <View style={styles.statsCard}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>STRENGTH</Text>
                            <Text style={styles.statValue}>{strength.toFixed(0)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>HEALTH</Text>
                            <Text style={[styles.statValue, { color: health < 50 ? '#EF4444' : '#10B981' }]}>
                                {health.toFixed(0)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>CHARM</Text>
                            <Text style={styles.statValue}>{charm.toFixed(0)}</Text>
                        </View>
                    </View>

                    {/* Supplements Grid (2x2) */}
                    <View style={styles.grid}>
                        {SUPPLEMENTS.map((supplement) => {
                            const used = isUsed(supplement.type);
                            return (
                                <TouchableOpacity
                                    key={supplement.type}
                                    style={[
                                        styles.supplementCard,
                                        used && styles.supplementCardUsed,
                                        supplement.type === 'steroids' && styles.supplementCardDanger
                                    ]}
                                    onPress={() => handleConsume(supplement.type)}
                                    activeOpacity={0.7}
                                    disabled={used}
                                >
                                    <Text style={[styles.supplementIcon, used && styles.usedIcon]}>
                                        {supplement.icon}
                                    </Text>
                                    <Text style={[styles.supplementLabel, used && styles.usedText]}>
                                        {supplement.label}
                                    </Text>
                                    <Text style={[styles.supplementDesc, used && styles.usedText]}>
                                        {supplement.desc}
                                    </Text>
                                    {used && (
                                        <View style={styles.usedBadge}>
                                            <Text style={styles.usedBadgeText}>CONSUMED ⏳</Text>
                                        </View>
                                    )}
                                    {!used && (
                                        <Text style={styles.priceText}>${supplement.price}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Info Footer */}
                    <View style={styles.infoFooter}>
                        <Text style={styles.infoText}>
                            ⚠️ Each supplement can only be used once per quarter
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: { fontSize: 14, color: '#374151', fontWeight: '700' },
    headerTitleContainer: { alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 4,
    },
    statsCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
    statValue: { fontSize: 14, fontWeight: '900', color: '#111827' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // gap: 12, // Removed for safer wrap
        marginBottom: 20,
    },
    supplementCard: {
        width: '47%',
        marginBottom: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2563EB',
        minHeight: 140,
        justifyContent: 'center',
    },
    supplementCardUsed: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
        opacity: 0.6,
    },
    supplementCardDanger: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
    },
    supplementIcon: { fontSize: 36, marginBottom: 8 },
    usedIcon: { opacity: 0.4 },
    supplementLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    supplementDesc: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    usedText: { color: '#9CA3AF' },
    usedBadge: {
        backgroundColor: '#FCD34D',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
    },
    usedBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#92400E',
    },
    priceText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB',
        marginTop: 4,
    },
    infoFooter: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    infoText: {
        fontSize: 12,
        color: '#991B1B',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default GymLockerRoomView;
