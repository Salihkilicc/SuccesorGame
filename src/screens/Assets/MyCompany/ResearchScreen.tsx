import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import LaboratoryScreen from './LaboratoryScreen';

// Types
type TabType = 'HUB' | 'LAB' | 'TREE';

// --- COMPONENTS ---

// 1. Research Hub (Main Menu)
const ResearchHub = ({ onNavigate }: { onNavigate: (tab: TabType) => void }) => {
    const navigation = useNavigation();
    return (
        <ScrollView contentContainerStyle={styles.hubContainer}>
            <Text style={styles.hubTitle}>Research & Development</Text>
            <Text style={styles.hubSubtitle}>Innovate to dominate the market.</Text>

            <View style={styles.cardsContainer}>
                {/* Laboratory Card */}
                <Pressable
                    style={({ pressed }) => [styles.hubCard, pressed && styles.cardPressed]}
                    onPress={() => onNavigate('LAB')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                        <Text style={styles.cardIcon}>🧪</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>R&D Laboratory</Text>
                        <Text style={styles.cardDesc}>Hire scientists and generate Research Points (RP).</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                {/* Tech Tree Card */}
                <Pressable
                    style={({ pressed }) => [styles.hubCard, pressed && styles.cardPressed]}
                    onPress={() => (navigation as any).navigate('TechTree')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 89, 182, 0.15)' }]}>
                        <Text style={styles.cardIcon}>🧬</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Innovation & Tech Tree</Text>
                        <Text style={styles.cardDesc}>Discover new products and upgrade existing tech.</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

// 2. Tech Tree Placeholder
const TechTreeView = () => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>🌳</Text>
        <Text style={styles.placeholderTitle}>Innovation Tree</Text>
        <Text style={styles.placeholderText}>Coming Soon</Text>
        <Text style={styles.placeholderSub}>Unlock the future of technology.</Text>
    </View>
);

// --- MAIN SCREEN ---
const ResearchScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('HUB');

    const handleBack = () => {
        if (activeTab === 'HUB') {
            navigation.goBack();
        } else {
            setActiveTab('HUB');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER - Only show for HUB and TREE */}
            {activeTab !== 'LAB' && (
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backBtn}>
                        <Text style={styles.backText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>
                        {activeTab === 'HUB' ? 'Research Center' : 'Tech Tree'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            )}

            {/* CONTENT AREA */}
            <View style={styles.content}>
                {activeTab === 'HUB' && <ResearchHub onNavigate={setActiveTab} />}
                {activeTab === 'LAB' && <LaboratoryScreen />}
                {activeTab === 'TREE' && <TechTreeView />}
            </View>
        </View>
    );
};

export default ResearchScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backText: {
        color: theme.colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    // HUB STYLES
    hubContainer: {
        padding: 24,
    },
    hubTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    hubSubtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 32,
    },
    cardsContainer: {
        gap: 16,
    },
    hubCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardIcon: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    chevron: {
        fontSize: 24,
        color: theme.colors.textMuted,
        fontWeight: '600',
        marginLeft: 12,
    },
    // PLACEHOLDER STYLES
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        opacity: 0.7,
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 24,
        opacity: 0.8,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.accent,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    placeholderSub: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
