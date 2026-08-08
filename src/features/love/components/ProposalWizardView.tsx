import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';
import { PROPOSAL_LOCATIONS } from '../data/loveConstants';

type OwnedRing = {
    instanceId: string;
    name: string;
    marketValue?: number;
    price: number;
};

interface Props {
    // State
    proposalStep: number;
    proposalResult: { success: boolean; message: string } | null;
    selectedLocationIndex: number;
    selectedRingInstanceId: string | null;
    isPickingRing: boolean;
    ownedRings: OwnedRing[];
    money: number;
    feedback: string | null;

    // Handlers
    onCycleLocation: (direction: 'prev' | 'next') => void;
    onSelectRing: (instanceId: string) => void;
    onSetIsPickingRing: (isPicking: boolean) => void;
    onStartProposal: () => void;
    onDecidePrenup: (wantsPrenup: boolean) => void;
    onClose: () => void;
    onGoShopping: () => void;
}

const ProposalWizardView: React.FC<Props> = ({
    proposalStep,
    proposalResult,
    selectedLocationIndex,
    selectedRingInstanceId,
    isPickingRing,
    ownedRings,
    money,
    feedback,
    onCycleLocation,
    onSelectRing,
    onSetIsPickingRing,
    onStartProposal,
    onDecidePrenup,
    onClose,
    onGoShopping,
}) => {
    useLocale();
    const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
    const canAfford = money >= location.cost;
    const selectedRing = ownedRings.find(r => r.instanceId === selectedRingInstanceId) ?? ownedRings[0] ?? null;

    // STEP 3: RESULT
    if (proposalStep === 3 && proposalResult) {
        const isSuccess = proposalResult.success;
        return (
            <View style={{ alignItems: 'center', gap: 16, padding: 20 }}>
                <Text style={{ fontSize: 60 }}>{isSuccess ? '💍' : '💔'}</Text>
                <Text style={[styles.modalSubtitle, { fontSize: 24, color: isSuccess ? theme.colors.success : theme.colors.danger }]}>
                    {isSuccess ? 'JUST MARRIED!' : 'REJECTED'}
                </Text>
                <Text style={{ color: theme.colors.textPrimary, textAlign: 'center', fontSize: 16 }}>
                    {proposalResult.message}
                </Text>
            </View>
        );
    }

    // STEP 2: PRENUP DECISION
    if (proposalStep === 2) {
        return (
            <View style={{ gap: 16, padding: 10 }}>
                <Text style={{ fontSize: 50, textAlign: 'center' }}>😲</Text>
                <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>{t('love.sheSaidYesKindOf')}</Text>

                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    She is emotional and waiting for the ring. This is your moment.
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{t('love.doYouWantToAsk')}</Text>
                    {"\n"}
                    (Protects assets, but might offend her)
                </Text>

                <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.colors.destructive }]}
                    onPress={() => onDecidePrenup(true)}>
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>📝 Sign Prenup (Risk)</Text>
                </Pressable>

                <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
                    onPress={() => onDecidePrenup(false)}>
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>❤️ No Prenup (Trust)</Text>
                </Pressable>
            </View>
        );
    }

    // RING PICKER SCREEN (inline view swap)
    if (isPickingRing) {
        return (
            <View style={{ gap: 12 }}>
                <Text style={styles.modalSubtitle}>{t('love.chooseYourRing')}</Text>
                {ownedRings.map(ring => (
                    <Pressable
                        key={ring.instanceId}
                        style={[styles.actionButton, {
                            justifyContent: 'space-between',
                            backgroundColor: ring.instanceId === selectedRingInstanceId
                                ? 'rgba(5,168,246,0.18)'
                                : 'rgba(255,255,255,0.04)',
                            borderWidth: ring.instanceId === selectedRingInstanceId ? 1 : 0,
                            borderColor: theme.colors.accent,
                        }]}
                        onPress={() => {
                            onSelectRing(ring.instanceId);
                            onSetIsPickingRing(false);
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 22 }}>💍</Text>
                            <View>
                                <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>{ring.name}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    Value: ${(ring.marketValue ?? ring.price).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        {ring.instanceId === selectedRingInstanceId && (
                            <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                        )}
                    </Pressable>
                ))}
            </View>
        );
    }

    // STEP 1: PICKER (Default)
    return (
        <View style={{ gap: 16 }}>
            <Text style={styles.modalSubtitle}>{t('love.planProposal')}</Text>

            {/* Location Picker */}
            <View style={styles.locationPicker}>
                <Pressable onPress={() => onCycleLocation('prev')} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>←</Text>
                </Pressable>
                <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <Text style={[styles.locationCost, !canAfford && { color: theme.colors.danger }]}>
                        ${location.cost.toLocaleString()}
                    </Text>
                    <Text style={styles.locationBonus}>
                        Success Bonus: +{location.bonus}%
                    </Text>
                </View>
                <Pressable onPress={() => onCycleLocation('next')} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>→</Text>
                </Pressable>
            </View>

            {/* Ring Check */}
            <View style={[styles.actionButton, {
                justifyContent: 'space-between',
                backgroundColor: ownedRings.length > 0 ? 'rgba(207,208,210,0.1)' : 'rgba(5,168,246,0.1)',
            }]}>
                {ownedRings.length === 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 18 }}>💍</Text>
                        <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>{t('love.noRing')}</Text>
                    </View>
                ) : (
                    <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                        onPress={() => onSetIsPickingRing(true)}
                    >
                        <Text style={{ fontSize: 18 }}>💍</Text>
                        <View>
                            <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>
                                {selectedRing?.name ?? 'Ring Selected'}
                            </Text>
                            <Text style={{ color: theme.colors.textPrimary, fontSize: 11, marginTop: 1, letterSpacing: 0.5 }}>{t('love.tapToChange')}</Text>
                        </View>
                    </Pressable>
                )}

                <Pressable style={styles.smallButton} onPress={onGoShopping}>
                    <Text style={styles.smallButtonText}>{t('love.goShopping')}</Text>
                </Pressable>
            </View>

            {/* Action Button */}
            <Pressable
                style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.accent, marginTop: 8, opacity: (canAfford && ownedRings.length > 0) ? 1 : 0.5 }
                ]}
                onPress={onStartProposal}>
                <Text style={[styles.actionButtonText, { color: '#FFFFFF', fontWeight: '800', letterSpacing: 1 }]}>{t('love.propose2')}</Text>
            </Pressable>
        </View>
    );
};

export default ProposalWizardView;

const styles = StyleSheet.create({
    modalSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionButtonText: {
        color: theme.colors.textPrimary,
        fontWeight: '600',
        fontSize: 15,
    },
    locationPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    arrowButton: {
        padding: 12,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 8,
    },
    arrowText: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    locationInfo: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    locationName: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    locationCost: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    locationBonus: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    smallButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    smallButtonText: {
        color: theme.colors.onLight,
        fontSize: 12,
        fontWeight: '700',
    },
});
