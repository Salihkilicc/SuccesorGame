import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    SafeAreaView
} from 'react-native';
import { useGymSystem, SupplementType } from './useGymSystem';

interface Props {
    visible?: boolean;
    onClose?: () => void;
}

const GymLockerRoomView = () => {
    const {
        activeView,
        isVisible,
        goBackToHub,
        currentQuarter,
        supplementUsage,
        consumeSupplement,
        fatigue
    } = useGymSystem();

    const handleBack = () => {
        goBackToHub();
    };

    const handleConsume = (type: SupplementType) => {
        // Steroid Warning
        if (type === 'steroids') {
            Alert.alert(
                '⚠️ DANGEROUS SUBSTANCE',
                'Injecting steroids will grant huge gains (+7 Mastery) but implies SEVERE health risks (-45 Health).\n\nThis cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'INJECT',
                        style: 'destructive',
                        onPress: () => performConsumption(type)
                    }
                ]
            );
            return;
        }

        // Regular Supplements
        performConsumption(type);
    };

    const performConsumption = (type: SupplementType) => {
        const result = consumeSupplement(type);
        if (result.success) {
            // Optional: Add simple Toast if library available, else Alert is fine for now
            if (type !== 'steroids') {
                Alert.alert('Consumable Used', result.message);
            } else {
                Alert.alert('💉 Injected', 'You feel a surge of power... and pain.');
            }
        } else {
            Alert.alert('Cannot Consume', result.message);
        }
    };

    const ITEMS: { id: SupplementType; name: string; icon: string; desc: string; effect: string }[] = [
        { id: 'protein', name: 'Whey Protein', icon: '🥤', desc: 'Essential recovery.', effect: '+0.5% Gains' },
        { id: 'creatine', name: 'Creatine', icon: '🔋', desc: 'Energy boost.', effect: '+0.5% Gains' },
        { id: 'steroids', name: 'Steroids', icon: '💉', desc: 'High Risk / Reward', effect: 'Massive Gains' },
    ];

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.card}>

                    {/* Header (Back Navigation) */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.title}>LOCKER ROOM</Text>
                            <Text style={styles.subtitle}>Supplements & Gear</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {ITEMS.map((item) => {
                            const isUsed = supplementUsage[item.id] === currentQuarter;
                            const isSteroid = item.id === 'steroids';

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.itemCard,
                                        isUsed && styles.itemUsed,
                                        isSteroid && styles.itemSteroid
                                    ]}
                                    onPress={() => !isUsed && handleConsume(item.id)}
                                    activeOpacity={0.8}
                                    disabled={isUsed}
                                >
                                    <Text style={[styles.itemIcon, isUsed && styles.textUsed]}>{item.icon}</Text>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, isUsed && styles.textUsed, isSteroid && styles.textSteroid]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.itemEffect, isUsed && styles.textUsed]}>
                                            {item.effect}
                                        </Text>
                                        <Text style={[styles.itemDesc, isUsed && styles.textUsed]}>
                                            {isUsed ? 'Consumed ⏳' : item.desc}
                                        </Text>
                                    </View>

                                    {/* Status Badge */}
                                    {isUsed && (
                                        <View style={styles.usedBadge}>
                                            <Text style={styles.usedText}>USED</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    card: {
        width: '90%',
        maxHeight: '60%', // Smaller height as content is less
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
    title: { fontSize: 24, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginBottom: 24,
    },
    itemCard: {
        width: '48%',
        aspectRatio: 1.1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    itemSteroid: {
        borderColor: '#EF4444',
        borderWidth: 1,
        backgroundColor: '#FEF2F2'
    },
    itemUsed: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        opacity: 0.6,
    },
    itemIcon: { fontSize: 32 },
    itemInfo: { alignItems: 'center', gap: 2 },
    itemName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    itemEffect: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
    itemDesc: { fontSize: 10, color: '#6B7280', textAlign: 'center' },

    // Steroid specific text override
    textSteroid: { color: '#B91C1C' },
    textUsed: { color: '#9CA3AF' },

    usedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#D1D5DB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    usedText: { fontSize: 8, fontWeight: '900', color: '#FFFFFF' }
});

export default GymLockerRoomView;
