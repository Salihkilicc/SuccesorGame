import React from 'react';
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

const ProgressBar = ({ label, value, max = 100, color = '#3498db', icon, buff }: {
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
    const buffColor = isBuffActive ? '#D4AF37' : 'rgba(255,255,255,0.08)';
    const buffTextColor = isBuffActive ? '#000' : '#555';

    return (
        <View style={[styles.card, styles.luxuryCard]}>
            <SectionHeader title="LUXURY LIFESTYLE" icon="💎" />
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
        if (['white', 'yellow'].includes(lowerBelt)) return '#000';
        return '#fff';
    };

    const getBeltBgColor = (belt: string) => {
        const lowerBelt = belt?.toLowerCase() || 'white';
        const colors: Record<string, string> = {
            white: '#f5f5f5',
            yellow: '#f1c40f',
            orange: '#e67e22',
            green: '#2ecc71',
            blue: '#3498db',
            purple: '#9b59b6',
            brown: '#795548',
            black: '#1a1a1a'
        };
        return colors[lowerBelt] || '#333';
    };

    const getHeatColor = (val: number) => {
        if (val > 80) return '#ef4444';
        if (val < 30) return '#3b82f6';
        return '#f39c12';
    };

    return (
        <AppLaunchLoader
            appName="DNA"
            appIcon={<MaterialCommunityIcons name="dna" size={64} color="#FFFFFF" />}
            backgroundColor="#000000"
        >
            <View style={styles.container}>
                {/* Premium background gradient */}
                <LinearGradient
                    colors={['#0a0a0c', '#000000', '#050505']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color="#D4AF37" />
                        </Pressable>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headerTitle}>DNA & STATS</Text>
                            <View style={styles.headerAccent} />
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                        {/* 💎 LUXURY */}
                        <LuxuryBar />

                        {/* 🛡️ SECURITY */}
                        <View style={styles.card}>
                            <SectionHeader title="Security & Safety" icon="🛡️" />
                            <ProgressBar label="Digital Shield" value={getEffective(security?.digital, secBuffs.digital)} color="#3498db" icon="💻" buff={getBuffString(secBuffs.digital)} />
                            <ProgressBar label="Bodyguard / Armor" value={getEffective(securityLevel, secBuffs.personal)} color="#e74c3c" icon="🥋" buff={getBuffString(secBuffs.personal)} />
                            <ProgressBar label="Police Heat" value={suspicion} color={getHeatColor(suspicion)} icon="🚨" />
                        </View>

                        {/* 👊 COMBAT */}
                        <View style={styles.card}>
                            <SectionHeader title="Combat Mastery" icon="👊" />
                            <View style={styles.skillRow}>
                                <View>
                                    <Text style={styles.skillName}>Self Defense</Text>
                                    <Text style={styles.skillDetail}>{martialArtsDisplay}</Text>
                                    <Text style={styles.skillDetail}>
                                        Security Boost: <Text style={{ fontWeight: 'bold', color: '#2ecc71' }}>+{securityLevel}%</Text>
                                    </Text>
                                    <Text style={styles.skillDetail}>
                                        Body Type: <Text style={{ fontWeight: 'bold', color: '#D4AF37' }}>{bodyType}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.beltBadge, { backgroundColor: getBeltBgColor(beltTitle) }]}>
                                    <Text style={[styles.beltText, { color: getBeltTextColor(beltTitle) }]}>{beltTitle}</Text>
                                </View>
                            </View>
                            <ProgressBar label="Fatigue Level" value={fatigue} max={100} color={fatigue > 80 ? '#e74c3c' : '#2ecc71'} icon="⚡" />
                        </View>

                        {/* 🕸️ REPUTATION */}
                        <View style={styles.card}>
                            <SectionHeader title="Reputation Network" icon="🕸️" />
                            <ProgressBar label="Casino (VIP)" value={getEffective(reputation?.casino, repBuffs.casino)} max={1000} color="#E91E63" icon="🎰" buff={getBuffString(repBuffs.casino)} />
                            <ProgressBar label="Street (Cred)" value={getEffective(reputation?.street, repBuffs.street)} color="#c0392b" icon="🗡️" buff={getBuffString(repBuffs.street)} />
                            <ProgressBar label="Business (Trust)" value={getEffective(reputation?.business, repBuffs.business)} color="#2980b9" icon="💼" buff={getBuffString(repBuffs.business)} />
                            <ProgressBar label="High Society" value={getEffective(reputation?.social, repBuffs.social)} color="#8e44ad" icon="🥂" buff={getBuffString(repBuffs.social)} />
                        </View>

                        {/* 🧬 GENETICS */}
                        <View style={styles.card}>
                            <SectionHeader title="Core Genetics" icon="🧬" />
                            <ProgressBar label="Intellect" value={getEffective(attributes?.intellect, attrBuffs.intellect)} color="#9b59b6" icon="🧠" buff={getBuffString(attrBuffs.intellect)} />
                            <ProgressBar label="Charm" value={getEffective(attributes?.charm, attrBuffs.charm)} color="#e91e63" icon="👄" buff={getBuffString(attrBuffs.charm)} />
                            <ProgressBar label="Looks" value={getEffective(attributes?.looks, attrBuffs.looks)} color="#f1c40f" icon="✨" buff={getBuffString(attrBuffs.looks)} />
                            <ProgressBar label="Strength" value={getEffective(attributes?.strength, attrBuffs.strength)} color="#e74c3c" icon="💪" buff={getBuffString(attrBuffs.strength)} />
                        </View>

                        {/* 🎭 PERSONALITY */}
                        <View style={styles.card}>
                            <SectionHeader title="Personality Traits" icon="🎭" />
                            <ProgressBar label="Ambition" value={personality?.ambition} color="#FFC107" icon="🔥" />
                            <ProgressBar label="Risk Appetite" value={personality?.riskAppetite} color="#FF5722" icon="🎲" />
                            <ProgressBar label="Strategic Sense" value={personality?.strategicSense ?? 50} color="#3498db" icon="♟️" />
                            <ProgressBar label="Morality" value={personality?.morality} color="#8BC34A" icon="😇" />
                            <ProgressBar label="Luck" value={hidden?.luck} color="#10b981" icon="🍀" />
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
        backgroundColor: '#000000',
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
        backgroundColor: 'rgba(212, 175, 55, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#E5E5E5',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 36,
        height: 2,
        backgroundColor: '#D4AF37',
        marginTop: 8,
        borderRadius: 2,
        shadowColor: '#D4AF37',
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
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
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
        borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666666',
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
        color: '#AAAAAA',
        fontSize: 13,
        fontWeight: '500',
    },
    buffBadge: {
        backgroundColor: 'rgba(46, 204, 113, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.3)',
    },
    buffText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#2ecc71',
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
        color: '#888888',
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
        color: '#E0E0E0',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    skillDetail: {
        color: '#666666',
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
        borderColor: 'rgba(212, 175, 55, 0.35)',
        borderWidth: 1,
        backgroundColor: 'rgba(212, 175, 55, 0.04)',
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
        color: '#D4AF37',
        fontWeight: '700',
        fontSize: 12,
        width: 60,
    },
    luxuryTarget: {
        color: '#555',
        fontWeight: '600',
        fontSize: 12,
        width: 60,
        textAlign: 'right',
    },
    luxuryProgressBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    luxuryProgressBarFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
        borderRadius: 5,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    luxuryPercentage: {
        color: '#555',
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
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    luxuryBuffText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default DNAScreen;