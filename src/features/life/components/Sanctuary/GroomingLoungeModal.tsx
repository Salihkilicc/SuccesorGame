import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../../core/theme';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';

import { useStatsStore } from '../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

type GroomingLoungeModalProps = {
    visible: boolean;
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
};

// Placeholder Data
const HAIRSTYLES = ['Buzz Cut', 'Pompadour', 'Long Waves', 'Faux Hawk', 'Bald'];
const BEARDSTYLES = ['Clean Shaven', 'Stubble', 'Full Beard', 'Goatee', 'Mutton Chops'];
const HAIRCOLORS = ['Natural Black', 'Chestnut Brown', 'Platinum Blonde', 'Silver Fox', 'Neon Blue'];

const COST = 200;

const GroomingLoungeModal = ({ visible, onClose, handleServicePurchase }: GroomingLoungeModalProps) => {
    const [selectedHair, setHair] = useState(HAIRSTYLES[0]);
    const [selectedBeard, setBeard] = useState(BEARDSTYLES[0]);
    const [selectedColor, setColor] = useState(HAIRCOLORS[0]);

    const onApply = () => {
        handleServicePurchase(
            COST,
            { charisma: usePlayerStore.getState().attributes.charm + 1 },
            'FRESH CUT',
            `You look sharp with your ${selectedHair} and ${selectedBeard}.`,
            [{ label: 'Charisma', value: '+1', isPositive: true }]
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="GROOMING LOUNGE">

            <Text style={styles.priceTag}>Cost: ${COST}</Text>

            <ScrollView contentContainerStyle={styles.scrollContent}>

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

            </ScrollView>

            <View style={styles.footer}>
                <GameButton
                    title="Cancel"
                    variant="secondary"
                    onPress={onClose}
                    style={{ flex: 1 }}
                />
                <GameButton
                    title="Apply New Look"
                    variant="primary"
                    onPress={onApply}
                    style={{ flex: 1 }}
                />
            </View>
        </GameModal>
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

export default GroomingLoungeModal;

const styles = StyleSheet.create({
    priceTag: {
        textAlign: 'center',
        color: '#C5A065',
        fontWeight: '600',
        marginBottom: theme.spacing.lg,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },
    sectionTitle: {
        color: '#A0AEC0',
        fontSize: 14,
        fontWeight: '600',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#2D3748',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    gridItemSelected: {
        backgroundColor: '#3182CE',
        borderColor: '#63B3ED',
    },
    gridItemText: {
        color: '#CBD5E0',
        fontSize: 13,
    },
    gridItemTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        gap: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#2D3748',
    },
});
