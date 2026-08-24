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
    // payAsShareOfRevenue - SHELVED: it printed the salary as a share of
    // sales beside the salary itself, which is the same fact twice.
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
    //
    //  ------------------------------------------------------------------
    //  AND IT IS A CHOICE, NOT AN ESSAY
    //  ------------------------------------------------------------------
    //  Reported as "cok yazi var, cok karisik". It was: two sentences of
    //  summary, then three rows each carrying FOUR facts joined by middots -
    //  the amount, the share of sales, whether the board votes, and the trust
    //  cost - then a two sentence note underneath. Around sixty words to pick
    //  one of three numbers.
    //
    //  The repair is not shorter sentences, it is moving the facts out of the
    //  prose. The AMOUNT is now the figure on the right, which is what the
    //  player is actually choosing between and what they had to parse a
    //  sentence to find. An ICON gives each row a handle so the three are
    //  told apart before any of them is read. What is left in the description
    //  is the CONSEQUENCE, at most two short pieces, because that is the only
    //  part that is not already visible.
    //
    //  The share of sales came out entirely. It is a second way of saying the
    //  amount, next to the amount.
    // ------------------------------------------------------------------
    const options: {
        label: string;
        amount: number;
        icon: string;
    }[] = [
        { label: 'The founder\'s wage', amount: CEO_BASE_SALARY_QUARTERLY, icon: 'shield-outline' },
        { label: 'A real rise', amount: Math.min(ceiling, CEO_BASE_SALARY_QUARTERLY * PAY_VOTE_MULTIPLE * 2), icon: 'trending-up' },
        { label: 'All it can carry', amount: ceiling, icon: 'crown-outline' },
    ];

    const choices = options.map(o => {
        const d = decidePay({
            amount: o.amount,
            current,
            trailingAnnualRevenue,
            quartersSinceChange,
        });
        const isCut = d.granted < current;
        const unchanged = d.granted === current;

        // At most two pieces, and only what the row does not already show.
        const detail = d.blocked
            ? d.blocked
            : unchanged
                ? 'What you take now'
                : [
                    d.needsVote ? 'The board votes' : 'No vote',
                    isCut
                        ? 'Takes effect at once'
                        : d.trustCost > 0
                            ? `Costs ${d.trustCost} trust each`
                            : 'Costs no trust',
                ].join(' · ');

        return {
            label: o.label,
            icon: o.icon,
            value: formatMoney(d.granted),
            description: detail,
            disabled: !!d.blocked || unchanged,
            onPress: () => askForPay(o.amount),
        };
    });

    return (
        <ConfirmPanel
            visible
            title={t('personal.yourPay')}
            summary={t('pay.summary', {
                current: formatMoney(current),
                ceiling: formatMoney(ceiling),
            })}
            choices={choices}
            note={lockedFor > 0
                ? t('pay.locked', {
                    n: String(lockedFor),
                    unit: lockedFor === 1 ? t('pay.quarter') : t('pay.quarters'),
                })
                : t('pay.note')}
            // Unused while `choices` is present - the choices ARE the answer -
            // but ConfirmPanel takes it as required.
            confirmLabel="Close"
            onCancel={onClose}
        />
    );
};

export default CeoPayPanel;
