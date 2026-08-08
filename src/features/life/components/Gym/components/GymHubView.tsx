import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';
import { useGymSystem, type MartialArtStyle, BELT_TITLES, type BeltRank } from '../useGymSystem';

const STYLE_ICONS: Record<MartialArtStyle, string> = {
    boxing: '🥊',
    mma: '🤼',
    muaythai: '🦵',
    bjj: '🥋',
    karate: '🥷',
};

type GymHubViewProps = {
    onSelectFitness: (type: string) => void;
    onSelectMartialArt: (type: MartialArtStyle) => void;
    onOpenTrainer: () => void;
    onOpenSupplements: () => void;
};

const GymHubView = ({
    onSelectFitness,
    onSelectMartialArt,
    onOpenTrainer,
    onOpenSupplements,
}: GymHubViewProps) => {
    useLocale();
    const { gymState, bodyType, fatigue } = useGymSystem();

    // Get highest martial arts rank for display
    const martialArtsEntries = Object.entries(gymState.martialArts);
    const highestMartialArt = martialArtsEntries.reduce((highest, [style, rank]) => {
        return rank > highest.rank ? { style: style as MartialArtStyle, rank } : highest;
    }, { style: null as MartialArtStyle | null, rank: 0 });

    const hasMartialArts = highestMartialArt.style !== null;
    const martialArtsLabel = hasMartialArts
        ? `${highestMartialArt.style?.toUpperCase()} ${STYLE_ICONS[highestMartialArt.style!]}`
        : 'MARTIAL ARTS';

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Fatigue Display - Battery Style */}
            <View style={styles.statsCard}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>{t('life.energy')}</Text>
                    <View style={styles.batteryContainer}>
                        <View style={styles.batteryBody}>
                            {/* Segments */}
                            {[0, 1, 2, 3, 4].map((segment) => {
                                const segmentValue = segment * 20;
                                const isActive = (100 - fatigue) > segmentValue;
                                let segmentColor = '#CFD0D2'; // Green
                                if (fatigue > 50 && fatigue <= 80) segmentColor = '#FF8A8A'; // Orange
                                if (fatigue > 80) segmentColor = '#FF8A8A'; // Red

                                return (
                                    <View
                                        key={segment}
                                        style={[
                                            styles.batterySegment,
                                            {
                                                backgroundColor: isActive ? segmentColor : '#FFFFFF',
                                                opacity: isActive ? 1 : 0.3,
                                            }
                                        ]}
                                    />
                                );
                            })}
                        </View>
                        <View style={styles.batteryTip} />
                        <Text style={styles.fatigueText}>{100 - fatigue}%</Text>
                    </View>
                </View>
            </View>

            {/* FITNESS & BODY */}
            <Text style={styles.sectionTitle}>{t('life.fitnessBody')}</Text>
            <View style={styles.grid}>
                {[
                    { key: 'cardio', icon: '🏃', label: t('life.cardio') },
                    { key: 'hypertrophy', icon: '💪', label: t('life.hypertrophy') },
                    { key: 'calisthenics', icon: '🤸', label: t('life.calisthenics') },
                    { key: 'yoga', icon: '🧘', label: t('life.yoga') },
                ].map(item => (
                    <TouchableOpacity
                        key={item.key}
                        onPress={() => onSelectFitness(item.key)}
                        style={styles.card}
                        activeOpacity={0.7}>
                        <Text style={styles.icon}>{item.icon}</Text>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* MARTIAL ARTS */}
            <Text style={styles.sectionTitle}>{t('life.martialArts')}</Text>
            <View style={styles.maList}>
                {(['boxing', 'mma', 'muaythai', 'bjj', 'karate'] as MartialArtStyle[]).map(art => {
                    const rank = gymState.martialArts[art] || 0;
                    const beltTitle = BELT_TITLES[rank as BeltRank];

                    return (
                        <TouchableOpacity
                            key={art}
                            onPress={() => onSelectMartialArt(art)}
                            style={styles.maCard}
                            activeOpacity={0.7}>
                            <View style={styles.maLeft}>
                                <Text style={styles.maIcon}>{STYLE_ICONS[art]}</Text>
                                <Text style={styles.maLabel}>{art.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.maBelt}>{beltTitle} Belt</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* MODIFIERS */}
            <Text style={styles.sectionTitle}>{t('life.modifiers')}</Text>

            <TouchableOpacity
                onPress={onOpenTrainer}
                style={styles.modifierBtn}
                activeOpacity={0.7}>
                <View style={styles.modContent}>
                    <Text style={styles.modLabel}>
                        {gymState.trainerId
                            ? `TRAINER: ${gymState.trainerId.toUpperCase()}`
                            : 'SELECT PERSONAL TRAINER'}
                    </Text>
                    {gymState.trainerId && <Text style={styles.changeText}>{t('life.change')}</Text>}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onOpenSupplements}
                style={styles.modifierBtn}
                activeOpacity={0.7}>
                <Text style={styles.modLabel}>{t('life.lockerRoomSupplements')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const getBodyTypeColor = (bodyType: string): string => {
    const colors: Record<string, string> = {
        'Skinny': 'rgba(255,255,255,0.48)',
        'Fit': '#CFD0D2',
        'Muscular': '#FF8A8A',
        'Godlike': '#FF8A8A'
    };
    return colors[bodyType] || '#FFFFFF';
};

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 0,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        gap: 16
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4
    },
    statLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    statValue: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    fatigueBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 8
    },
    fatigueBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden'
    },
    fatigueBarFill: {
        height: '100%',
        borderRadius: 8
    },
    fatigueText: {
        color: theme.colors.onLight,
        fontSize: 14,
        fontWeight: '700',
        width: 45,
        textAlign: 'right'
    },
    batteryContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 6
    },
    batteryBody: {
        flex: 1,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        flexDirection: 'row',
        padding: 2,
        gap: 2,
        overflow: 'hidden'
    },
    batterySegment: {
        flex: 1,
        borderRadius: 3,
    },
    batteryTip: {
        width: 4,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.48)',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontWeight: '800',
        marginTop: 30,
        marginBottom: 15,
        fontSize: 13,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: '48%',
        aspectRatio: 1.2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 0,
        shadowColor: '#05A8F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: { fontSize: 36, marginBottom: 10 },
    cardLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    maList: { gap: 10 },
    maCard: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 14,
        borderWidth: 0,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    maLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14
    },
    maIcon: {
        fontSize: 24
    },
    maLabel: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5, fontSize: 16 },
    maBelt: { color: 'rgba(255,255,255,0.48)', fontSize: 14, fontWeight: '600' },
    modifierBtn: {
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 14,
        borderWidth: 0,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 12
    },
    modContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modLabel: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3, fontSize: 14 },
    changeText: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '600' },
});

export default GymHubView;
