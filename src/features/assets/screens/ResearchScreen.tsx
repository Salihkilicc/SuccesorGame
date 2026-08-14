import React, { useEffect, useRef, useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated, Dimensions, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import LaboratoryScreen from './LaboratoryScreen';
import ScreenHeader from '../../../components/common/ScreenHeader';
import TutorialTarget from '../../../components/tutorial/TutorialTarget';
import { useStoryStore } from '../../../core/store/useStoryStore';
import InfoDot from '../../../components/common/InfoDot';

// Types
type TabType = 'HUB' | 'LAB' | 'TREE';

// --- COMPONENTS ---

// 1. Research Hub (Main Menu)
const ResearchHub = ({ onNavigate, onOpenLab }: {
    onNavigate: (tab: TabType) => void;
    onOpenLab: () => void;
}) => {
    const navigation = useNavigation();
    return (
        <ScrollView contentContainerStyle={styles.hubContainer}>
            <Text style={styles.hubTitle}>{t('company.researchDevelopment')}</Text>
            <Text style={styles.hubSubtitle}>{t('company.innovateToDominateTheMarket')}</Text>

            <View style={styles.cardsContainer}>
                {/* Laboratory Card */}
                <TutorialTarget tutorialKey="rndLab">
                    <Pressable
                        style={({ pressed }) => [styles.hubCard, pressed && styles.cardPressed]}
                        onPress={onOpenLab}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(207,208,210,0.15)' }]}>
                            <Text style={styles.cardIcon}>🧪</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{t('company.rDLaboratory')}</Text>
                            <Text style={styles.cardDesc}>{t('company.hireScientistsAndGenerateResearch')}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                </TutorialTarget>

                {/* Tech Tree Card */}
                <Pressable
                    style={({ pressed }) => [styles.hubCard, pressed && styles.cardPressed]}
                    onPress={() => (navigation as any).navigate('TechTree')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(5,168,246,0.15)' }]}>
                        <Text style={styles.cardIcon}>🧬</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{t('company.innovationTechTree')}</Text>
                        <Text style={styles.cardDesc}>{t('company.discoverNewProductsAndUpgrade')}</Text>
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
        <Text style={styles.placeholderTitle}>{t('company.innovationTree')}</Text>
        <Text style={styles.placeholderText}>{t('company.comingSoon')}</Text>
        <Text style={styles.placeholderSub}>{t('company.unlockTheFutureOfTechnology')}</Text>
    </View>
);

/**
 * The laboratory, arriving from the right.
 *
 * It is a TAB SWAP rather than a pushed route - the lab is rendered inside
 * this screen - so it appeared instantly while every other forward move in
 * the app slides. That inconsistency reads as a glitch rather than as a
 * different kind of navigation, because the player has no way to know the
 * difference.
 *
 * The animation is the stack's own: `slide_from_right` in RootNavigator,
 * matched here in duration and easing so a tab swap and a push feel like the
 * same gesture. It runs on mount, which is exactly when the tab becomes
 * active, so there is no second piece of state saying whether to animate.
 */
const SlideInFromRight = ({ children }: { children: React.ReactNode }) => {
    const width = Dimensions.get('window').width;
    const offset = useRef(new Animated.Value(width)).current;

    useEffect(() => {
        Animated.timing(offset, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            // The transform is a layout-free property, so this runs off the
            // JS thread and survives a busy render.
            useNativeDriver: true,
        }).start();
    }, [offset]);

    return (
        <Animated.View style={[styles.slide, { transform: [{ translateX: offset }] }]}>
            {children}
        </Animated.View>
    );
};

// --- MAIN SCREEN ---
const ResearchScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('HUB');

    // ------------------------------------------------------------------
    //  OPENING THIS PAGE IS WHAT STARTS THE RESEARCH LESSON
    // ------------------------------------------------------------------
    //  Not a quarter, not the father, not a share number. Research is the
    //  most indirect thing in the game and a player can arrive at it in the
    //  first quarter or in year four, so the trigger is the only honest
    //  signal there is: they came looking.
    // ------------------------------------------------------------------
    useEffect(() => { useStoryStore.getState().raise('rndOpened'); }, []);

    const openLab = () => {
        useStoryStore.getState().raise('rndLabOpened');
        setActiveTab('LAB');
    };

    const handleBack = () => {
        if (activeTab === 'HUB') {
            navigation.goBack();
        } else {
            setActiveTab('HUB');
        }
    };

    return (
        <View style={styles.container}>
            {/* The lab draws its own header; the other tabs share this one. */}
            {activeTab !== 'LAB' && (
                <ScreenHeader
                    title={activeTab === 'HUB' ? t('company.researchDevelopment') : t('company.innovationTechTree')}
                    onBack={handleBack}
                    right={
                        <InfoDot
                            title={t('tactic.rdTitle')}
                            text={t('tactic.rdText')}
                            detail={t('tactic.rdDetail')}
                        />
                    }
                />
            )}

            {/* CONTENT AREA */}
            <View style={styles.content}>
                {activeTab === 'HUB' && <ResearchHub onNavigate={setActiveTab} onOpenLab={openLab} />}
                {activeTab === 'LAB' && (
                    <SlideInFromRight>
                        <LaboratoryScreen onBack={() => setActiveTab('HUB')} />
                    </SlideInFromRight>
                )}
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
    /** The sliding panel needs a ground of its own, or the hub shows through it. */
    slide: { flex: 1, backgroundColor: theme.colors.background },
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
        shadowColor: '#1C242C',
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
        color: theme.colors.textPrimary,
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
