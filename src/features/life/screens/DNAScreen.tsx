import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { theme } from '../../../core/theme';
import { useRelationshipBuffs } from '../../love/hooks/useRelationshipBuffs';
import { useGymSystem } from '../components/Gym/useGymSystem';
import { useBlackMarketSystem } from '../components/BlackMarket/useBlackMarketSystem';
import { useLuxurySystem } from '../../shopping/hooks/useLuxurySystem';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';

// Helper for currency formatting
const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
};

const ProgressBar = ({ label, value, max = 100, color = '#C8C0EF', icon, buff }: {
    label: string, value: number, max?: number, color?: string, icon?: string, buff?: string
}) => {
    const safeValue = value || 0;
    const percentage = Math.min(100, Math.max(0, (safeValue / max) * 100));

    return (
        <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
                {icon && <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text>}
                <Text style={styles.statLabel}>{label}</Text>
                {buff && (
                    <View style={styles.buffBadge}>
                        <Text style={styles.buffText}>{buff} 💖</Text>
                    </View>
                )}
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={styles.statValue}>{safeValue}/{max}</Text>
        </View>
    );
};

const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const LuxuryBar = () => {
    const { netWorth, maxWealth, percentage, buffAmount } = useLuxurySystem();
    const isBuffActive = buffAmount > 0;
    const buffColor = isBuffActive ? '#C734CA' : 'rgba(255,255,255,0.08)';
    const buffTextColor = isBuffActive ? '#020626' : '#7B46B7';

    return (
        <View style={[styles.card, styles.luxuryCard]}>
            <SectionHeader title={t('life.luxuryLifestyle')} icon="💎" />
            <View style={styles.luxuryContent}>
                <View style={styles.luxuryProgressRow}>
                    <Text style={styles.luxuryValue}>{formatCurrency(netWorth)}</Text>
                    <View style={styles.luxuryProgressBarBg}>
                        <View style={[styles.luxuryProgressBarFill, { width: `${percentage}%` as any }]} />
                    </View>
                    <Text style={styles.luxuryTarget}>{formatCurrency(maxWealth)}</Text>
                </View>
                <Text style={styles.luxuryPercentage}>{percentage.toFixed(1)}% to Empire Status</Text>
                <View style={styles.buffRow}>
                    <View style={[styles.luxuryBuffBadge, { backgroundColor: buffColor }]}>
                        <Text style={[styles.luxuryBuffText, { color: buffTextColor }]}>High Society: +{buffAmount}</Text>
                    </View>
                    <View style={[styles.luxuryBuffBadge, { backgroundColor: buffColor }]}>
                        <Text style={[styles.luxuryBuffText, { color: buffTextColor }]}>Business: +{buffAmount}</Text>
                    </View>
                    <View style={[styles.luxuryBuffBadge, { backgroundColor: buffColor }]}>
                        <Text style={[styles.luxuryBuffText, { color: buffTextColor }]}>Charisma: +{buffAmount}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const DNAScreen = () => {
    useLocale();
    const navigation = useNavigation();

    const {
        attributes,
        personality,
        reputation,
        security,
        skills,
        hidden,
        relationshipBuffs
    } = usePlayerStore();

    const { data: { suspicion } } = useBlackMarketSystem();
    useRelationshipBuffs();

    const attrBuffs = relationshipBuffs?.attributes || {};
    const repBuffs = relationshipBuffs?.reputation || {};
    // @ts-ignore
    const secBuffs = relationshipBuffs?.security || {};

    const getEffective = (base: number | undefined, buff: number | undefined) => (base || 0) + (buff || 0);
    const getBuffString = (val: number | undefined) => (val || 0) > 0 ? `+${val}` : undefined;

    const { data: gymData } = useGymSystem();
    const { stats, martialArts } = gymData;
    const selectedArt = martialArts.style;
    const beltTitle = martialArts.title;
    const beltRank = martialArts.rank;
    const { bodyType, fatigue } = stats;

    const securityLevel = beltRank * 10;

    const martialArtsDisplay = selectedArt
        ? `${selectedArt.charAt(0).toUpperCase() + selectedArt.slice(1)} - ${beltTitle}`
        : 'None';

    const handleBack = () => navigation.goBack();

    const getBeltTextColor = (belt: string) => {
        const lowerBelt = belt?.toLowerCase() || 'white';
        if (['white', 'yellow'].includes(lowerBelt)) return '#020626';
        return '#FFFFFF';
    };

    const getBeltBgColor = (belt: string) => {
        const lowerBelt = belt?.toLowerCase() || 'white';
        const colors: Record<string, string> = {
            white: '#FFFFFF',
            yellow: '#C734CA',
            orange: '#C734CA',
            green: '#C8C0EF',
            blue: '#C8C0EF',
            purple: '#6004BD',
            brown: '#7B46B7',
            black: '#020626'
        };
        return colors[lowerBelt] || '#422B71';
    };

    const getHeatColor = (val: number) => {
        if (val > 80) return '#C734CA';
        if (val < 30) return '#6004BD';
        return '#C734CA';
    };

    return (
        <AppLaunchLoader
            appName="DNA"
            appIcon={<MaterialCommunityIcons name="dna" size={64} color="#FFFFFF" />}
            backgroundColor="#020626"
        >
            <View style={styles.container}>
                {/* Premium background gradient */}
                <LinearGradient
                    colors={['#020626', '#020626', '#020626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color="#C734CA" />
                        </Pressable>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headerTitle}>{t('life.dnaStats')}</Text>
                            <View style={styles.headerAccent} />
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                        {/* 💎 LUXURY */}
                        <LuxuryBar />

                        {/* 🛡️ SECURITY */}
                        <View style={styles.card}>
                            <SectionHeader title={t('life.securitySafety')} icon="🛡️" />
                            <ProgressBar label={t('life.digitalShield')} value={getEffective(security?.digital, secBuffs.digital)} color="#C8C0EF" icon="💻" buff={getBuffString(secBuffs.digital)} />
                            <ProgressBar label={t('life.bodyguardArmor')} value={getEffective(securityLevel, secBuffs.personal)} color="#C734CA" icon="🥋" buff={getBuffString(secBuffs.personal)} />
                            <ProgressBar label={t('life.policeHeat')} value={suspicion} color={getHeatColor(suspicion)} icon="🚨" />
                        </View>

                        {/* 👊 COMBAT */}
                        <View style={styles.card}>
                            <SectionHeader title={t('life.combatMastery')} icon="👊" />
                            <View style={styles.skillRow}>
                                <View>
                                    <Text style={styles.skillName}>{t('life.selfDefense')}</Text>
                                    <Text style={styles.skillDetail}>{martialArtsDisplay}</Text>
                                    <Text style={styles.skillDetail}>
                                        Security Boost: <Text style={{ fontWeight: 'bold', color: '#C8C0EF' }}>+{securityLevel}%</Text>
                                    </Text>
                                    <Text style={styles.skillDetail}>
                                        Body Type: <Text style={{ fontWeight: 'bold', color: '#C734CA' }}>{bodyType}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.beltBadge, { backgroundColor: getBeltBgColor(beltTitle) }]}>
                                    <Text style={[styles.beltText, { color: getBeltTextColor(beltTitle) }]}>{beltTitle}</Text>
                                </View>
                            </View>
                            <ProgressBar label={t('life.fatigueLevel')} value={fatigue} max={100} color={fatigue > 80 ? '#C734CA' : '#C8C0EF'} icon="⚡" />
                        </View>

                        {/* 🕸️ REPUTATION */}
                        <View style={styles.card}>
                            <SectionHeader title={t('life.reputationNetwork')} icon="🕸️" />
                            <ProgressBar label={t('life.casinoVip')} value={getEffective(reputation?.casino, repBuffs.casino)} max={1000} color="#C734CA" icon="🎰" buff={getBuffString(repBuffs.casino)} />
                            <ProgressBar label={t('life.streetCred')} value={getEffective(reputation?.street, repBuffs.street)} color="#C734CA" icon="🗡️" buff={getBuffString(repBuffs.street)} />
                            <ProgressBar label={t('life.businessTrust')} value={getEffective(reputation?.business, repBuffs.business)} color="#C8C0EF" icon="💼" buff={getBuffString(repBuffs.business)} />
                            <ProgressBar label={t('life.highSociety')} value={getEffective(reputation?.social, repBuffs.social)} color="#6004BD" icon="🥂" buff={getBuffString(repBuffs.social)} />
                        </View>

                        {/* 🧬 GENETICS */}
                        <View style={styles.card}>
                            <SectionHeader title={t('life.coreGenetics')} icon="🧬" />
                            <ProgressBar label={t('life.intellect')} value={getEffective(attributes?.intellect, attrBuffs.intellect)} color="#6004BD" icon="🧠" buff={getBuffString(attrBuffs.intellect)} />
                            <ProgressBar label={t('life.charm')} value={getEffective(attributes?.charm, attrBuffs.charm)} color="#C734CA" icon="👄" buff={getBuffString(attrBuffs.charm)} />
                            <ProgressBar label={t('life.looks')} value={getEffective(attributes?.looks, attrBuffs.looks)} color="#C734CA" icon="✨" buff={getBuffString(attrBuffs.looks)} />
                            <ProgressBar label={t('life.strength')} value={getEffective(attributes?.strength, attrBuffs.strength)} color="#C734CA" icon="💪" buff={getBuffString(attrBuffs.strength)} />
                        </View>

                        {/* 🎭 PERSONALITY */}
                        <View style={styles.card}>
                            <SectionHeader title={t('life.personalityTraits')} icon="🎭" />
                            <ProgressBar label={t('life.ambition')} value={personality?.ambition} color="#C734CA" icon="🔥" />
                            <ProgressBar label={t('life.riskAppetite')} value={personality?.riskAppetite} color="#C734CA" icon="🎲" />
                            <ProgressBar label={t('life.strategicSense')} value={personality?.strategicSense ?? 50} color="#C8C0EF" icon="♟️" />
                            <ProgressBar label={t('life.morality')} value={personality?.morality} color="#C8C0EF" icon="😇" />
                            <ProgressBar label={t('life.luck')} value={hidden?.luck} color="#C8C0EF" icon="🍀" />
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </View>
        </AppLaunchLoader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020626',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 8 : 20,
        paddingBottom: 20,
        gap: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(199,52,202,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(199,52,202,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 36,
        height: 2,
        backgroundColor: '#422B71',
        marginTop: 8,
        borderRadius: 2,
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
        gap: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    statLabelContainer: {
        flexDirection: 'row',
        width: 140,
        alignItems: 'center',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 13,
        fontWeight: '500',
    },
    buffBadge: {
        backgroundColor: 'rgba(200,192,239,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: 'rgba(200,192,239,0.3)',
    },
    buffText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#C8C0EF',
    },
    progressContainer: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    statValue: {
        width: 52,
        textAlign: 'right',
        color: 'rgba(255,255,255,0.48)',
        fontSize: 11,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    skillRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    skillName: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    skillDetail: {
        color: '#FFFFFF',
        fontSize: 12,
        marginBottom: 2,
    },
    beltBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    beltText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    luxuryCard: {
        borderColor: 'rgba(199,52,202,0.35)',
        borderWidth: 1,
        backgroundColor: 'rgba(199,52,202,0.04)',
    },
    luxuryContent: {
        gap: 10,
    },
    luxuryProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    luxuryValue: {
        color: '#C734CA',
        fontWeight: '700',
        fontSize: 12,
        width: 60,
    },
    luxuryTarget: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
        width: 60,
        textAlign: 'right',
    },
    luxuryProgressBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: 'rgba(199,52,202,0.08)',
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(199,52,202,0.2)',
    },
    luxuryProgressBarFill: {
        height: '100%',
        backgroundColor: '#422B71',
        borderRadius: 5,
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    luxuryPercentage: {
        color: '#FFFFFF',
        fontSize: 11,
        textAlign: 'center',
        letterSpacing: 1,
    },
    buffRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        flexWrap: 'wrap',
    },
    luxuryBuffBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(199,52,202,0.2)',
    },
    luxuryBuffText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default DNAScreen;