import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import { UnlockableProduct } from '../data/unlockableProductsData';
import { getMarket } from '../../../core/market/productMarkets';
import { useProductStore } from '../../../core/store/useProductStore';
import { canUnlockAnotherCategory } from '../../../core/market/brand';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useStatsStore } from '../../../core/store';
import GameButton from '../../../components/common/GameButton';
import ConfirmPanel, { type ConfirmLine } from '../../../components/common/ConfirmPanel';
import { formatMoney, formatNumber } from '../../../core/utils';
import ScreenHeader from '../../../components/common/ScreenHeader';

type Props = {
    product: UnlockableProduct;
    visible: boolean;
    onClose: () => void;
};

const ProductUnlockModal = ({ product, visible, onClose }: Props) => {
    const [panel, setPanel] = useState<null | {
        title: string; summary?: string; lines?: ConfirmLine[];
        confirmLabel: string; tone?: 'default' | 'danger'; onDismiss?: () => void;
    }>(null);
    useLocale();
    const { unlockProduct } = useProductStore();
    const { totalRP, spendRP } = useLaboratoryStore();
    const { companyCapital, brandValue, update: updateStats } = useStatsStore();

    const formatCurrency = (value: number) => {
        return formatMoney(value);
        // eslint-disable-next-line no-unreachable
        return `$${value}`;
    };

    const formatRP = (value: number) => {
        return `${formatNumber(value)} RP`;
        // eslint-disable-next-line no-unreachable
        return `${value} RP`;
    };

    // ------------------------------------------------------------------
    //  CATEGORY GATE — earn your way out before you spread
    // ------------------------------------------------------------------
    //  You cannot open a new market until EVERY market you already trade in
    //  is at CATEGORY_UNLOCK_BRAND (200 points, which is about 4.6% share).
    //  Opening a fourth category on the back of one strong one while two sit
    //  neglected is exactly the sprawl this gate exists to prevent.
    //
    //  The gate reads the WEAKEST category you hold, so the message can name
    //  it. Entering your very first market is always allowed.
    //  See core/market/brand.ts -> canUnlockAnotherCategory
    // ------------------------------------------------------------------
    const brandByCategory = useStatsStore(st => st.brandByCategory);

    const entryGate = (() => {
        const map = brandByCategory || {};
        const active = Object.keys(map);
        // Already trading in this category, or it is the first one: no gate.
        if (active.length === 0 || map[product.category] !== undefined) {
            return { allowed: true, required: 0, have: 0, weakest: undefined as string | undefined };
        }
        return canUnlockAnotherCategory(map, active);
    })();

    const canAfford = entryGate.allowed && totalRP >= product.unlockRPCost && companyCapital >= product.unlockCashCost;

    const handleUnlock = () => {
        if (!entryGate.allowed) {
            setPanel({
                title: t('alert.marketClosed'),
                summary: t('alert.marketLockedBody', {
                    v1: product.category,
                    v2: entryGate.weakest || '-',
                    v3: entryGate.have.toFixed(0),
                    v4: entryGate.required.toFixed(0),
                }),
                lines: [
                    { label: 'Weakest requirement', value: entryGate.weakest || '-' },
                    { label: 'You have', value: entryGate.have.toFixed(0) },
                    { label: 'Needed', value: entryGate.required.toFixed(0), strong: true },
                ],
                confirmLabel: 'OK',
                tone: 'danger',
            });
            return;
        }
        if (product.isUnlocked) {
            setPanel({
                title: t('alert.alreadyUnlocked'),
                summary: t('alert.thisProductHasAlreadyBeen'),
                confirmLabel: 'OK',
            });
            return;
        }

        const result = unlockProduct(
            product.id,
            totalRP,
            companyCapital,
            (amount: number) => spendRP(amount),
            (amount: number) => {
                // ----------------------------------------------------------
                //  ONCE `companyValue`I DOGRUDAN YAZIYORDU VE SILINIYORDU.
                //
                //  Motor her ceyrek degerlemeyi TEMEL VERILERDEN yeniden
                //  hesapliyor (nakit + kazanc carpani + ciro carpani - borc).
                //  Yani buraya elle yazilan boost bir sonraki ceyrekte
                //  buhar oluyordu. Oyuncu "urun cikarmanin yazdigi gibi bir
                //  hisse etkisi yok" dedi — dogru gormus.
                //
                //  Yeni urun duyurusu bir TEMEL VERI degil, bir BEKLENTIDIR.
                //  O yuzden diger sinyaller gibi piyasa duygusu carpanindan
                //  gecer: kalicidir ve zamanla soner.
                // ----------------------------------------------------------
                updateStats({ companyCapital: companyCapital - amount });
                try {
                    const eq = require('../../finance/stores/useEquityStore').useEquityStore;
                    const cur = eq.getState().marketMultiplier || 1;
                    eq.setState({
                        marketMultiplier: Math.min(2.2, cur * (1 + product.stockBoost / 100)),
                    });
                } catch { /* piyasa sinyali uygulanamadi */ }
            }
        );

        if (result.success) {
            setPanel({
                title: '🎉 Success!',
                summary: t('product.v1HasBeenUnlockedN', { v1: product.name, v2: product.stockBoost }),
                confirmLabel: t('product.continue'),
                onDismiss: onClose,
            });
        } else {
            setPanel({
                title: t('alert.cannotUnlock'),
                summary: result.message,
                confirmLabel: 'OK',
                tone: 'danger',
            });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
                    <ScreenHeader title={product.name} onBack={onClose} />

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{product.description}</Text>
                    </View>

                    {/* Financials */}
                    <View style={styles.financialsContainer}>
                        <Text style={styles.sectionTitle}>{t('product.estimatedFinancials')}</Text>
                        <View style={styles.financialsGrid}>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>{t('product.unitCost')}</Text>
                                <Text style={styles.financialValue}>{formatCurrency(product.baseUnitCost)}</Text>
                            </View>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>{t('product.sellingPrice')}</Text>
                                <Text style={styles.financialValue}>{formatCurrency(product.baseSellingPrice)}</Text>
                            </View>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>{t('product.stockBoost')}</Text>
                                <Text style={styles.financialValue}>
                                    +{product.stockBoost}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Cost Display */}
                    <View style={styles.costContainer}>
                        <Text style={styles.costTitle}>{t('product.developmentCost')}</Text>
                        <View style={styles.costRow}>
                            <View style={[styles.costBadge, totalRP < product.unlockRPCost && styles.costBadgeInsufficient]}>
                                <Text style={styles.costLabel}>{t('product.researchPoints')}</Text>
                                <Text style={styles.costValue}>{formatRP(product.unlockRPCost)}</Text>
                                <Text style={styles.costAvailable}>{t('product.availableV1', { v1: formatRP(totalRP) })}</Text>
                            </View>
                            <View style={[styles.costBadge, companyCapital < product.unlockCashCost && styles.costBadgeInsufficient]}>
                                <Text style={styles.costLabel}>{t('product.capital')}</Text>
                                <Text style={styles.costValue}>{formatCurrency(product.unlockCashCost)}</Text>
                                <Text style={styles.costAvailable}>{t('product.availableV1', { v1: formatCurrency(companyCapital) })}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <GameButton
                        title={product.isUnlocked ? t('product.alreadyUnlocked') : t('product.developPrototype')}
                        onPress={handleUnlock}
                        disabled={!canAfford || product.isUnlocked}
                        variant={canAfford && !product.isUnlocked ? 'primary' : 'ghost'}
                        style={styles.button}
                    />
                </Pressable>
            </Pressable>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                onCancel={() => { const done = panel?.onDismiss; setPanel(null); done?.(); }}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 18,
        color: theme.colors.textSecondary,
    },
    descriptionContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    financialsContainer: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    financialsGrid: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    financialItem: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.sm,
    },
    financialLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    financialValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    costContainer: {
        marginBottom: theme.spacing.lg,
    },
    costTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    costRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    costBadge: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.accent + '40',
    },
    costBadgeInsufficient: {
        borderColor: theme.colors.destructive + '40',
    },
    costLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    costValue: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    costAvailable: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    button: {
        width: '100%',
    },
});

export default ProductUnlockModal;
