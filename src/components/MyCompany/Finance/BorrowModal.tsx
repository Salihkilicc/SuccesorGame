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
import { formatMoney } from '../../../core/utils';
import ScreenHeader from '../../common/ScreenHeader';
import { StatRow, RowGroup, DetailLine, DetailRule, DetailNote } from '../../common/Disclosure';
import ScreenHost from '../../common/ScreenHost';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

/**
 * The loan menu, in the order a company would actually work through it:
 * cheapest and most demanding first, most expensive and least fussy last.
 */
const LOAN_CHOICES: { kind: LoanKind; icon: string; label: () => string }[] = [
    { kind: 'term', icon: '🏛️', label: () => t('bank.type.term') },
    { kind: 'bond', icon: '📜', label: () => t('bank.type.bond') },
    { kind: 'secured', icon: '🏭', label: () => t('bank.type.secured') },
    { kind: 'mezzanine', icon: '⚖️', label: () => t('bank.type.mezzanine') },
    { kind: 'shark', icon: '🦈', label: () => t('bank.type.shark') },
];

type Props = {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
};

const BorrowModal = ({ visible, onClose, asScreen }: Props) => {
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
        <ScreenHost asScreen={asScreen} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                        <ScreenHeader
                            title={t('bank.borrow.title')}
                            subtitle={`${assessment.rating} · ${assessment.leverage === Infinity ? '∞' : assessment.leverage.toFixed(1)}x leverage · ${borrowingCapacity > 0 ? `${formatMoney(borrowingCapacity)} available` : 'no capacity'}`}
                            onBack={onClose}
                        />

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator
                        >

                        {/* ------------------------------------------------
                            THE LOAN TYPES, AS A LIST
                            ------------------------------------------------
                            These were six chips in two rows of three, each
                            showing an emoji, a name and a percentage. Nothing
                            said what any of them WAS, so the only difference a
                            player could see was the number - which is exactly
                            the complaint that "bonds never change anything".

                            One row per type: the rate is the number, the line
                            underneath is what the money actually costs you.
                           ------------------------------------------------ */}
                        <RowGroup title={t('bank.borrow.title')}>
                            {LOAN_CHOICES.map(({ kind, icon, label }) => {
                                const info = productInfo(kind);
                                const active = selectedType === kind;
                                return (
                                    <Pressable
                                        key={kind}
                                        onPress={() => !info.locked && setSelectedType(kind)}
                                        style={({ pressed }) => [
                                            styles.typeRow,
                                            active && styles.typeRowActive,
                                            !!info.locked && styles.typeRowLocked,
                                            pressed && styles.typeRowPressed,
                                        ]}>
                                        <Text style={styles.typeIcon}>{icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.typeName, active && styles.typeNameActive]}>
                                                {label()}
                                            </Text>
                                            <Text style={styles.typeWhy} numberOfLines={2}>
                                                {info.locked || info.product.description}
                                            </Text>
                                        </View>
                                        <Text style={[styles.typeRateText, active && styles.typeNameActive]}>
                                            {info.locked ? ', ' : `${info.rate.toFixed(1)}%`}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </RowGroup>

                        {selectedType === 'mezzanine' && amount > 0 && (
                            <Text style={styles.warningText}>
                                ⚖️ If unpaid, this becomes {mezzQuote.dilutionPercent.toFixed(1)}% of your company
                                {mezzQuote.costsBoardSeat ? ', and a board seat.' : '.'}
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

                        {/* What this loan actually costs, number first. */}
                        <RowGroup title={t('bank.quarterlyPayment')}>
                            <StatRow
                                label={t('bank.quarterlyPayment')}
                                value={formatMoney(preview.totalPayment)}
                                why={`${currentRate.toFixed(1)}% APR · ${
                                    selected.product.termQuarters === 0
                                        ? t('bank.revolving')
                                        : `${selected.product.termQuarters} quarters`
                                }`}
                                detail={
                                    <>
                                        <DetailLine label={t('bank.rate')} value={`${currentRate.toFixed(1)}% APR`} />
                                        <DetailLine label="Interest" value={formatMoney(preview.interest)} />
                                        <DetailLine label="Principal" value={formatMoney(preview.principalPaid)} />
                                        <DetailRule />
                                        <DetailLine
                                            label={t('bank.quarterlyPayment')}
                                            value={formatMoney(preview.totalPayment)}
                                            strong
                                        />
                                        <DetailNote>
                                            The first payment is mostly interest. Principal only starts
                                            coming down once the balance does.
                                        </DetailNote>
                                    </>
                                }
                            />
                        </RowGroup>

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

                        {/* Scrolls with the page rather than pinned. */}
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

                        </ScrollView>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
            </View>
        </ScreenHost>
    );
};

export default BorrowModal;

const styles = StyleSheet.create({
    // --- The loan menu ----------------------------------------------------
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    typeRowActive: { backgroundColor: theme.colors.surfaceHigh },
    typeRowPressed: { backgroundColor: theme.colors.surfaceRaised },
    typeRowLocked: { opacity: 0.45 },
    typeIcon: { fontSize: 22, width: 26, textAlign: 'center' },
    typeName: { color: theme.colors.textSecondary, fontSize: theme.typography.body, fontWeight: '700' },
    typeNameActive: { color: theme.colors.textPrimary },
    typeWhy: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: 2, lineHeight: 15 },
    typeRateText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },

    // ----------------------------------------------------------------------
    //  FULL-BLEED, like every other destination in the app.
    //
    //  This was a 420px card capped at 78% of the screen height, centred, with
    //  24px of its own padding and an 80px margin under it. Six loan types, an
    //  amount selector and a payment breakdown were being asked to live in a
    //  box roughly half the screen - so it read as cramped no matter how the
    //  contents were arranged. Choosing how to finance the company is a place
    //  you go, not something you peek at.
    // ----------------------------------------------------------------------
    backdrop: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    dismissArea: { width: 0, height: 0 },
    centeredView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    body: { flex: 1 },
    bodyContent: { padding: theme.spacing.md, paddingBottom: NAV_BAR_CLEARANCE, gap: theme.spacing.md },
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
        backgroundColor: '#323A40',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: { color: 'rgba(255,255,255,0.48)', fontSize: 16, fontWeight: '700' },
    title: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#323A40',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#434B50',
    },
    typeEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        marginBottom: 2,
    },
    typeLabelActive: {
        color: '#FFFFFF',
    },
    typeRate: {
        fontSize: 14,
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
    sliderContainer: {
        marginBottom: 24,
    },
    previewContainer: {
        backgroundColor: '#323A40',
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
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
    },
    previewValue: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    productDesc: {
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: 17,
        marginBottom: 14,
        fontStyle: 'italic',
    },
    tierNote: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 16,
        lineHeight: 15,
    },
    typeButtonLocked: {
        opacity: 0.45,
    },
    errorText: {
        color: theme.colors.warning,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    warningText: {
        color: theme.colors.warning,
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
        backgroundColor: '#323A40',
    },
    cancelText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    confirmButton: {
        flex: 2,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#434B50',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
});
