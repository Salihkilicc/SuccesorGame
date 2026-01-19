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
import { useGymSystem, MEMBERSHIP_PRICING, MembershipTier } from './useGymSystem';

interface Props {
    visible?: boolean;
    onClose?: () => void;
}

const GymMembershipView = () => {
    const { data, actions, activeView, isVisible } = useGymSystem();
    const {
        membership,
        stats
    } = data;
    const { bodyType } = stats;

    const {
        openGym,
        goBackToHub,
        buyMembership
    } = actions;

    const prices = MEMBERSHIP_PRICING;

    const handleBack = () => {
        goBackToHub();
    };

    const handlePurchase = (tier: MembershipTier) => {
        const result = buyMembership(tier);
        if (result.success) {
            Alert.alert('Welcome to the Elite!', result.message);
        } else {
            Alert.alert('Membership Denied', result.message);
        }
    };

    const cards = [
        {
            id: 'STANDARD' as MembershipTier,
            title: 'STANDARD',
            price: `$${prices.STANDARD.annual.toLocaleString()}/yr`,
            color: '#9CA3AF',
            features: ['Access to Equipment', 'Basic Classes', 'Locker Room'],
            req: null
        },
        {
            id: 'TITANIUM' as MembershipTier,
            title: 'TITANIUM',
            price: `$${prices.TITANIUM.annual.toLocaleString()}/yr`,
            color: '#F59E0B',
            features: ['Grandmaster Trainers', '2x Workout Gains', 'Private Spa Access', 'Networking Events'],
            req: 'Requires Godlike Body'
        }
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
                            <Text style={styles.title}>MEMBERSHIP</Text>
                            <Text style={styles.subtitle}>Elevate your status</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        {cards.map((item) => {
                            const isOwned = membership === item.id;
                            const isLocked = item.req && bodyType !== 'Godlike' && !isOwned;

                            return (
                                <View key={item.id} style={[styles.membershipCard, { borderColor: item.color }]}>
                                    <View style={[styles.cardHeader, { backgroundColor: item.color }]}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        {isOwned && <Text style={styles.ownedBadge}>CURRENT</Text>}
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.price}>{item.price}</Text>

                                        <View style={styles.features}>
                                            {item.features.map((feat, i) => (
                                                <Text key={i} style={styles.featureItem}>• {feat}</Text>
                                            ))}
                                        </View>

                                        {isLocked ? (
                                            <View style={styles.lockedContainer}>
                                                <Text style={styles.lockedText}>🔒 {item.req}</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, isOwned && styles.disabledBtn]}
                                                onPress={() => !isOwned && handlePurchase(item.id)}
                                                disabled={isOwned}
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    {isOwned ? 'ACTIVE' : 'JOIN NOW'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

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
        maxHeight: '80%',
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
    list: { gap: 20 },
    membershipCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#F9FAFB',
    },
    cardHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    ownedBadge: {
        fontSize: 9,
        fontWeight: '700',
        color: '#111827',
        backgroundColor: '#FFF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    cardContent: { padding: 12, gap: 8 },
    price: { fontSize: 18, fontWeight: '800', color: '#111827' },
    features: { gap: 4 },
    featureItem: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    actionBtn: {
        backgroundColor: '#007AFF', // Electric Blue
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledBtn: { backgroundColor: '#D1D5DB' },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    lockedContainer: {
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    lockedText: { color: '#D97706', fontWeight: '700', fontSize: 12 },
});

export default GymMembershipView;
