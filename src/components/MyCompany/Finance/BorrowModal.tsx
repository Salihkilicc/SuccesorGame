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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
const LOAN_CHOICES: { kind: LoanKind; icon: string; color: string; label: () => string }[] = [
    { kind: 'term', icon: 'bank-outline', color: '#60A5FA', label: () => t('bank.type.term') },
    { kind: 'bond', icon: 'certificate-outline', color: '#A78BFA', label: () => t('bank.type.bond') },
    { kind: 'secured', icon: 'factory', color: '#FBBF24', label: () => t('bank.type.secured') },
    { kind: 'mezzanine', icon: 'scale-balance', color: '#38BDF8', label: () => t('bank.type.mezzanine') },
    { kind: 'shark', icon: 'shark', color: '#F87171', label: () => t('bank.type.shark') },
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
                            subtitle={t('bank.assessmentSub', {
                                rating: assessment.rating,
                                leverage: assessment.leverage === Infinity ? '∞' : assessment.leverage.toFixed(1),
                                capacity: borrowingCapacity > 0
                                    ? t('finance.availableAmount', { amount: formatMoney(borrowingCapacity) })
                                    : t('finance.noCapacity'),
                            })}
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
                            {LOAN_CHOICES.map(({ kind, icon, color, label }) => {
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
                                        <View style={[styles.typeIconBadge, { backgroundColor: `${color}15`, borderColor: active ? color : `${color}35` }]}>
                                            <MaterialCommunityIcons name={icon} size={22} color={color} />
                                        </View>
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
                            <View style={styles.warningBox}>
                                <MaterialCommunityIcons name="scale-balance" size={16} color={theme.colors.warning} style={{ marginRight: 6 }} />
                                <Text style={styles.warningText}>
                                    {t('finance.mezzFull', {
                                        percent: mezzQuote.dilutionPercent.toFixed(1),
                                        seat: mezzQuote.costsBoardSeat ? t('finance.andABoardSeat') : '.',
                                    })}
                                </Text>
                            </View>
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

                        {/* ------------------------------------------------
                            WHAT IT COSTS, AS A FIGURE RATHER THAN A ROW
                            ------------------------------------------------
                            It was here already, as one StatRow among the
                            others, under a group heading that repeated its own
                            label. So the single number a player is deciding
                            with looked exactly like the rate, the term and the
                            principal beside it, and it sat below a slider they
                            were still moving.

                            Reported as wanting the payment more visible. It is
                            the headline of this block now: the figure large,
                            the rate and the term under it as the caption, and
                            the breakdown still one tap away in the row below.

                            THE UNIT STAYS QUARTERLY. The ask said monthly and
                            this game does not have months that mean anything -
                            the engine bills every quarter, `termQuarters` is
                            the term, and renaming the label without moving the
                            money would be the two-places-one-fact bug written
                            deliberately. The word is on the caption so nobody
                            has to guess.
                           ------------------------------------------------ */}
                        <View style={styles.paymentHero}>
                            <Text style={styles.paymentHeroLabel}>
                                {t('bank.quarterlyPayment')}
                            </Text>
                            <Text
                                style={styles.paymentHeroValue}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {formatMoney(preview.totalPayment)}
                            </Text>
                            <Text style={styles.paymentHeroCaption}>
                                {t('bank.aprAndTerm', {
                                    rate: currentRate.toFixed(1),
                                    term: selected.product.termQuarters === 0
                                        ? t('bank.revolving')
                                        : t('bank.forNQuarters', { v1: String(selected.product.termQuarters) }),
                                })}
                            </Text>
                            {selected.product.termQuarters > 0 && (
                                <Text style={styles.paymentHeroCaption}>
                                    {t('bank.totalOverTerm', {
                                        v1: formatMoney(preview.totalPayment * selected.product.termQuarters),
                                    })}
                                </Text>
                            )}
                        </View>

                        {/* The breakdown, still one tap away. */}
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
                                        <DetailLine label={t('fin.interest')} value={formatMoney(preview.interest)} />
                                        <DetailLine label={t('fin.principal')} value={formatMoney(preview.principalPaid)} />
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
                        {/* ------------------------------------------------
                            THE COVENANT WARNING, WITHOUT THE INFINITY
                            ------------------------------------------------
                            It used to reconstruct EBITDA by dividing debt by
                            leverage:

                              const ebitda = assessment.leverage > 0
                                  ? (companyDebtTotal || 0) / assessment.leverage
                                  : 0;
                              const after = ebitda > 0 ? ... : Infinity;

                            For a company with no debt that is zero over zero,
                            so `after` was Infinity and the screen said "this
                            puts you at INFINITY leverage" on the first loan a
                            founder ever takes. Which is every founder, and it
                            read as an alarm about nothing.

                            The assessment publishes its own EBITDA now - see
                            core/market/credit.ts. And when there is no EBITDA
                            to divide by, the honest answer is to say NOTHING:
                            a company with no earnings has no leverage ratio,
                            and inventing a symbol for it is not a warning, it
                            is noise. The distress message below still fires,
                            and that one is real.
                           ------------------------------------------------ */}
                        {(() => {
                            if (!distress.canBorrow) {
                                return (
                                    <View style={styles.warningBox}>
                                        <MaterialCommunityIcons name="alert-decagram-outline" size={16} color={theme.colors.negative} style={{ marginRight: 6 }} />
                                        <Text style={[styles.warningText, { color: theme.colors.negative }]}>{distress.message}</Text>
                                    </View>
                                );
                            }

                            const ebitda = assessment.ebitda || 0;
                            if (ebitda <= 0) return null;

                            const after = ((useStatsStore.getState().companyDebtTotal || 0) + amount) / ebitda;
                            if (after <= COVENANT_MAX_LEVERAGE) return null;

                            return (
                                <View style={styles.warningBox}>
                                    <MaterialCommunityIcons name="alert-outline" size={16} color={theme.colors.warning} style={{ marginRight: 6 }} />
                                    <Text style={styles.warningText}>
                                        {t('bank.covenantWarn', {
                                            leverage: after.toFixed(1),
                                            max: COVENANT_MAX_LEVERAGE,
                                        })}
                                    </Text>
                                </View>
                            );
                        })()}

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        {/* ------------------------------------------------
                            ONE BUTTON, AND IT IS THE PRIMARY

                            SHELVED: a Cancel beside it, at flex 1 against the
                            sign button's flex 2, both on the same grey fill.

                            Cancel had nothing to do. ScreenHeader's arrow is
                            the way out of every screen in this game - that is
                            the rule the header was written to enforce - so a
                            second exit at the bottom of the page is a control
                            that duplicates one the player already knows and
                            makes the real action share its row.

                                <Pressable onPress={onClose} style={styles.cancelButton}>
                                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                                </Pressable>

                            And it is BLUE now. `theme.colors.primary` is the
                            app's one primary fill and it is a light one, so
                            the label goes black - see rule 1 in core/theme.ts.
                            It was on `#434B50`, the same grey as the cancel
                            beside it, which is a raised surface rather than an
                            action.
                           ------------------------------------------------ */}
                        <View style={styles.actions}>
                            <Pressable
                                onPress={handleConfirm}
                                style={({ pressed }) => [styles.confirmButton, styles.confirmPrimary, pressed && styles.confirmButtonPressed]}>
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
        paddingVertical: theme.spacing.sm + 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    typeRowActive: { backgroundColor: theme.colors.surfaceHigh },
    typeRowPressed: { backgroundColor: theme.colors.surfaceRaised },
    typeRowLocked: { opacity: 0.45 },
    typeIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
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
    // ------------------------------------------------------------------
    //  THE PAYMENT BLOCK
    // ------------------------------------------------------------------
    //  Dark ground, hairline border, the app's card. The figure is the only
    //  thing on this screen at display size, because it is the only thing the
    //  player is actually deciding with.
    // ------------------------------------------------------------------
    paymentHero: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    paymentHeroLabel: {
        fontSize: theme.typography.caption,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    paymentHeroValue: {
        fontSize: theme.typography.title,
        fontWeight: '900',
        color: theme.colors.textPrimary,
        letterSpacing: 0.5,
        marginTop: 2,
    },
    paymentHeroCaption: {
        fontSize: theme.typography.micro + 1,
        color: theme.colors.textSecondary,
        marginTop: 3,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.08)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
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
        // Was 24, on top of the 12 the body's `gap` already puts between
        // every block. Thirty six points of nothing between the amount and
        // the figure it decides, which is the one pair on this screen that
        // should read as a single thought.
        marginBottom: 0,
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
        marginTop: theme.spacing.sm,
    },
    // SHELVED with the cancel button above.
    //  cancelButton: {
    //      flex: 1, padding: 16, alignItems: 'center',
    //      borderRadius: 12, backgroundColor: '#323A40',
    //  },
    //  cancelText: { color: '#FFFFFF', fontWeight: '600' },
    // ------------------------------------------------------------------
    //  THE SHAPE AND THE FILL ARE SEPARATE
    // ------------------------------------------------------------------
    //  The fill was one property inside this block and the palette audit
    //  reported "primaryText on background fill = 1.34" - black text on the
    //  dark ground - because it could not tell that the label's nearest
    //  painted ancestor was this button rather than the page.
    //
    //  The finance hub next door has never been flagged and the difference is
    //  the SHAPE: its fill is its own single-property style. Splitting it the
    //  same way is what the checker can read, and it is the better structure
    //  anyway - the box is the box, the fill is the variant. See the note at
    //  the top of scripts/reachability.js about what it can and cannot see.
    // ------------------------------------------------------------------
    confirmPrimary: { backgroundColor: theme.colors.primary },
    confirmButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
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
        // Black, because the primary is a LIGHT fill. See rule 1 in the theme.
        color: theme.colors.primaryText,
        fontWeight: '800',
        fontSize: 15,
    },
});
