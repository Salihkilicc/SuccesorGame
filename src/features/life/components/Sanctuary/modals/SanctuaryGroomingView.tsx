import React, { useState } from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../../../../core/theme';
import GameButton from '../../../../../components/common/GameButton';
import CrystalNavBar from '../../../../../navigation/components/CrystalNavBar';

import { useStatsStore } from '../../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../../core/store/usePlayerStore';

import { GROOMING_SERVICES } from '../data/sanctuaryData';

type GroomingLoungeModalProps = {
    visible: boolean; // Kept for prop compatibility, not used
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
    getFreshCut: () => void;
    onGoHome: () => void;
    activeBuffs: { freshCut: boolean };
};

// Placeholder Data
const HAIRSTYLES = ['Buzz Cut', 'Pompadour', 'Long Waves', 'Faux Hawk', 'Bald'];
const BEARDSTYLES = ['Clean Shaven', 'Stubble', 'Full Beard', 'Goatee', 'Mutton Chops'];
const HAIRCOLORS = ['Natural Black', 'Chestnut Brown', 'Platinum Blonde', 'Silver Fox', 'Neon Blue'];

const COST = 200;

const SanctuaryGroomingView = ({ visible, onClose, handleServicePurchase, getFreshCut, onGoHome, activeBuffs }: GroomingLoungeModalProps) => {
    useLocale();
    const [selectedHair, setHair] = useState(HAIRSTYLES[0]);
    const [selectedBeard, setBeard] = useState(BEARDSTYLES[0]);
    const [selectedColor, setColor] = useState(HAIRCOLORS[0]);

    const freshCutService = GROOMING_SERVICES[0];

    const onApply = () => {
        handleServicePurchase(
            COST,
            { charisma: usePlayerStore.getState().attributes.charm + 1 },
            'FRESH CUT',
            `You look sharp with your ${selectedHair} and ${selectedBeard}.`,
            [{ label: t('life.charisma'), value: '+1', isPositive: true }]
        );
    };

    const onFreshCut = () => {
        getFreshCut();
        onClose();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('life.groomingLounge2')}</Text>
                        <Text style={styles.subtitle}>{t('life.lookSharpFeelLucky')}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Text style={styles.priceTag}>Cost: ${COST}</Text>

                    {/* FRESH CUT & STYLE - NEW FEATURE */}
                    <View style={styles.specialServiceCard}>
                        <View style={styles.specialServiceHeader}>
                            <Text style={styles.specialServiceIcon}>🍀</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.specialServiceTitle}>{freshCutService.name}</Text>
                                <Text style={styles.specialServiceDesc}>
                                    {freshCutService.message}
                                </Text>
                            </View>
                            <Text style={styles.specialServicePrice}>${freshCutService.cost.toLocaleString()}</Text>
                        </View>
                        <View style={styles.specialServiceBenefit}>
                            <Text style={styles.benefitText}>✨ +{freshCutService.luck} Luck Boost</Text>
                        </View>
                        <GameButton
                            title={`Get ${freshCutService.name} 🍀`}
                            variant="primary"
                            onPress={onFreshCut}
                            style={{ marginTop: 8 }}
                        />
                    </View>

                    <View style={styles.divider} />

                    <SectionTitle title={t('life.hairstyle')} />
                    <SelectorGrid
                        items={HAIRSTYLES}
                        selected={selectedHair}
                        onSelect={setHair}
                    />

                    <SectionTitle title={t('life.beardStyle')} />
                    <SelectorGrid
                        items={BEARDSTYLES}
                        selected={selectedBeard}
                        onSelect={setBeard}
                    />

                    <SectionTitle title={t('life.hairColor')} />
                    <SelectorGrid
                        items={HAIRCOLORS}
                        selected={selectedColor}
                        onSelect={setColor}
                    />

                    <GameButton
                        title={t('life.applyNewLook')}
                        variant="primary"
                        onPress={onApply}
                        style={{ marginTop: 24 }}
                    />

                </ScrollView>
            </SafeAreaView>

            {/* Universal Crystal Navigation Bar */}
            <CrystalNavBar activeTab="Life" variant="dark" />
        </View>
    );
};

const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const SelectorGrid = ({ items, selected, onSelect }: { items: string[], selected: string, onSelect: (i: string) => void }) => (
    <View style={styles.grid}>
        {items.map((item) => (
            <Pressable
                key={item}
                onPress={() => onSelect(item)}
                style={[
                    styles.gridItem,
                    selected === item && styles.gridItemSelected
                ]}
            >
                <Text style={[
                    styles.gridItemText,
                    selected === item && styles.gridItemTextSelected
                ]}>{item}</Text>
            </Pressable>
        ))}
    </View>
);

export default SanctuaryGroomingView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#CFD0D2',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.48)',
        backgroundColor: '#CFD0D2',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        color: theme.colors.onLight,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: theme.colors.onLight,
        fontSize: 12,
    },
    priceTag: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        marginBottom: theme.spacing.lg,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    specialServiceCard: {
        backgroundColor: '#434B50',
        borderRadius: theme.radius.md,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        marginBottom: theme.spacing.md,
    },
    specialServiceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    specialServiceIcon: {
        fontSize: 32,
    },
    specialServiceTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    specialServiceDesc: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 2,
    },
    specialServicePrice: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    specialServiceBenefit: {
        backgroundColor: '#CFD0D220',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    benefitText: {
        color: '#FFFFFF', // Darker green
        fontSize: 12,
        fontWeight: '700',
    },
    specialServiceCardActive: {
        backgroundColor: '#CFD0D230',
        borderColor: 'rgba(255,255,255,0.48)',
    },
    activeBuffBadge: {
        backgroundcolor: '#CFD0D2',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    activeBuffText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.48)',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.onLight,
        marginBottom: 12,
        marginTop: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    gridItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#434B50',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
    },
    gridItemSelected: {
        backgroundColor: '#CFD0D2',
        borderColor: 'rgba(255,255,255,0.48)',
    },
    gridItemText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    gridItemTextSelected: {
        color: theme.colors.onLight,
    },
});
