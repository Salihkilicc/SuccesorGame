import React, { useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import TutorialTarget from '../../../components/tutorial/TutorialTarget';
import { useStoryStore } from '../../../core/store/useStoryStore';
import InfoDot from '../../../components/common/InfoDot';

// --- COMPONENTS ---

// 1. Research Hub (Main Menu)
const ResearchHub = ({ onOpenLab }: {
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
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)', borderColor: 'rgba(167, 139, 250, 0.3)', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="flask-outline" size={24} color="#A78BFA" />
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
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', borderWidth: 1 }]}>
                        <MaterialCommunityIcons name="source-branch" size={24} color="#38BDF8" />
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

// --- MAIN SCREEN ---
const ResearchScreen = () => {
    useLocale();
    const navigation = useNavigation();

    // ------------------------------------------------------------------
    //  OPENING THIS PAGE IS WHAT STARTS THE RESEARCH LESSON
    // ------------------------------------------------------------------
    useEffect(() => { useStoryStore.getState().raise('rndOpened'); }, []);

    const openLab = () => {
        useStoryStore.getState().raise('rndLabOpened');
        (navigation as any).navigate('Laboratory');
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('company.researchDevelopment')}
                onBack={() => navigation.goBack()}
                right={
                    <InfoDot
                        title={t('tactic.rdTitle')}
                        text={t('tactic.rdText')}
                        detail={t('tactic.rdDetail')}
                    />
                }
            />

            {/* CONTENT AREA */}
            <View style={styles.content}>
                <ResearchHub onOpenLab={openLab} />
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
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardIcon: {
        fontSize: 24,
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
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    chevron: {
        fontSize: 24,
        fontWeight: '300',
        color: theme.colors.textMuted,
        marginLeft: 8,
    },
});
