import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../../../../core/theme';
import GameButton from '../../../../../components/common/GameButton';
import BottomStatsBar from '../../../../../components/common/BottomStatsBar';

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
            [{ label: 'Charisma', value: '+1', isPositive: true }]
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
                        <Text style={styles.title}>GROOMING LOUNGE</Text>
                        <Text style={styles.subtitle}>Look Sharp, Feel Lucky</Text>
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

                    <SectionTitle title="Hairstyle" />
                    <SelectorGrid
                        items={HAIRSTYLES}
                        selected={selectedHair}
                        onSelect={setHair}
                    />

                    <SectionTitle title="Beard Style" />
                    <SelectorGrid
                        items={BEARDSTYLES}
                        selected={selectedBeard}
                        onSelect={setBeard}
                    />

                    <SectionTitle title="Hair Color" />
                    <SelectorGrid
                        items={HAIRCOLORS}
                        selected={selectedColor}
                        onSelect={setColor}
                    />

                    <GameButton
                        title="Apply New Look"
                        variant="primary"
                        onPress={onApply}
                        style={{ marginTop: 24 }}
                    />

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Stats Bar */}
            <View style={styles.bottomBarContainer}>
                <BottomStatsBar onHomePress={onGoHome} />
            </View>
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
        backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#374151',
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: '#6B7280',
        fontSize: 12,
    },
    priceTag: {
        textAlign: 'center',
        color: '#C5A065',
        fontWeight: '600',
        marginBottom: theme.spacing.lg,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    specialServiceCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: theme.radius.md,
        padding: 16,
        borderWidth: 2,
        borderColor: '#10b981',
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
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
    },
    specialServiceDesc: {
        color: '#4B5563',
        fontSize: 12,
        marginTop: 2,
    },
    specialServicePrice: {
        color: '#10b981',
        fontSize: 18,
        fontWeight: '700',
    },
    specialServiceBenefit: {
        backgroundColor: '#10b98120',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    benefitText: {
        color: '#047857', // Darker green
        fontSize: 12,
        fontWeight: '700',
    },
    specialServiceCardActive: {
        backgroundColor: '#10b98130',
        borderColor: '#10b981',
    },
    activeBuffBadge: {
        backgroundColor: '#10b981',
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
        backgroundColor: '#E5E7EB',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
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
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    gridItemSelected: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    gridItemText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    gridItemTextSelected: {
        color: '#FFFFFF',
    },
});
