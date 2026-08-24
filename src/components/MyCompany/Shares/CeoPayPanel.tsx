// src/components/MyCompany/Shares/CeoPayPanel.tsx
//
// ============================================================================
//  YOUR OWN PAY, IN ONE PLACE
// ============================================================================
//
//  Three choices rather than a number field, and each one shows what it costs
//  before it is picked. A free entry box invites the player to type the
//  treasury and be told no; these are the three answers that exist.
//
//  The ceiling is a share of TRAILING revenue, so it is a number the player
//  has already earned rather than one they can conjure. Every rule behind it
//  is in core/market/ceoPay.ts, written one per loophole.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS A COMPONENT RATHER THAN A FUNCTION ON A SCREEN
//  ---------------------------------------------------------------------------
//  It lived inside ShareControlHub, under Equity, because that is where it was
//  first written. That was the wrong room and it made the feature hard to
//  find: a personal salary decided on a company screen, two taps from the
//  page the money actually lands on.
//
//  Moving it could have meant a second copy, and this codebase has been bitten
//  by that four times now - the casino's 700 in four places, three different
//  salaries, four buyout deciders, two net worths. So the panel moved out
//  WHOLE. There is one implementation, it owns its own dialog, and a screen
//  that wants it renders it and passes an `open` flag.
//
//  ---------------------------------------------------------------------------
//  AND THE EQUITY ROW IS GONE, NOT DUPLICATED
//  ---------------------------------------------------------------------------
//  See the shelved block in ShareControlHub. Two doors to one decision is the
//  same fault as two places holding one fact: they do not disagree today, and
//  nothing stops them.
// ============================================================================

import React, { useState, useEffect } from 'react';
import ConfirmPanel from '../../common/ConfirmPanel';
import { t } from '../../../core/i18n';
import { formatMoney } from '../../../core/utils';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import {
    decidePay,
    payCeiling,
    payAsShareOfRevenue,
    PAY_CHANGE_COOLDOWN,
    PAY_VOTE_MULTIPLE,
} from '../../../core/market/ceoPay';
import { CEO_BASE_SALARY_QUARTERLY } from '../../../core/market/personalEconomy';
import { trailingTotal } from '../../../core/market/equity';
import { currentQuarter } from '../../../core/story/world';

type Props = {
    /** Whether the decision is on screen. */
    open: boolean;
    /** Called when the player is finished with it, however they finished. */
    onClose: () => void;
};

type Result = { title: string; summary: string; ok: boolean } | null;

/**
 * What the player currently takes, the roof over it, and how long until they
 * may raise it again.
 *
 * Exported because the row that OPENS this panel has to show the same three
 * numbers, and a row that computes them itself is how the two net worths
 * happened. A screen reads this; it does not do the arithmetic.
 */
export const usePayFacts = () => {
    const stats = useStatsStore((s) => s);
    const current = stats.ceoPayQuarterly ?? CEO_BASE_SALARY_QUARTERLY;
    const trailingAnnualRevenue = trailingTotal(stats.revenueHistory ?? []);
    const ceiling = payCeiling(trailingAnnualRevenue);
    // Shown rather than only enforced: "no" with no date on it reads as
    // broken, which is how the old contract presets and the old friendly
    // acquisition lock both went wrong.
    const quartersSinceChange =
        currentQuarter() - (stats.ceoPaySetQuarter ?? -PAY_CHANGE_COOLDOWN);
    const lockedFor = Math.max(0, PAY_CHANGE_COOLDOWN - quartersSinceChange);
    return { current, ceiling, trailingAnnualRevenue, quartersSinceChange, lockedFor };
};

const CeoPayPanel = ({ open, onClose }: Props) => {
    const { current, ceiling, trailingAnnualRevenue, quartersSinceChange, lockedFor } =
        usePayFacts();
    const [result, setResult] = useState<Result>(null);

    // A fresh open starts on the choices rather than on the last answer.
    useEffect(() => {
        if (open) setResult(null);
    }, [open]);

    if (!open) return null;

    if (result) {
        return (
            <ConfirmPanel
                visible
                title={result.title}
                summary={result.summary}
                confirmLabel="OK"
                tone={result.ok ? 'default' : 'danger'}
                onConfirm={onClose}
                onCancel={onClose}
            />
        );
    }

    const askForPay = (amount: number) => {
        const r = useCorporateFinanceStore.getState().requestCeoPay(amount);
        setResult({
            title: r.ok ? 'Set' : 'Not this year',
            summary: r.message,
            ok: r.ok,
        });
    };

    // ------------------------------------------------------------------
    //  THREE ANSWERS, AND ALL THREE CAN BE GIVEN
    // ------------------------------------------------------------------
    //  These were once read-only `lines` under a single button that said
    //  "Ask for the maximum", so a player could see the founder's wage and
    //  the middle step and take neither. It also made a pay CUT unreachable,
    //  although decidePay allows one at any time and charges nothing.
    //
    //  Nothing is filtered out. An option that cannot be taken is greyed with
    //  the reason underneath, which is ConfirmPanel's rule: a missing button
    //  teaches nothing.
    // ------------------------------------------------------------------
    const options: { label: string; amount: number }[] = [
        { label: 'The founder\'s wage', amount: CEO_BASE_SALARY_QUARTERLY },
        { label: 'A real rise', amount: Math.min(ceiling, CEO_BASE_SALARY_QUARTERLY * PAY_VOTE_MULTIPLE * 2) },
        { label: 'Everything the company can carry', amount: ceiling },
    ];

    const choices = options.map(o => {
        const d = decidePay({
            amount: o.amount,
            current,
            trailingAnnualRevenue,
            quartersSinceChange,
        });
        const share = payAsShareOfRevenue(d.granted, trailingAnnualRevenue);
        const isCut = d.granted < current;
        const unchanged = d.granted === current;

        const detail = d.blocked
            ? d.blocked
            : unchanged
                ? 'What you already take.'
                : [
                    `${formatMoney(d.granted)} a quarter`,
                    share > 0 ? `${(share * 100).toFixed(1)}% of sales` : '',
                    d.needsVote ? 'the board votes on this' : 'no vote needed',
                    isCut
                        ? 'a cut costs nothing and takes effect at once'
                        : d.trustCost > 0
                            ? `costs every director ${d.trustCost} trust`
                            : 'costs no trust',
                ].filter(Boolean).join(' · ');

        return {
            label: o.label,
            description: detail,
            disabled: !!d.blocked || unchanged,
            onPress: () => askForPay(o.amount),
        };
    });

    return (
        <ConfirmPanel
            visible
            title={t('personal.yourPay')}
            summary={`You take ${formatMoney(current)} a quarter, and the company pays it. `
                + `The most it can carry is ${formatMoney(ceiling)}, which is two per cent of what it sells.`}
            choices={choices}
            note={lockedFor > 0
                ? `Pay is set once a year. ${lockedFor} more ${lockedFor === 1 ? 'quarter' : 'quarters'} before it can rise again. A cut still takes effect at once.`
                : 'A rise is set once a year and costs trust with every director, '
                    + 'whether or not they approve it. A cut takes effect at once and costs nothing.'}
            // Unused while `choices` is present - the choices ARE the answer -
            // but ConfirmPanel takes it as required.
            confirmLabel="Close"
            onCancel={onClose}
        />
    );
};

export default CeoPayPanel;
