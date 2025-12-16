import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../theme';
import { CompanionType } from './useTravelSystem';

interface TravelCompanionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (companion: CompanionType) => void;
    hasPartner: boolean;
    hasChildren: boolean;
    partnerName?: string;
    childrenCount: number;
}

const TravelCompanionModal = ({
    visible,
    onClose,
    onConfirm,
    hasPartner,
    hasChildren,
    partnerName,
    childrenCount,
}: TravelCompanionModalProps) => {

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Travel Companion 👥</Text>
                    <Text style={styles.subtitle}>Who are you taking with you?</Text>

                    <View style={styles.optionsContainer}>
                        {/* Myself */}
                        <Pressable
                            style={styles.optionButton}
                            onPress={() => onConfirm('Myself')}
                        >
                            <Text style={styles.optionEmoji}>👤</Text>
                            <View>
                                <Text style={styles.optionTitle}>Go by Myself</Text>
                                <Text style={styles.optionCost}>Standard Cost (x1)</Text>
                            </View>
                        </Pressable>

                        {/* Partner */}
                        <Pressable
                            style={[
                                styles.optionButton,
                                !hasPartner && styles.optionDisabled
                            ]}
                            disabled={!hasPartner}
                            onPress={() => onConfirm('Partner')}
                        >
                            <Text style={[styles.optionEmoji, !hasPartner && styles.textDisabled]}>❤️</Text>
                            <View>
                                <Text style={[styles.optionTitle, !hasPartner && styles.textDisabled]}>
                                    {hasPartner ? `Bring ${partnerName}` : 'No Partner'}
                                </Text>
                                <Text style={[styles.optionCost, !hasPartner && styles.textDisabled]}>Cost x2</Text>
                            </View>
                        </Pressable>

                        {/* Kids */}
                        <Pressable
                            style={[
                                styles.optionButton,
                                !hasChildren && styles.optionDisabled
                            ]}
                            disabled={!hasChildren}
                            onPress={() => onConfirm('Kids')}
                        >
                            <Text style={[styles.optionEmoji, !hasChildren && styles.textDisabled]}>🍼</Text>
                            <View>
                                <Text style={[styles.optionTitle, !hasChildren && styles.textDisabled]}>
                                    Bring Kids
                                </Text>
                                <Text style={[styles.optionCost, !hasChildren && styles.textDisabled]}>
                                    {hasChildren ? `Cost x${childrenCount + 1} (You + Kids)` : 'No Children'}
                                </Text>
                            </View>
                        </Pressable>

                        {/* Family (Partner + Kids) - Optional bonus feature since logic supports it */}
                        <Pressable
                            style={[
                                styles.optionButton,
                                (!hasChildren || !hasPartner) && styles.optionDisabled
                            ]}
                            disabled={!hasChildren || !hasPartner}
                            onPress={() => onConfirm('Family')}
                        >
                            <Text style={[styles.optionEmoji, (!hasChildren || !hasPartner) && styles.textDisabled]}>👨‍👩‍👧‍👦</Text>
                            <View>
                                <Text style={[styles.optionTitle, (!hasChildren || !hasPartner) && styles.textDisabled]}>
                                    Bring Whole Family
                                </Text>
                                <Text style={[styles.optionCost, (!hasChildren || !hasPartner) && styles.textDisabled]}>
                                    {hasChildren && hasPartner ? `Cost x${childrenCount + 2}` : 'Family incomplete'}
                                </Text>
                            </View>
                        </Pressable>
                    </View>

                    <Pressable onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel Trip</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    container: {
        width: '100%',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    optionsContainer: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    optionDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
    },
    optionEmoji: {
        fontSize: 24,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    optionCost: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    textDisabled: {
        color: theme.colors.textMuted,
    },
    cancelButton: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    cancelButtonText: {
        color: theme.colors.error, // Red for cancel at this stage? Or muted.
        fontSize: theme.typography.body,
    },
});

export default TravelCompanionModal;
