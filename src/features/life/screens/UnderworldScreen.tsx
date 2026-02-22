import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

// Components & Systems
import { theme } from '../../../core/theme';
import { useUserStore, useStatsStore, usePlayerStore } from '../../../core/store';
import type { RootStackParamList, RootTabParamList, SwipeTabParamList } from '../../../navigation';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

import { BlackMarketMasterModal } from '../components/BlackMarket/BlackMarketMasterModal';
import { useEncounterSystem } from '../../love/components/useEncounterSystem';
import { EncounterModal } from '../../love/components/EncounterModal';
import BreakupModal from '../../love/components/BreakupModal';
import { useHookupSystem } from '../components/useHookupSystem';
import { HookupModal } from '../components/HookupModal';

type UnderworldNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'Home'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<RootTabParamList, 'Life'>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

const GRADIENTS = {
    purplePink: ['#8E2DE2', '#4A00E0'],
    greenTeal: ['#11998e', '#38ef7d'],
    redCasino: ['#e52d27', '#b31217'],
    darkGrey: ['#232526', '#414345'],
    hookupFire: ['#DA22FF', '#9733EE'],
    networkBlue: ['#1A2980', '#26D0CE'],
    bluePurple: ['#00c6ff', '#0072ff'],
};

const SECTION_ESSENTIALS = [
    { key: 'contacts', label: 'Contacts', icon: '👥', gradient: GRADIENTS.purplePink },
    { key: 'weather', label: 'Weather', icon: '🌤️', gradient: GRADIENTS.bluePurple },
];

const SECTION_UNDERWORLD = [
    { key: 'casino', label: 'Casino', icon: '🎰', gradient: GRADIENTS.redCasino },
    { key: 'blackMarket', label: 'Black Market', icon: '🕶️', gradient: GRADIENTS.darkGrey },
    { key: 'hookup', label: 'Hookup', icon: '🔥', gradient: GRADIENTS.hookupFire },
    { key: 'network', label: 'Network', icon: '🌐', gradient: GRADIENTS.networkBlue },
    { key: 'stockMarket', label: 'Stock Market', icon: '📈', gradient: GRADIENTS.greenTeal },
];

const UnderworldScreen = () => {
    const navigation = useNavigation<UnderworldNavigationProp>();

    // Underworld specific systems
    const { isModalVisible, currentCandidate, matchStatus, startHookup, swipeRight, swipeLeft, nextCandidate, closeHookupModal } = useHookupSystem();
    const { isVisible: isEncounterVisible, currentScenario: encounterScenario, candidate: encounterCandidate, handleDate, closeEncounter } = useEncounterSystem();
    const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

    const [isBlackMarketVisible, setBlackMarketVisible] = useState(false);

    const handleEncounterDate = useCallback(() => {
        const result = handleDate();
        if (result.wasCaught) {
            setCheatingConsequence({ settlement: result.settlement, partnerName: 'Your Partner' });
        }
    }, [handleDate]);

    const handleAction = (key: string) => {
        switch (key) {
            case 'contacts': navigation.navigate('Love' as never); break;
            case 'weather': Alert.alert('Weather', 'Weather app is coming soon!'); break;
            case 'casino': navigation.navigate('Casino'); break;
            case 'blackMarket': setBlackMarketVisible(true); break;
            case 'hookup': startHookup(); break;
            case 'network': Alert.alert('Network', 'Networking events are coming soon!'); break;
            case 'stockMarket': navigation.navigate('Assets', { screen: 'Market' } as any); break;
            default: break;
        }
    };

    const renderAppIcon = (item: { key: string; label: string; icon: string; gradient: string[] }) => (
        <Pressable key={item.key} style={styles.appIconContainer} onPress={() => handleAction(item.key)}>
            <LinearGradient
                colors={item.gradient}
                style={styles.appIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.appIconEmoji}>{item.icon}</Text>
            </LinearGradient>
            <Text style={styles.appIconLabel} numberOfLines={1}>{item.label}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1c1c1e', '#2c3e50', '#202020']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.headerTitle}>CITY</Text>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Essentials</Text>
                        <View style={styles.grid}>
                            {SECTION_ESSENTIALS.map(renderAppIcon)}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Underworld</Text>
                        <View style={styles.grid}>
                            {SECTION_UNDERWORLD.map(renderAppIcon)}
                        </View>
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>

                <CrystalNavBar activeTab="Home" variant="light" />
            </SafeAreaView>

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

            <BlackMarketMasterModal
                visible={isBlackMarketVisible}
                onClose={() => setBlackMarketVisible(false)}
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
        </View>
    );
};

export default UnderworldScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 74,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1.5,
        paddingLeft: 34,
        paddingTop: Platform.OS === 'ios' ? 70 : 90,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 36,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#F0F0F0',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: '2.5%',
        rowGap: 24,
    },
    appIconContainer: {
        width: '23%',
        alignItems: 'center',
    },
    appIcon: {
        width: 68,
        height: 68,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    appIconEmoji: {
        fontSize: 32,
    },
    appIconLabel: {
        color: '#EEEEEE',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
