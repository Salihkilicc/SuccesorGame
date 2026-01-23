import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../../../core/theme';
import { TravelMethod } from '../useNightOutSystem';

type TravelMethodViewProps = {
    hasPrivateJet: boolean;
    onSelectMethod: (method: TravelMethod) => void;
    onBack: () => void;
    isHangarOpen: boolean;
    setIsHangarOpen: (isOpen: boolean) => void;
};

const TravelMethodView = ({
    hasPrivateJet,
    onSelectMethod,
    onBack,
    isHangarOpen,
    setIsHangarOpen
}: TravelMethodViewProps) => {

    // If Hangar is open, show list of user's jets
    if (isHangarOpen) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.primary }]}>PRIVATE HANGAR</Text>
                    <Text style={styles.subtitle}>Select your aircraft</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {hasPrivateJet ? (
                        <Pressable
                            onPress={() => onSelectMethod('own')}
                            style={({ pressed }) => [
                                styles.jetListItem,
                                pressed && styles.pressed,
                            ]}>
                            <View style={styles.jetListIcon}>
                                <Text style={{ fontSize: 32 }}>🛩️</Text>
                            </View>
                            <View style={styles.jetListInfo}>
                                <Text style={styles.jetListName}>My Private Jet</Text>
                                <Text style={styles.jetListDesc}>Ready for takeoff</Text>
                            </View>
                            <View style={styles.jetListCost}>
                                <Text style={styles.costText}>$5,000</Text>
                                <Text style={styles.fuelText}>FUEL</Text>
                            </View>
                        </Pressable>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🔒</Text>
                            <Text style={styles.emptyTitle}>Hangar Empty</Text>
                            <Text style={styles.emptyText}>Purchase a private jet in Shopping to access the hangar.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>SELECT TRAVEL</Text>
                <Text style={styles.subtitle}>Choose your flight</Text>
            </View>

            <View style={styles.grid}>
                {/* 1. Budget Charter */}
                <Pressable
                    onPress={() => onSelectMethod('budget')}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>✈️</Text>
                        <View style={[styles.badge, { backgroundColor: '#ff4444' }]}>
                            <Text style={styles.badgeText}>Rep -1 📉</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Economy{'\n'}Charter</Text>
                        <Text style={styles.cardPrice}>$20k</Text>
                    </View>
                </Pressable>

                {/* 2. Standard Charter */}
                <Pressable
                    onPress={() => onSelectMethod('standard')}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>🛫</Text>
                        <View style={[styles.badge, { backgroundColor: '#666' }]}>
                            <Text style={styles.badgeText}>Rep 0</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Business{'\n'}Jet</Text>
                        <Text style={styles.cardPrice}>$30k</Text>
                    </View>
                </Pressable>

                {/* 3. Royal Charter */}
                <Pressable
                    onPress={() => onSelectMethod('luxury')}
                    style={({ pressed }) => [styles.card, { borderColor: '#FFD700' }, pressed && styles.pressed]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>🥂</Text>
                        <View style={[styles.badge, { backgroundColor: '#FFD700' }]}>
                            <Text style={[styles.badgeText, { color: '#000' }]}>Rep +1 📈</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Royal{'\n'}Charter</Text>
                        <Text style={[styles.cardPrice, { color: '#FFD700' }]}>$50k</Text>
                    </View>
                </Pressable>

                {/* 4. MY HANGAR */}
                <Pressable
                    onPress={() => setIsHangarOpen(true)}
                    style={({ pressed }) => [styles.card, styles.hangarCard, pressed && styles.pressed]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>🛩️</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>MY{'\n'}HANGAR</Text>
                        <Text style={styles.hangarAction}>Use Own Jet →</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

export default TravelMethodView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
        minHeight: 44,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 8,
        zIndex: 1,
    },
    backButtonText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    // Grid Styles
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    card: {
        width: '48%',
        aspectRatio: 1.5,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'space-between',
    },
    hangarCard: {
        backgroundColor: '#1a1a20',
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardEmoji: {
        fontSize: 32,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
    },
    cardContent: {
        gap: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 20,
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    hangarAction: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    // List Item Styles
    jetListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    jetListIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#2a2a2a',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    jetListInfo: {
        flex: 1,
    },
    jetListName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    jetListDesc: {
        fontSize: 12,
        color: '#888',
    },
    jetListCost: {
        alignItems: 'flex-end',
    },
    costText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    fuelText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        opacity: 0.5,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
});
