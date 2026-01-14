import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    TextInput,
} from 'react-native';
import { theme } from '../../../core/theme';
import { Shareholder } from '../../../core/store/useStatsStore';
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useNegotiationLogic } from '../../../features/shareholders/hooks/useNegotiationLogic';

interface Props {
    visible: boolean;
    shareholder: Shareholder;
    onClose: () => void;
}

const ShareNegotiationModal = ({ visible, shareholder, onClose }: Props) => {

    // Connect Logic Hook
    const {
        transactionType,
        setTransactionType,
        quantity,
        setQuantity,
        offerPrice,
        setOfferPrice,
        result,
        maxQuantity,
        currentTotal,
        npcOfferPrice,
        handleAction,
        handleRejectOffer,
        handleClose
    } = useNegotiationLogic(visible, shareholder, onClose);

    const { companySharePrice } = require('../../../core/store/useStatsStore').useStatsStore(); // Required for display hint

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                {result !== 'pending' ? (
                    <View style={[styles.content, styles.resultContent, result === 'success' ? styles.successBorder : styles.failBorder]}>
                        <Text style={styles.resultEmoji}>{result === 'success' ? '✅' : '❌'}</Text>
                        <Text style={styles.resultTitle}>
                            {result === 'success' ? 'Deal Reached!' : 'Offer Rejected!'}
                        </Text>
                        <Text style={styles.resultMessage}>
                            {result === 'success'
                                ? "Share transfer completed."
                                : transactionType === 'buy'
                                    ? "They didn't like your price."
                                    : "They were a bit offended by your rejection."}
                        </Text>
                        <Pressable style={styles.closeBtn} onPress={handleClose}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Text style={styles.title}>Share Negotiation</Text>

                        {/* Tabs */}
                        <View style={styles.tabs}>
                            <Pressable
                                onPress={() => setTransactionType('buy')}
                                style={[styles.tab, transactionType === 'buy' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'buy' && styles.activeTabText]}>BUY</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setTransactionType('sell')}
                                style={[styles.tab, transactionType === 'sell' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'sell' && styles.activeTabText]}>SELL</Text>
                            </Pressable>
                        </View>

                        {/* YENİ Quantity Seçici (Slider Yerine) */}
                        <View style={styles.section}>
                            <PercentageSelector
                                label="Quantity (Lots)"
                                value={quantity}
                                min={1}
                                max={Math.max(1, maxQuantity)}
                                onChange={setQuantity}
                                unit="lot"
                            />
                            <Text style={styles.hint}>Total Impact: %{(quantity * 0.1).toFixed(1)} Share</Text>
                        </View>

                        {/* Fiyat Kartları */}
                        {transactionType === 'buy' ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Your Offer (Per Share)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={offerPrice}
                                    onChangeText={setOfferPrice}
                                    keyboardType="numeric"
                                    placeholder="Price"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                                <View style={styles.marketRef}>
                                    <Text style={styles.hint}>Market: ${companySharePrice.toFixed(0)}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.npcOfferCard}>
                                <Text style={styles.npcOfferLabel}>THEIR OFFER (Market +20%)</Text>
                                <Text style={styles.npcOfferValue}>${npcOfferPrice.toFixed(0)} <Text style={styles.perShare}>/share</Text></Text>
                                <Text style={styles.npcOfferContext}>
                                    "I'm offering ${npcOfferPrice.toFixed(0)} per share for your lots. Take it or leave it."
                                </Text>
                            </View>
                        )}

                        {/* Toplam Tutar */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>${currentTotal.toLocaleString()}</Text>
                        </View>

                        {/* Butonlar */}
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
                                    {transactionType === 'buy' ? 'Submit Offer' : 'Accept & Sell'}
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
        zIndex: 9999,
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
    label: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    hint: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
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