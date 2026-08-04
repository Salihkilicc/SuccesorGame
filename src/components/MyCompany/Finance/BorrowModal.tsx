import {
    COVENANT_MAX_LEVERAGE,
    EXTENDED_LOAN_PRODUCTS,
    LOAN_PRODUCTS,
    LoanKind,
    productRate,
    ratingAtLeast,
    serviceLoanQuarter,
} from '../../../core/market/credit';
import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney } from '../../../core/utils';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const BorrowModal = ({ visible, onClose }: Props) => {
    // Dil degisince yeniden ciz. Bu satir olmadan ekran eski dilde donar.
    useLocale();
    const navigation = useNavigation<any>();
    const { companyValue, companyCapital, update } = useStatsStore();
    const { takeLoan, getAssessment, getDistress, getCollateral, getMezzanine } = useCorporateFinanceStore();
    const isPublic = useStatsStore(st => st.isPublic);

    const [amount, setAmount] = useState(1_000_000);
    const [selectedType, setSelectedType] = useState<LoanKind>('term');
    const [error, setError] = useState('');

    // ------------------------------------------------------------------
    //  ONCE BURADA UC AYRI UYDURMA SAYI VARDI:
    //    - kredi skoru (olu sistem, herkes 850 aliyordu)
    //    - kapasite DEGERLEMEDEN turetiliyordu (banka kazanca borc verir)
    //    - faizler elle yaziliydi: tahvil "not-2", tefeci sabit %40
    //  Ucu de motorun gercekten kullandigi sayilar DEGILDI. Artik ekran
    //  motorun okudugu ayni degerlendirmeyi okuyor.
    // ------------------------------------------------------------------
    const assessment = getAssessment();
    const distress = getDistress();
    const borrowingCapacity = assessment.headroom;

    /** Bir kredi turunun gercek yillik orani ve alinabilirligi. */
    const productInfo = (kind: LoanKind) => {
        const product =
            [...LOAN_PRODUCTS, ...EXTENDED_LOAN_PRODUCTS].find(pr => pr.kind === kind) ??
            LOAN_PRODUCTS[1];
        const rate = productRate(product, assessment) * 100;
        let locked = '';
        if (product.requiresPublic && !isPublic) locked = t('bank.publicOnly');
        else if (product.minRating && !ratingAtLeast(assessment.rating, product.minRating)) {
            locked = t('bank.needsRating', { rating: product.minRating });
        }
        return { product, rate, locked };
    };

    const term = productInfo('term');
    const bond = productInfo('bond');
    const shark = productInfo('shark');
    const secured = productInfo('secured');
    const mezz = productInfo('mezzanine');

    // Her katmanin KENDI kapasitesi var — tek bir sayi degil.
    const collateral = getCollateral();
    const mezzQuote = getMezzanine(amount);
    const tierHeadroom =
        selectedType === 'secured' ? collateral.headroom
        : selectedType === 'mezzanine' ? mezzQuote.maxAmount
        : borrowingCapacity;
    const selected = productInfo(selectedType);
    const currentRate = selected.rate;

    // Gercek CEYREKLIK taksit — motorun kullandigi amortisman fonksiyonu.
    // Eskiden 12 aylik hayali bir vade uzerinden aylik odeme gosteriyordu;
    // oyun ceyreklik isliyor ve vadeler 8-40 ceyrek arasinda.
    const preview = serviceLoanQuarter({
        id: 'preview',
        kind: selected.product.kind,
        name: selected.product.name,
        principal: amount,
        balance: amount,
        rate: currentRate / 100,
        quartersRemaining: selected.product.termQuarters,
        termQuarters: selected.product.termQuarters,
        prepaymentPenalty: selected.product.prepaymentPenalty,
        delinquent: false,
    });

    const handleConfirm = () => {
        const result = takeLoan(
            amount,
            companyValue,
            selectedType,
            currentRate,
            (cashToAdd) => {
                update({ companyCapital: companyCapital + cashToAdd });
            }
        );

        if (result.success) {
            setError('');
            onClose();
        } else {
            // Reddi ekranda GOSTER. Once yalnizca konsola yaziliyordu, yani
            // oyuncu dugmeye basiyor ve hicbir sey olmuyordu.
            setError(result.message || t('bank.declined'));
        }
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    // Reset amount when modal opens
    useEffect(() => {
        if (visible) {
            setAmount(Math.min(1_000_000, borrowingCapacity));
        }
    }, [visible, borrowingCapacity]);

    const safeMax = Math.max(1_000_000, tierHeadroom);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                {/* ------------------------------------------------------------
                    KAYDIRMA — bu ekran iki kredi katmani ve aciklamalarla
                    buyudu, sabit yukseklikli bir View'da kaliyordu. Icerik
                    ekrandan tasinca ne kaydirilabiliyor ne de alttaki iptal
                    dugmesine ulasilabiliyordu: modal kapanmiyordu.

                    Cozum iki parcali: govde ScrollView, kapatma dugmesi ise
                    govdenin DISINDA sabit. Boylece icerik ne kadar buyurse
                    buyusun cikis her zaman erisilebilir kalir.
                   ------------------------------------------------------------ */}
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.centeredView} pointerEvents="box-none">
                    <View style={styles.container}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{t('bank.borrow.title')}</Text>
                            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                                <Text style={styles.closeText}>✕</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.subtitle}>
                            {assessment.rating} • {assessment.leverage === Infinity ? '∞' : assessment.leverage.toFixed(1)}x leverage
                            {' • '}
                            {borrowingCapacity > 0 ? `${formatMoney(borrowingCapacity)} available` : 'No capacity'}
                        </Text>

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator
                        >

                        {/* Loan Type Selection */}
                        <View style={styles.typeSelector}>
                            <Pressable
                                style={[styles.typeButton, selectedType === 'term' && styles.typeButtonActive, !!term.locked && styles.typeButtonLocked]}
                                onPress={() => setSelectedType('term')}
                            >
                                <Text style={styles.typeEmoji}>🏛️</Text>
                                <Text style={[styles.typeLabel, selectedType === 'term' && styles.typeLabelActive]}>
                                    {t('bank.type.term')}
                                </Text>
                                <Text style={[styles.typeRate, null]}>
                                    {term.locked || `${term.rate.toFixed(1)}%`}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, selectedType === 'bond' && styles.typeButtonActive, !!bond.locked && styles.typeButtonLocked]}
                                onPress={() => setSelectedType('bond')}
                            >
                                <Text style={styles.typeEmoji}>📜</Text>
                                <Text style={[styles.typeLabel, selectedType === 'bond' && styles.typeLabelActive]}>
                                    {t('bank.type.bond')}
                                </Text>
                                <Text style={[styles.typeRate, null]}>
                                    {bond.locked || `${bond.rate.toFixed(1)}%`}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, selectedType === 'shark' && styles.typeButtonActive, !!shark.locked && styles.typeButtonLocked]}
                                onPress={() => setSelectedType('shark')}
                            >
                                <Text style={styles.typeEmoji}>🦈</Text>
                                <Text style={[styles.typeLabel, selectedType === 'shark' && styles.typeLabelActive]}>
                                    {t('bank.type.shark')}
                                </Text>
                                <Text style={[styles.typeRate, { color: '#FF6B6B' }]}>
                                    {shark.locked || `${shark.rate.toFixed(1)}%`}
                                </Text>
                            </Pressable>
                        </View>

                        {/* KATMAN 2 VE 3 — kazanc yetmedigi zaman */}
                        <View style={styles.typeSelector}>
                            <Pressable
                                style={[styles.typeButton, selectedType === 'secured' && styles.typeButtonActive]}
                                onPress={() => setSelectedType('secured')}
                            >
                                <Text style={styles.typeEmoji}>🏭</Text>
                                <Text style={[styles.typeLabel, selectedType === 'secured' && styles.typeLabelActive]}>
                                    {t('bank.type.secured')}
                                </Text>
                                <Text style={styles.typeRate}>{secured.rate.toFixed(1)}%</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, selectedType === 'mezzanine' && styles.typeButtonActive]}
                                onPress={() => setSelectedType('mezzanine')}
                            >
                                <Text style={styles.typeEmoji}>⚖️</Text>
                                <Text style={[styles.typeLabel, selectedType === 'mezzanine' && styles.typeLabelActive]}>
                                    {t('bank.type.mezzanine')}
                                </Text>
                                <Text style={[styles.typeRate, { color: '#FFB020' }]}>{mezz.rate.toFixed(1)}%</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.tierNote}>
                            {selectedType === 'secured'
                                ? t('bank.tierSecured', { amount: formatMoney(collateral.headroom) })
                                : selectedType === 'mezzanine'
                                    ? `${formatMoney(mezzQuote.maxAmount)} — ${mezzQuote.warning}`
                                    : t('bank.tierEarnings', { amount: formatMoney(borrowingCapacity) })}
                        </Text>

                        {selectedType === 'mezzanine' && amount > 0 && (
                            <Text style={styles.warningText}>
                                ⚖️ If unpaid, this becomes {mezzQuote.dilutionPercent.toFixed(1)}% of your company
                                {mezzQuote.costsBoardSeat ? ' — and a board seat.' : '.'}
                            </Text>
                        )}

                        {/* Amount Selector */}
                        <View style={styles.sliderContainer}>
                            <PercentageSelector
                                label={t('finance.loanAmount')}
                                value={amount}
                                min={1_000_000}
                                max={safeMax}
                                onChange={setAmount}
                                unit="$"
                            />
                        </View>

                        {/* Bu kredinin NE OLDUGU. Once hicbir tur kendini
                            anlatmiyordu; oyuncu "bonds falan hic degismiyor,
                            arayuzu her sey ayni" dedi — hakliydi, tek fark
                            bir yuzde sayisiydi. */}
                        <Text style={styles.productDesc}>{selected.product.description}</Text>

                        {/* Live Preview */}
                        <View style={styles.previewContainer}>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>{t('bank.rate')}</Text>
                                <Text style={styles.previewValue}>{currentRate.toFixed(1)}% APR</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>{t('bank.quarterlyPayment')}</Text>
                                <Text style={[styles.previewValue, { color: '#FFD700' }]}>
                                    {formatMoney(preview.totalPayment)}
                                </Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>{t('bank.firstSplit')}</Text>
                                <Text style={styles.previewValue}>
                                    {formatMoney(preview.interest)} interest / {formatMoney(preview.principalPaid)} principal
                                </Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>{t('bank.term')}</Text>
                                <Text style={styles.previewValue}>
                                    {selected.product.termQuarters === 0
                                        ? t('bank.revolving')
                                        : `${selected.product.termQuarters} quarters`}
                                </Text>
                            </View>
                        </View>

                        {/* Warning */}
                        {/* Sozlesme esigi: motorun gercekten uyguladigi sinir. */}
                        {(() => {
                            const ebitda = assessment.leverage > 0
                                ? (useStatsStore.getState().companyDebtTotal || 0) / assessment.leverage
                                : 0;
                            const after = ebitda > 0
                                ? ((useStatsStore.getState().companyDebtTotal || 0) + amount) / ebitda
                                : Infinity;
                            if (!distress.canBorrow) {
                                return <Text style={styles.warningText}>⛔ {distress.message}</Text>;
                            }
                            if (after > COVENANT_MAX_LEVERAGE) {
                                return (
                                    <Text style={styles.warningText}>
                                        ⚠️ {t('bank.covenantWarn', {
                                            leverage: after === Infinity ? '∞' : after.toFixed(1),
                                            max: COVENANT_MAX_LEVERAGE,
                                        })}
                                    </Text>
                                );
                            }
                            return null;
                        })()}

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        </ScrollView>

                        {/* Actions — ScrollView DISINDA, her zaman gorunur */}
                        <View style={styles.actions}>
                            <Pressable onPress={onClose} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleConfirm}
                                style={({ pressed }) => [
                                    styles.confirmButton,
                                    pressed && styles.confirmButtonPressed
                                ]}
                            >
                                <Text style={styles.confirmText}>{t('bank.sign')}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
                <CrystalNavBar activeTab="Company" variant="dark" />
            </View>
        </Modal>
    );
};

export default BorrowModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        // No padding here
    },
    dismissArea: { ...StyleSheet.absoluteFillObject },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        // Ekranin en fazla %78'ini kaplasin; gerisi kaydirilir.
        maxHeight: '78%',
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 80, // Space for Bottom Bar
    },
    body: { flexGrow: 0, flexShrink: 1 },
    bodyContent: { paddingBottom: 8 },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2A2D35',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: { color: '#8A9BA8', fontSize: 16, fontWeight: '700' },
    title: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#8A9BA8',
        textAlign: 'center',
        marginBottom: 24,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: '#FFD700',
        backgroundColor: '#1C1C1E',
    },
    typeEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        fontWeight: '600',
        marginBottom: 2,
    },
    typeLabelActive: {
        color: '#FFF',
    },
    typeRate: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '700',
    },
    sliderContainer: {
        marginBottom: 24,
    },
    previewContainer: {
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 13,
        color: '#8A9BA8',
        fontWeight: '600',
    },
    previewValue: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '700',
    },
    productDesc: {
        fontSize: 12,
        color: '#B8C4D0',
        lineHeight: 17,
        marginBottom: 14,
        fontStyle: 'italic',
    },
    tierNote: {
        fontSize: 11,
        color: '#8A9BA8',
        marginBottom: 16,
        lineHeight: 15,
    },
    typeButtonLocked: {
        opacity: 0.45,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    warningText: {
        color: '#ffdd57',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#2A2D35',
    },
    cancelText: {
        color: '#AAA',
        fontWeight: '600',
    },
    confirmButton: {
        flex: 2,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 15,
    },
});
