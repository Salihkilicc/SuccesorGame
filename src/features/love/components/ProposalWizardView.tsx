// src/features/love/components/ProposalWizardView.tsx
//
// ============================================================================
//  ASKING SOMEBODY TO MARRY YOU
// ============================================================================
//
//  WHAT WAS WRONG, and it was the same fault three times over.
//
//  THE VENUE WAS A CAROUSEL. Twelve places behind a prev and a next arrow, so
//  reaching the last one took eleven taps and no two were ever on screen
//  together - which is the one thing a list of prices is for. You could not
//  see that the yacht is fifteen thousand for fifteen per cent while the
//  billboard is a hundred thousand for thirty, which is the only interesting
//  decision on the page.
//
//  THE SYMBOLS WERE EMOJI. Eight of them, at sizes up to sixty points, in a
//  typeface and a colour nothing in the theme chose, beside text that obeys
//  both. Half the arrows had already been fixed to icons and the other half
//  had not, which is how a screen ends up looking like two screens.
//
//  AND THE RESULT USED THE PROFIT COLOURS. Green for a yes and red for a no,
//  in a game where those two mean money in and money out and nothing else -
//  see rule 3 in core/theme.ts. Getting married is not a quarter.
// ============================================================================

import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
    /**
     * SHELVED, with the carousel it drove:
     *   onCycleLocation: (direction: 'prev' | 'next') => void;
     */
    onPickLocation: (index: number) => void;
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
    onPickLocation,
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
            <View style={{ alignItems: 'center', gap: 16, padding: 16, width: '100%' }}>
                <View style={styles.resultBadge}>
                    <MaterialCommunityIcons
                        name={isSuccess ? 'ring' : 'heart-broken-outline'}
                        size={34}
                        color={theme.colors.textPrimary}
                    />
                </View>
                <Text style={[styles.modalSubtitle, { fontSize: 22, color: theme.colors.textPrimary }]}>
                    {isSuccess ? t('love.justMarried') : t('love.rejected')}
                </Text>
                <Text style={{ color: theme.colors.textPrimary, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                    {proposalResult.message}
                </Text>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.colors.accent, marginTop: 12, width: '100%', justifyContent: 'center' }]}
                    onPress={onClose}
                >
                    <Text style={[styles.actionButtonText, { color: theme.colors.onLight, fontWeight: '800', textAlign: 'center' }]}>
                        {isSuccess ? t('love.celebrateAndClose') : t('love.close')}
                    </Text>
                </Pressable>
            </View>
        );
    }

    // STEP 2: PRENUP DECISION
    if (proposalStep === 2) {
        return (
            <View style={{ gap: 16, padding: 10 }}>
                <Text style={styles.modalSubtitle}>{t('love.sheSaidYesKindOf')}</Text>

                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    {t('love.emotionalWaiting')}
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{t('love.doYouWantToAsk')}</Text>
                    {"\n"}
                    {t('love.protectsAssets')}
                </Text>

                <Pressable
                    style={[styles.actionButton, styles.choiceRow, { backgroundColor: theme.colors.surfaceHigh }]}
                    onPress={() => onDecidePrenup(true)}>
                    <MaterialCommunityIcons
                        name="file-document-edit-outline" size={20}
                        color={theme.colors.textPrimary}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>{t('love.signPrenup')}</Text>
                        <Text style={styles.choiceNote}>{t('love.signPrenupDesc')}</Text>
                    </View>
                </Pressable>

                <Pressable
                    style={[styles.actionButton, styles.choiceRow, { backgroundColor: theme.colors.accent }]}
                    onPress={() => onDecidePrenup(false)}>
                    <MaterialCommunityIcons
                        name="hand-heart-outline" size={20}
                        color={theme.colors.onLight}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.actionButtonText, { color: theme.colors.onLight, fontWeight: '700' }]}>
                            {t('love.noPrenup')}
                        </Text>
                        <Text style={[styles.choiceNote, { color: theme.colors.onLight, opacity: 0.75 }]}>
                            {t('love.noPrenupDesc')}
                        </Text>
                    </View>
                </Pressable>

                <Pressable style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>{t('love.cancelProposal')}</Text>
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
                            <MaterialCommunityIcons
                                name="ring" size={20} color={theme.colors.textMuted}
                            />
                            <View>
                                <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>{ring.name}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    Value: ${(ring.marketValue ?? ring.price).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        {ring.instanceId === selectedRingInstanceId && (
                            <MaterialCommunityIcons
                                name="check" size={18} color={theme.colors.primary}
                            />
                        )}
                    </Pressable>
                ))}
                <Pressable style={styles.cancelButton} onPress={() => onSetIsPickingRing(false)}>
                    <Text style={styles.cancelButtonText}>{t('love.backToProposal')}</Text>
                </Pressable>
            </View>
        );
    }

    // STEP 1: PICKER (Default)
    return (
        <View style={{ gap: 16 }}>
            <Text style={styles.modalSubtitle}>{t('love.planProposal')}</Text>

            <Text style={styles.modalSubtitle}>{t('love.where')}</Text>
            <ScrollView style={styles.venueList} nestedScrollEnabled>
                {PROPOSAL_LOCATIONS.map((place, index) => {
                    const affordable = money >= place.cost;
                    const chosen = index === selectedLocationIndex;
                    return (
                        <Pressable
                            key={place.id}
                            disabled={!affordable}
                            onPress={() => onPickLocation(index)}
                            style={[
                                styles.venueRow,
                                chosen && styles.venueRowChosen,
                                !affordable && styles.venueRowOff,
                            ]}>
                            <MaterialCommunityIcons
                                name={place.icon}
                                size={19}
                                color={chosen ? theme.colors.primary : theme.colors.textMuted}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.venueName} numberOfLines={1}>{place.name}</Text>
                                <Text style={styles.venueMeta}>
                                    {place.cost === 0 ? t('love.costsNothing') : `$${place.cost.toLocaleString()}`}
                                    {place.bonus > 0 ? `   ·   ${t('love.sheSaysYes', { bonus: String(place.bonus) })}` : ''}
                                </Text>
                            </View>
                            {chosen && (
                                <MaterialCommunityIcons
                                    name="check" size={17} color={theme.colors.primary}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Ring Check */}
            <View style={[styles.actionButton, {
                justifyContent: 'space-between',
                backgroundColor: ownedRings.length > 0 ? 'rgba(207,208,210,0.1)' : 'rgba(5,168,246,0.1)',
            }]}>
                {ownedRings.length === 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons
                            name="ring" size={18} color={theme.colors.textMuted}
                        />
                        <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                            {t('love.noRing')}
                        </Text>
                    </View>
                ) : (
                    <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                        onPress={() => onSetIsPickingRing(true)}
                    >
                        <MaterialCommunityIcons
                            name="ring" size={18} color={theme.colors.textMuted}
                        />
                        <View>
                            <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>
                                {selectedRing?.name ?? t('love.ringSelected')}
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
                    { backgroundColor: theme.colors.accent, marginTop: 8, opacity: (canAfford && ownedRings.length > 0) ? 1 : 0.5, justifyContent: 'center' }
                ]}
                onPress={onStartProposal}>
                <Text style={[styles.actionButtonText, { color: theme.colors.onLight, fontWeight: '800', letterSpacing: 1, textAlign: 'center' }]}>{t('love.propose2')}</Text>
            </Pressable>

            {/* Close Button */}
            <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('love.cancel')}</Text>
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
    // ----------------------------------------------------------------------
    //  THE VENUE LIST
    // ----------------------------------------------------------------------
    //  Capped in height rather than allowed to run: twelve rows would push the
    //  ring and the propose button off a phone, and the two of them are what
    //  the screen is FOR. The list scrolls inside its own box.
    //
    //  SHELVED with the carousel: locationPicker, arrowButton, arrowText,
    //  locationInfo, locationName, locationCost, locationBonus.
    // ----------------------------------------------------------------------
    venueList: { maxHeight: 218 },
    venueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        paddingHorizontal: 11,
        borderRadius: 10,
        marginBottom: 5,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    venueRowChosen: {
        backgroundColor: theme.colors.surfaceHigh,
        borderColor: theme.colors.primary,
    },
    // Dimmed by the surface. Nothing here is a profit or a loss.
    venueRowOff: { opacity: 0.42 },
    venueName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
    venueMeta: { color: theme.colors.textSecondary, fontSize: 11.5, marginTop: 2 },

    resultBadge: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceHigh,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    choiceRow: { justifyContent: 'flex-start', gap: 12 },
    choiceNote: { color: theme.colors.textSecondary, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
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
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
});
