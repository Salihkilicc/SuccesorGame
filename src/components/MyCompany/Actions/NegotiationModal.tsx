// @orphan-ok negotiation was folded into AcquisitionModal (see its negotiationCard)
// Kept deliberately: nothing renders this, and it is not meant to be.
import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../../core/theme'; // Adjust path
import { AcquisitionTarget } from '../../../data/AcquisitionData';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';
import { formatMoney as formatMoneyExact } from '../../../core/utils';

type Props = {
    visible: boolean;
    onClose: () => void;
    company: AcquisitionTarget | null;
    onSuccess: () => void;
};

// Helpers
const formatMoney = (val: number) => {
    return formatMoneyExact(val);
};

const NegotiationModal = ({ visible, onClose, company, onSuccess }: Props) => {
    useLocale();
    const { companyCapital, shareholders, setField } = useStatsStore();
    const { reputation: playerRep } = usePlayerStore();
    const reputation = playerRep.business;

    // States
    const [offerAmount, setOfferAmount] = useState('');
    const [status, setStatus] = useState<'initial' | 'board_voting' | 'negotiating' | 'rejected' | 'accepted'>('initial');
    const [statusMessage, setStatusMessage] = useState('');

    // Derived values
    const askingPrice = company ? company.marketCap * company.acquisitionPremium : 0;
    const playerStake = shareholders.find(s => s.type === 'player')?.percentage || 0;
    const isMajorityOwner = playerStake > 50;

    useEffect(() => {
        if (visible) {
            setStatus('initial');
            setOfferAmount('');
            setStatusMessage('');
        }
    }, [visible]);

    if (!company) return null;

    const handleSubmitOffer = () => {
        const offer = parseFloat(offerAmount) * 1_000_000_000;

        if (isNaN(offer) || offer <= 0) {
            Alert.alert(t('alert.invalidOffer'), t('alert.pleaseEnterAValidAmount'));
            return;
        }

        if (offer > companyCapital) {
            Alert.alert(t('alert.insufficientFunds'), t('alert.youDoNotHaveEnough'));
            return;
        }

        // 1. Board Approval Step
        setStatus('board_voting'); // Show spinner/UI

        setTimeout(() => {
            let boardApproved = false;
            let rejectReason = '';

            if (isMajorityOwner) {
                boardApproved = true;
            } else {
                // Determine Vote Logic
                // Base chance 50%
                // + Reputation (0-100 mapped to 0-30%)
                // + Synergy (>80 +20%, <40 -20%)

                let approvalChance = 50;
                approvalChance += Math.min(30, reputation * 0.3); // max +30

                if (company.synergyScore > 80) approvalChance += 25;
                else if (company.synergyScore < 40) approvalChance -= 25;

                // Hostile Sentiment penalty
                if (company.boardSentiment === 'Hostile') approvalChance -= 30;
                if (company.boardSentiment === 'Supportive') approvalChance += 10;

                const roll = Math.random() * 100;
                boardApproved = roll < approvalChance;

                if (!boardApproved) {
                    rejectReason = t('neg.tooRisky');
                }
            }

            if (!boardApproved) {
                setStatus('rejected');
                setStatusMessage(t('neg.boardVetoed', { v1: rejectReason }));
                return;
            }

            // 2. Target Response Step
            setStatus('negotiating');

            setTimeout(() => {
                // Logic: 
                // Lowball: < MarketCap -> Offended (Reject) because paying less than market value is rare without leverage
                // Reasonable: MarketCap to Cost -> "Push harder" (Haggle)
                // Good: >= Cost -> Accept

                if (offer < company.marketCap) {
                    setStatus('rejected');
                    setStatusMessage(`"${company.name}" board is offended! You offered less than their Market Cap.`);
                } else if (offer < askingPrice && Math.random() > 0.4) {
                    // 60% chance they insist on asking price/premium if under it
                    setStatus('rejected');
                    setStatusMessage(t('neg.insistFullPremium', { v1: formatMoney(askingPrice) }));
                } else {
                    // Accepted!
                    setStatus('accepted');
                    setStatusMessage(t('neg.dealClosedTransfer')); // ... rest same                 // Finalize after short delay
                    setTimeout(() => {
                        // TEK KAPI. Once burasi parayi elle dusup kaydi
                        // statsStore.acquisitions'a yaziyordu; motor oraya
                        // BAKMADIGI icin pazarlikla alinan sirketin pazar
                        // payi gecmiyor, kari EBIT'e girmiyor, entegrasyon
                        // ve sinerji hic islemiyordu. Yani pazarlik ekrani
                        // sonucu olmayan bir animasyondu.
                        const result = useCorporateFinanceStore.getState().executeAcquisition({
                            target: {
                                id: company.id,
                                name: company.name,
                                marketCap: company.marketCap,
                                risk: company.risk,
                                category: company.category,
                                acquisitionBuff: company.acquisitionBuff,
                            },
                            hostile: false,
                            financing: 'cash',
                            negotiatedPrice: offer,
                        });

                        if (!result.success) {
                            setStatus('rejected');
                            setStatusMessage(result.message);
                            return;
                        }
                        onSuccess();
                    }, 1500);
                }

            }, 2000); // Negotiating delay

        }, 2000); // Board voting delay
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title={t('neg.dealRoom', { v1: company.name })}
            subtitle={t('action.negotiateAcquisition')}
        >
            <View style={{ minHeight: 350 }}>
                {status === 'initial' && (
                    <View style={styles.content}>
                        <SectionCard
                            title={t('action.valuationMarketCap')}
                            rightText={formatMoney(company.marketCap)}
                        />
                        <SectionCard
                            title={t('action.askingPriceIncPremium')}
                            rightText={formatMoney(askingPrice)}
                            style={{ borderColor: theme.colors.accent }}
                        />

                        <View style={styles.divider} />

                        <Text style={styles.inputLabel}>{t('action.yourOfferBillions')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 52.5"
                            placeholderTextColor="#1A0A4A"
                            keyboardType="numeric"
                            value={offerAmount}
                            onChangeText={setOfferAmount}
                        />

                        <Text style={styles.hint}>{t('action.cashAvailableV1', { v1: formatMoney(companyCapital) })}</Text>

                        <GameButton
                            title={t('action.submitOfferToBoard')}
                            onPress={handleSubmitOffer}
                            style={{ marginTop: 8 }}
                        />
                    </View>
                )}

                {status === 'board_voting' && (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.statusTitle}>{t('action.boardVoting')}</Text>
                        <Text style={styles.statusDesc}>
                            {isMajorityOwner ? t('neg.rubberStamp') : t('neg.seekingApproval')}
                        </Text>
                    </View>
                )}

                {status === 'negotiating' && (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.colors.accent} />
                        <Text style={styles.statusTitle}>{t('action.negotiating')}</Text>
                        <Text style={styles.statusDesc}>{t('action.offerSentToV1Board', { v1: company.name })}</Text>
                    </View>
                )}

                {status === 'rejected' && (
                    <View style={styles.centerContent}>
                        <Text style={styles.icon}>❌</Text>
                        <Text style={[styles.statusTitle, { color: theme.colors.danger }]}>{t('action.offerFailed')}</Text>
                        <Text style={styles.statusDesc}>{statusMessage}</Text>

                        <GameButton
                            title={t('action.adjustOffer')}
                            onPress={() => setStatus('initial')}
                            variant="secondary"
                            style={{ marginTop: 16, width: '100%' }}
                        />
                    </View>
                )}

                {status === 'accepted' && (
                    <View style={styles.centerContent}>
                        <Text style={styles.icon}>🤝</Text>
                        <Text style={[styles.statusTitle, { color: theme.colors.success }]}>{t('action.offerAccepted')}</Text>
                        <Text style={styles.statusDesc}>{statusMessage}</Text>
                    </View>
                )}
            </View>
        </GameModal>
    );
};

export default NegotiationModal;

const styles = StyleSheet.create({
    content: {
        gap: 12,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
    },
    inputLabel: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
        marginBottom: 4,
    },
    input: {
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        padding: 16,
        borderRadius: 12,
        fontSize: 18,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    hint: {
        color: theme.colors.textMuted,
        fontSize: 12,
        textAlign: 'right',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    statusDesc: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
});
