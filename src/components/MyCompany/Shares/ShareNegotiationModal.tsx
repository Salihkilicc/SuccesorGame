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
import { theme } from '../../../theme';
import { useStatsStore, Shareholder } from '../../../store/useStatsStore';
import { PercentageSelector } from '../../atoms/PercentageSelector'; // Yeni Bileşen

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
    
    // 1 Lot = %0.1 Hisse
    const maxQuantity = transactionType === 'buy'
        ? Math.floor(shareholder.percentage * 10) // Hissedarın elindeki max lot
        : 10; // Oyuncunun satabileceği max lot (Oyun dengesi için 10 ile sınırlı)

    useEffect(() => {
        // Modal açıldığında state sıfırla
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
            // OYUNCU ALIYOR
            if (money < totalValue) {
                Alert.alert('Yetersiz Bakiye', "Bu işlem için yeterli nakitin yok.");
                return;
            }

            // NPC Kabul Ediyor mu?
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
            // OYUNCU SATIYOR (NPC Teklifini kabul et)
            commitTransaction('sell', finalPrice, totalValue);
        }
    };

    const handleRejectOffer = () => {
        // Oyuncu teklifi reddetti
        setResult('fail');
        updateShareholderRelationship(shareholder.id, -5); // NPC alındı
    };

    const commitTransaction = (type: TransactionType, price: number, total: number) => {
        const pctChange = quantity * 0.1; // Lot başına %0.1

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

        // Player ownership güncelle
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
                            {result === 'success' ? 'Anlaşma Sağlandı!' : 'Teklif Reddedildi!'}
                        </Text>
                        <Text style={styles.resultMessage}>
                            {result === 'success'
                                ? "Hisse devri tamamlandı."
                                : transactionType === 'buy'
                                    ? "Verdiğin fiyatı beğenmediler."
                                    : "Reddetmen onları biraz kırdı."}
                        </Text>
                        <Pressable style={styles.closeBtn} onPress={handleClose}>
                            <Text style={styles.closeBtnText}>Kapat</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Text style={styles.title}>Hisse Pazarlığı</Text>

                        {/* Tabs */}
                        <View style={styles.tabs}>
                            <Pressable
                                onPress={() => setTransactionType('buy')}
                                style={[styles.tab, transactionType === 'buy' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'buy' && styles.activeTabText]}>AL</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setTransactionType('sell')}
                                style={[styles.tab, transactionType === 'sell' && styles.activeTab]}>
                                <Text style={[styles.tabText, transactionType === 'sell' && styles.activeTabText]}>SAT</Text>
                            </Pressable>
                        </View>

                        {/* YENİ Quantity Seçici (Slider Yerine) */}
                        <View style={styles.section}>
                            <PercentageSelector
                                label="Miktar (Lot)"
                                value={quantity}
                                min={1}
                                max={Math.max(1, maxQuantity)}
                                onChange={setQuantity}
                                unit="lot"
                            />
                            <Text style={styles.hint}>Toplam Etki: %{(quantity * 0.1).toFixed(1)} Hisse</Text>
                        </View>

                        {/* Fiyat Kartları */}
                        {transactionType === 'buy' ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Teklifin (Hisse Başı)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={offerPrice}
                                    onChangeText={setOfferPrice}
                                    keyboardType="numeric"
                                    placeholder="Fiyat"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                                <View style={styles.marketRef}>
                                    <Text style={styles.hint}>Piyasa: ${companySharePrice.toFixed(0)}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.npcOfferCard}>
                                <Text style={styles.npcOfferLabel}>ONLARIN TEKLİFİ (Piyasa +%20)</Text>
                                <Text style={styles.npcOfferValue}>${npcOfferPrice.toFixed(0)} <Text style={styles.perShare}>/adet</Text></Text>
                                <Text style={styles.npcOfferContext}>
                                    "Senin lotların için adet başı ${npcOfferPrice.toFixed(0)} veriyorum. İşine gelirse."
                                </Text>
                            </View>
                        )}

                        {/* Toplam Tutar */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Toplam Tutar</Text>
                            <Text style={styles.totalAmount}>${currentTotal.toLocaleString()}</Text>
                        </View>

                        {/* Butonlar */}
                        <View style={styles.actions}>
                            {transactionType === 'sell' && (
                                <Pressable style={styles.rejectBtn} onPress={handleRejectOffer}>
                                    <Text style={styles.rejectText}>Reddet</Text>
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.mainBtn, transactionType === 'sell' ? styles.acceptBtn : styles.submitBtn]}
                                onPress={handleAction}>
                                <Text style={styles.mainBtnText}>
                                    {transactionType === 'buy' ? 'Teklifi Sun' : 'Kabul Et & Sat'}
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