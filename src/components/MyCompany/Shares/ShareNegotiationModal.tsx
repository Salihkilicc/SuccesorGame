import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../theme';
import { useStatsStore, Shareholder } from '../../../store/useStatsStore';

interface Props {
    visible: boolean;
    shareholder: Shareholder;
    onClose: () => void;
}

type TransactionType = 'buy' | 'sell';
type NegotiationResult = 'pending' | 'success' | 'fail';

const ShareNegotiationModal = ({ visible, shareholder, onClose }: Props) => {
    const {
        companySharePrice,
        money,
        shareholders,
        setField,
        setShareholders,
        updateShareholderRelationship,
    } = useStatsStore();

    const [transactionType, setTransactionType] = useState<TransactionType>('buy');
    const [quantity, setQuantity] = useState(1);
    const [offerPrice, setOfferPrice] = useState(companySharePrice.toString());
    const [result, setResult] = useState<NegotiationResult>('pending');

    // Sell Mode: NPC offers Premium (Market + 20%)
    const npcOfferPrice = companySharePrice * 1.2;

    const relationship = shareholder.relationship || 50;
    const maxQuantity = transactionType === 'buy'
        ? Math.floor(shareholder.percentage * 10) // Approx mapping: 0.1% per lot
        : 10; // Cap sell to 10 lots for gameplay balance

    useEffect(() => {
        // Reset when valid
        if (visible) {
            setResult('pending');
            setOfferPrice(companySharePrice.toString());
            setQuantity(1);
        }
    }, [visible, companySharePrice]);

    const handleAction = () => {
        const finalPrice = transactionType === 'buy' ? parseFloat(offerPrice) : npcOfferPrice;
        const totalValue = finalPrice * quantity;

        if (transactionType === 'buy') {
            // PLAYER WANTS TO BUY
            if (money < totalValue) {
                Alert.alert('Insufficient Funds', "You can't afford this transaction.");
                return;
            }

            // Logic: Does NPC accept?
            const priceRatio = finalPrice / companySharePrice;
            let success = false;

            if (relationship > 80) success = priceRatio >= 0.9;
            else if (relationship < 30) success = priceRatio > 1.2;
            else success = priceRatio >= 1.0 || (Math.random() > 0.5 && priceRatio > 0.95);

            if (success) {
                commitTransaction('buy', finalPrice, totalValue);
            } else {
                setResult('fail');
                updateShareholderRelationship(shareholder.id, -2);
            }

        } else {
            // PLAYER SELLS (Accepts NPC Offer)
            commitTransaction('sell', finalPrice, totalValue);
        }
    };

    const handleRejectOffer = () => {
        // Player rejects NPC offer
        setResult('fail');
        updateShareholderRelationship(shareholder.id, -5); // Insulted
    };

    const commitTransaction = (type: TransactionType, price: number, total: number) => {
        const pctChange = quantity * 0.1;

        if (type === 'buy') {
            setField('money', money - total);
        } else {
            setField('money', money + total);
        }

        const newShareholders = shareholders.map(sh => {
            if (sh.id === shareholder.id) {
                return {
                    ...sh,
                    percentage: type === 'buy'
                        ? Math.max(0, sh.percentage - pctChange)
                        : sh.percentage + pctChange
                };
            }
            if (sh.id === 'player') {
                return {
                    ...sh,
                    percentage: type === 'buy'
                        ? sh.percentage + pctChange
                        : Math.max(0, sh.percentage - pctChange)
                };
            }
            return sh;
        });

        setShareholders(newShareholders);

        // Update player ownership stat
        const player = newShareholders.find(s => s.id === 'player');
        if (player) setField('companyOwnership', player.percentage);

        updateShareholderRelationship(shareholder.id, 2);
        setResult('success');
    };

    const handleClose = () => {
        onClose();
    };

    const currentTotal = (transactionType === 'buy' ? parseFloat(offerPrice) : npcOfferPrice) * quantity || 0;

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                {result !== 'pending' ? (
                    <View style={[styles.content, styles.resultContent, result === 'success' ? styles.successBorder : styles.failBorder]}>
                        <Text style={styles.resultEmoji}>{result === 'success' ? '✅' : '❌'}</Text>
                        <Text style={styles.resultTitle}>
                            {result === 'success' ? 'Deal Sealed!' : 'Offer Rejected!'}
                        </Text>
                        <Text style={styles.resultMessage}>
                            {result === 'success'
                                ? "Ownership has been updated."
                                : transactionType === 'buy'
                                    ? "They refused your price."
                                    : "They felt insulted by your rejection."}
                        </Text>
                        <Pressable style={styles.closeBtn} onPress={handleClose}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Text style={styles.title}>Negotiate Shares</Text>

                        {/* Tabs */}
                        <View style={styles.tabs}>
                            <Pressable
                                onPress={() => setTransactionType('buy')}
                                style={[styles.tab, transactionType === 'buy' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'buy' && styles.activeTabText]}>BUY SHARES</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setTransactionType('sell')}
                                style={[styles.tab, transactionType === 'sell' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'sell' && styles.activeTabText]}>SELL SHARES</Text>
                            </Pressable>
                        </View>

                        {/* Quantity */}
                        <View style={styles.section}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quantity (Lots)</Text>
                                <Text style={styles.valueHighlight}>{quantity}</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={1}
                                maximumValue={Math.max(1, maxQuantity)} // Ensure at least 1
                                step={1}
                                value={quantity}
                                onValueChange={setQuantity}
                                minimumTrackTintColor={theme.colors.accent}
                                maximumTrackTintColor={theme.colors.cardSoft}
                                thumbTintColor={theme.colors.accent}
                            />
                            <Text style={styles.hint}>{(quantity * 0.1).toFixed(1)}% Ownership</Text>
                        </View>

                        {/* Conditional UI based on Buy/Sell */}
                        {transactionType === 'buy' ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Your Offer Price (per share)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={offerPrice}
                                    onChangeText={setOfferPrice}
                                    keyboardType="numeric"
                                    placeholder="Price"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                                <View style={styles.marketRef}>
                                    <Text style={styles.hint}>Market Price: ${companySharePrice.toFixed(0)}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.npcOfferCard}>
                                <Text style={styles.npcOfferLabel}>THEIR OFFER (Premium +20%)</Text>
                                <Text style={styles.npcOfferValue}>${npcOfferPrice.toFixed(0)} <Text style={styles.perShare}>/share</Text></Text>
                                <Text style={styles.npcOfferContext}>
                                    "I offer ${npcOfferPrice.toFixed(0)} for your shares. Take it or leave it."
                                </Text>
                            </View>
                        )}

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Value</Text>
                            <Text style={styles.totalAmount}>${currentTotal.toLocaleString()}</Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {transactionType === 'sell' && (
                                <Pressable style={styles.rejectBtn} onPress={handleRejectOffer}>
                                    <Text style={styles.rejectText}>Reject</Text>
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.mainBtn, transactionType === 'sell' ? styles.acceptBtn : styles.submitBtn]}
                                onPress={handleAction}>
                                <Text style={styles.mainBtnText}>
                                    {transactionType === 'buy' ? 'Submit Offer' : 'Accept Offer'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        zIndex: 9999, // Root Level
        elevation: 10,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.md,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: theme.radius.sm,
    },
    activeTab: {
        backgroundColor: theme.colors.accent,
    },
    tabText: {
        fontWeight: '700',
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    activeTabText: {
        color: '#000',
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    valueHighlight: {
        color: theme.colors.accent,
        fontWeight: '800',
        fontSize: 16,
    },
    hint: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    input: {
        backgroundColor: theme.colors.cardSoft,
        padding: 12,
        borderRadius: theme.radius.md,
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: 8,
    },
    marketRef: {
        alignItems: 'flex-end',
    },
    npcOfferCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.success,
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    npcOfferLabel: {
        color: theme.colors.success,
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 8,
    },
    npcOfferValue: {
        color: theme.colors.textPrimary,
        fontSize: 32,
        fontWeight: '900',
    },
    perShare: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '400',
    },
    npcOfferContext: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.accent,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    rejectBtn: {
        flex: 1,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    rejectText: {
        color: theme.colors.danger,
        fontWeight: '700',
    },
    mainBtn: {
        flex: 2,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    submitBtn: {
        backgroundColor: theme.colors.accent,
    },
    acceptBtn: {
        backgroundColor: theme.colors.success,
    },
    mainBtnText: {
        color: '#000',
        fontWeight: '800',
    },
    // Result
    resultContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successBorder: {
        borderColor: theme.colors.success,
        borderWidth: 2,
    },
    failBorder: {
        borderColor: theme.colors.danger,
        borderWidth: 2,
    },
    resultEmoji: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    resultMessage: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    closeBtn: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    closeBtnText: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
});

export default ShareNegotiationModal;
