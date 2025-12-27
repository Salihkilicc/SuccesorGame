import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../../theme'; // Adjust path
import { AcquisitionTarget } from '../../../data/AcquisitionData';
import { useStatsStore } from '../../../store/useStatsStore';

type Props = {
    visible: boolean;
    onClose: () => void;
    company: AcquisitionTarget | null;
    onSuccess: () => void;
};

// Helpers
const formatMoney = (val: number) => `$${(val / 1e9).toFixed(2)}B`;

const NegotiationModal = ({ visible, onClose, company, onSuccess }: Props) => {
    const { companyCapital, shareholders, reputation, addAcquisition, setField } = useStatsStore();

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
            Alert.alert('Invalid Offer', 'Please enter a valid amount.');
            return;
        }

        if (offer > companyCapital) {
            Alert.alert('Insufficient Funds', 'You do not have enough capital for this offer. Consider borrowing first.');
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
                    rejectReason = 'The Board feels this deal is too risky based on current synergy and your standing.';
                }
            }

            if (!boardApproved) {
                setStatus('rejected');
                setStatusMessage(`BOARD VETOED: ${rejectReason}`);
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
                    setStatusMessage(`They insist on the full premium ($${(askingPrice / 1e9).toFixed(2)}B). "Our growth justifies the price."`);
                } else {
                    // Accepted!
                    setStatus('accepted');
                    setStatusMessage('Deal Closed! Transferring assets...'); // ... rest same                 // Finalize after short delay
                    setTimeout(() => {
                        setField('companyCapital', companyCapital - offer);
                        addAcquisition(company.id);
                        onSuccess();
                    }, 1500);
                }

            }, 2000); // Negotiating delay

        }, 2000); // Board voting delay
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Deal Room: {company.name}</Text>
                        <Pressable onPress={onClose}><Text style={styles.closeText}>Cancel</Text></Pressable>
                    </View>

                    {status === 'initial' && (
                        <View style={styles.content}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Valuation (Market Cap)</Text>
                                <Text style={styles.value}>{formatMoney(company.marketCap)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Asking Price (Inc. Premium)</Text>
                                <Text style={[styles.value, { color: theme.colors.accent }]}>{formatMoney(askingPrice)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.inputLabel}>Your Offer ($ Billions)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 52.5"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={offerAmount}
                                onChangeText={setOfferAmount}
                            />

                            <Text style={styles.hint}>
                                Cash Available: {formatMoney(companyCapital)}
                            </Text>

                            <Pressable
                                onPress={handleSubmitOffer}
                                style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
                            >
                                <Text style={styles.submitBtnText}>Submit Offer to Board</Text>
                            </Pressable>
                        </View>
                    )}

                    {status === 'board_voting' && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.statusTitle}>Board Voting...</Text>
                            <Text style={styles.statusDesc}>
                                {isMajorityOwner ? "You have majority control. Rubber stamping..." : "Seeking shareholder approval..."}
                            </Text>
                        </View>
                    )}

                    {status === 'negotiating' && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={theme.colors.accent} />
                            <Text style={styles.statusTitle}>Negotiating...</Text>
                            <Text style={styles.statusDesc}>Offer sent to {company.name} board.</Text>
                        </View>
                    )}

                    {status === 'rejected' && (
                        <View style={styles.centerContent}>
                            <Text style={styles.icon}>❌</Text>
                            <Text style={[styles.statusTitle, { color: theme.colors.danger }]}>Offer Failed</Text>
                            <Text style={styles.statusDesc}>{statusMessage}</Text>
                            <Pressable onPress={() => setStatus('initial')} style={styles.retryBtn}>
                                <Text style={styles.retryText}>Adjust Offer</Text>
                            </Pressable>
                        </View>
                    )}

                    {status === 'accepted' && (
                        <View style={styles.centerContent}>
                            <Text style={styles.icon}>🤝</Text>
                            <Text style={[styles.statusTitle, { color: theme.colors.success }]}>OFFER ACCEPTED</Text>
                            <Text style={styles.statusDesc}>{statusMessage}</Text>
                        </View>
                    )}

                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default NegotiationModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 24,
        minHeight: 350,
        gap: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    closeText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    content: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.cardSoft,
        padding: 16,
        borderRadius: 12,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    value: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 8,
    },
    inputLabel: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
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
    submitBtn: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnPressed: {
        opacity: 0.9,
    },
    submitBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
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
    retryBtn: {
        backgroundColor: theme.colors.cardSoft,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        marginTop: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    retryText: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
});
