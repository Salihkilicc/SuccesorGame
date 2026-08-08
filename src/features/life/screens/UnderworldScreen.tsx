import React, { useState, useCallback } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView, Alert, Platform, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';

// Components & Systems
import { theme } from '../../../core/theme';
import { useUserStore, useStatsStore, usePlayerStore } from '../../../core/store';
import type { RootStackParamList } from '../../../navigation';

// Type Definitions
type UnderworldNavigationProp = NativeStackNavigationProp<RootStackParamList>;

import { useEncounterSystem } from '../../love/components/useEncounterSystem';
import { EncounterModal } from '../../love/components/EncounterModal';
import BreakupModal from '../../love/components/BreakupModal';
import { useHookupSystem } from '../components/useHookupSystem';
import { HookupModal } from '../components/HookupModal';
import GodModeModal from '../../../components/GodModeModal';

const GRADIENTS = {
    purplePink: ['#05A8F6', '#05A8F6'],
    greenTeal: ['#CFD0D2', '#CFD0D2'],
    redCasino: ['#FF8A8A', '#FF8A8A'],
    darkGrey: ['#1C242C', '#535B5F'],
    hookupFire: ['#05A8F6', '#05A8F6'],
    networkBlue: ['#05A8F6', '#CFD0D2'],
    bluePurple: ['#CFD0D2', '#05A8F6'],
};

const SECTION_ESSENTIALS = [
    { key: 'contacts', label: t('life.contacts'), icon: 'account-multiple', gradient: GRADIENTS.purplePink },
    { key: 'weather', label: t('life.weather'), icon: 'weather-partly-cloudy', gradient: GRADIENTS.bluePurple },
    { key: 'settings', label: t('life.settings'), icon: 'cog', gradient: GRADIENTS.darkGrey },
    { key: 'themes', label: t('life.themes'), icon: 'palette', gradient: GRADIENTS.networkBlue },
    { key: 'godMode', label: t('life.godMode'), icon: 'flash', gradient: GRADIENTS.hookupFire },
    { key: 'stockMarket', label: t('life.stockMarket'), icon: 'chart-line', gradient: GRADIENTS.greenTeal },
];

const SECTION_UNDERWORLD = [
    { key: 'casino', label: t('life.casino'), icon: 'slot-machine', gradient: GRADIENTS.redCasino },
    { key: 'blackMarket', label: t('life.blackMarket'), icon: 'incognito', gradient: GRADIENTS.darkGrey },
    { key: 'hookup', label: t('life.hookup'), icon: 'fire', gradient: GRADIENTS.hookupFire },
    { key: 'network', label: t('life.network'), icon: 'lan', gradient: GRADIENTS.networkBlue },
];

const UnderworldScreen = () => {
    useLocale();
    const navigation = useNavigation<UnderworldNavigationProp>();

    // Underworld specific systems
    const { isModalVisible, currentCandidate, matchStatus, startHookup, swipeRight, swipeLeft, nextCandidate, closeHookupModal } = useHookupSystem();
    const { isVisible: isEncounterVisible, currentScenario: encounterScenario, candidate: encounterCandidate, handleDate, closeEncounter } = useEncounterSystem();
    const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);
    const [isGodModeVisible, setIsGodModeVisible] = useState(false);

    const handleEncounterDate = useCallback(() => {
        const result = handleDate();
        if (result.wasCaught) {
            setCheatingConsequence({ settlement: result.settlement, partnerName: 'Your Partner' });
        }
    }, [handleDate]);

    const handleAction = (key: string) => {
        switch (key) {
            case 'contacts': navigation.navigate('Love'); break;
            case 'weather': navigation.navigate('Weather'); break;
            case 'settings': navigation.navigate('Settings' as never); break;
            case 'themes': Alert.alert('Themes', 'Coming Soon'); break;
            case 'godMode': setIsGodModeVisible(true); break;
            case 'casino': navigation.navigate('Casino'); break;
            case 'blackMarket': navigation.navigate('BlackMarket'); break;
            case 'hookup': startHookup(); break;
            case 'network': Alert.alert('Network', 'Networking events are coming soon!'); break;
            case 'stockMarket': navigation.navigate('Assets', { screen: 'Market' }); break;
            default: break;
        }
    };

    const renderAppIcon = (item: { key: string; label: string; icon: string; gradient: string[] }) => (
        <Pressable key={item.key} style={({ pressed }) => [styles.appCard, pressed && styles.appCardPressed]} onPress={() => handleAction(item.key)}>
            <LinearGradient
                colors={item.gradient}
                style={styles.appCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <MaterialCommunityIcons name={item.icon} size={32} color="#FFFFFF" style={styles.appIconVector} />
            </LinearGradient>
            <Text style={styles.appIconLabel} numberOfLines={1}>{item.label}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* ULTRA PREMIUM BACKGROUND - Deep Dark Luxury Palette */}
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop' }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(28,36,44,0.3)', 'rgba(28,36,44,0.7)', 'rgba(28,36,44,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>{t('life.city')}</Text>
                    <View style={styles.headerAccent} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('life.essentials')}</Text>
                        <View style={styles.grid}>
                            {SECTION_ESSENTIALS.map(renderAppIcon)}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('life.underworld')}</Text>
                        <View style={styles.grid}>
                            {SECTION_UNDERWORLD.map(renderAppIcon)}
                        </View>
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>            </SafeAreaView>

            {/* --- MODALS --- */}
            <HookupModal
                visible={isModalVisible}
                candidate={currentCandidate}
                matchStatus={matchStatus}
                onSwipeRight={swipeRight}
                onSwipeLeft={swipeLeft}
                nextCandidate={nextCandidate}
                onClose={closeHookupModal}
            />

            <EncounterModal
                visible={isEncounterVisible}
                candidate={encounterCandidate}
                scenario={encounterScenario}
                context={encounterScenario?.id.split('_')[0] || 'Unknown'}
                onDate={handleEncounterDate}
                onHookup={() => {
                    Alert.alert("Fling", "You had a great night! (Stress -10)");
                    closeEncounter();
                }}
                onIgnore={closeEncounter}
            />

            {cheatingConsequence && (
                <BreakupModal
                    visible={!!cheatingConsequence}
                    onClose={() => setCheatingConsequence(null)}
                    partnerName={cheatingConsequence.partnerName}
                    settlementCost={cheatingConsequence.settlement}
                />
            )}

            <GodModeModal
                visible={isGodModeVisible}
                onClose={() => setIsGodModeVisible(false)}
            />
        </View>
    );
};

export default UnderworldScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 80,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 8,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 44,
        height: 2,
        backgroundColor: '#434B50',
        marginTop: 14,
        borderRadius: 2,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 140, // Increased for bottom layout consistency
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 20,
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 4,
    },
    appCard: {
        width: '21%',
        aspectRatio: 0.75, // Matching Apple ratio
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    appCardPressed: {
        transform: [{ scale: 0.92 }],
        opacity: 0.85,
    },
    appCardInner: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    appIconVector: {
        textShadowColor: 'rgba(28,36,44,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    appIconLabel: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
});
