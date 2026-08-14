// src/components/MyCompany/Finance/CapitalInjectionModal.tsx
//
// ============================================================================
//  PUTTING YOUR OWN MONEY IN
// ============================================================================
//
//  WHY IT "DIDN'T WORK". The store action was fine - it moves cash from the
//  player to the company and fires the strongest positive market signal in
//  the game. What was broken was the way in. On the finance screen the two
//  funding options were rendered as rows with a "›" on the right, which is a
//  promise that pressing them goes somewhere, and StatRow only reacts to a
//  press when it has a `detail` block to open. These had none. So the rows
//  were dead, and the working controls were two small buttons further down,
//  stacked above Request New Loan where nobody reads them as belonging to
//  the options they duplicate.
//
//  The rows are the buttons now, and this is a screen rather than a modal -
//  same reason as Borrow and Repay: a Modal draws above the nav bar, so the
//  bar disappears on it.
// ============================================================================

import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney } from '../../../core/utils';
import { theme } from '../../../core/theme';
import GameModal from '../../common/GameModal';
import ScreenHeader from '../../common/ScreenHeader';
import { StatRow, RowGroup, DetailLine, DetailNote } from '../../common/Disclosure';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

interface Props { visible: boolean; onClose: () => void; asScreen?: boolean }

const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50];

const CapitalInjectionModal: React.FC<Props> = ({ visible, onClose, asScreen }) => {
    useLocale();
    const money = useStatsStore(s => s.money);
    const companyCapital = useStatsStore(s => s.companyCapital);
    const { injectCapital } = useCorporateFinanceStore();
    const [percent, setPercent] = useState<number>(10);
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        cancelLabel?: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);

    const amount = Math.floor(money * (percent / 100));
    const canAfford = amount > 0 && amount <= money;

    const handleConfirm = () => {
        const res = injectCapital(amount);
        if (res.success) onClose();
        else setPanel({ title: 'Error', summary: res.msg, confirmLabel: 'OK', tone: 'danger' });
    };

    return (
        <GameModal asScreen={asScreen} visible={visible} onClose={onClose}>
            <ScreenHeader
                title={t('finance.injection')}
                subtitle={t('finance.transferPersonalWealth')}
                onBack={onClose}
                inset={asScreen}
                category="finance"
            />

            <ScrollView contentContainerStyle={styles.body}>
                <RowGroup title="Where the money is">
                    <StatRow
                        label={t('finance.availableCash')}
                        value={formatMoney(money)}
                        why="your own account, this is what you can put in"
                    />
                    <StatRow
                        label="Company capital"
                        value={formatMoney(companyCapital)}
                        why="what the business is running on"
                    />
                </RowGroup>

                <Text style={styles.groupTitle}>{t('finance.selectAmount')}</Text>
                <View style={styles.grid}>
                    {PERCENTS.map((p) => (
                        <Pressable
                            key={p}
                            onPress={() => setPercent(p)}
                            style={({ pressed }) => [
                                styles.chip,
                                percent === p && styles.chipActive,
                                pressed && styles.chipPressed,
                            ]}>
                            <Text style={[styles.chipText, percent === p && styles.chipTextActive]}>
                                {p}%
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <RowGroup title="What happens">
                    <StatRow
                        label={t('finance.injecting')}
                        value={formatMoney(amount)}
                        why={`${percent}% of your personal cash`}
                        startOpen
                        detail={
                            <>
                                <DetailLine
                                    label="Your cash after"
                                    value={formatMoney(money - amount)}
                                    tone="down"
                                />
                                <DetailLine
                                    label="Company capital after"
                                    value={formatMoney(companyCapital + amount)}
                                    tone="up"
                                />
                                <DetailNote>
                                    A founder putting his own money in is the strongest positive
                                    signal the market reads - "skin in the game". It moves the share
                                    price on its own, separately from what the cash buys.
                                </DetailNote>
                            </>
                        }
                    />
                </RowGroup>

                <Pressable
                    onPress={handleConfirm}
                    disabled={!canAfford}
                    style={({ pressed }) => [
                        styles.confirm,
                        !canAfford && styles.confirmOff,
                        pressed && canAfford && styles.confirmPressed,
                    ]}>
                    <Text style={[styles.confirmText, !canAfford && styles.confirmTextOff]}>
                        {canAfford ? `${t('finance.confirm')} · ${formatMoney(amount)}` : 'Nothing to inject'}
                    </Text>
                </Pressable>

                <View style={{ height: NAV_BAR_CLEARANCE }} />
            </ScrollView>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                note={panel?.note}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                cancelLabel={panel?.cancelLabel}
                onConfirm={panel?.onConfirm}
                onCancel={() => setPanel(null)}
            />
        </GameModal>
    );
};

const styles = StyleSheet.create({
    body: { padding: theme.spacing.md },
    groupTitle: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginLeft: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
    chip: {
        width: '22.5%',
        paddingVertical: 10,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    chipPressed: { backgroundColor: theme.colors.surfaceHigh },
    /** Selected chips are the light highlight, so their text is black. */
    chipActive: { backgroundColor: theme.colors.highlight, borderColor: theme.colors.highlight },
    chipText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 13 },
    chipTextActive: { color: theme.colors.highlightText },

    confirm: {
        marginTop: theme.spacing.xs,
        paddingVertical: 14,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    confirmPressed: { backgroundColor: theme.colors.highlight },
    confirmOff: { backgroundColor: theme.colors.disabled },
    confirmText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 15 },
    /** Still black: the disabled fill is light on purpose. See theme rule 1. */
    confirmTextOff: { color: theme.colors.onLight },
});

export default CapitalInjectionModal;
