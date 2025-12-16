import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';

import { useStatsStore } from '../../../store/useStatsStore';

type GroomingLoungeModalProps = {
    visible: boolean;
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Partial<typeof useStatsStore.getState>,
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
            { charisma: useStatsStore.getState().charisma + 1 }, // This delta logic needs care. The handler should probably take deltas or we compute final here.
            // Wait, in useSanctuarySystem I updated it to MERGE updates.
            // So passing `{ charisma: current + 1 }` is correct if I access current state here.
            // Accessing store inside component is fine.
            'FRESH CUT',
            `You look sharp with your ${selectedHair} and ${selectedBeard}.`,
            [{ label: 'Charisma', value: '+1', isPositive: true }]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.headerTitle}>GROOMING LOUNGE</Text>
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
                        <Pressable
                            style={styles.cancelButton}
                            onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={styles.applyButton}
                            onPress={onApply}>
                            <Text style={styles.applyText}>Apply New Look</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    container: {
        width: '100%',
        maxHeight: '85%',
        backgroundColor: '#1E222A',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#E2E8F0',
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
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
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: theme.radius.md,
        backgroundColor: '#2D3748',
        alignItems: 'center',
    },
    cancelText: {
        color: '#A0AEC0',
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        padding: 14,
        borderRadius: theme.radius.md,
        backgroundColor: '#C5A065', // Gold
        alignItems: 'center',
    },
    applyText: {
        color: '#1A202C',
        fontWeight: '700',
    },
});
