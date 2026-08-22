// src/components/story/effectBadges.ts
import type { Effect } from '../../core/story/effects';
import { fineAmount, FINE_LABEL } from '../../core/story/fines';
import { quotedDelta, PRICE_BOOK } from '../../core/story/prices';
import { formatMoney } from '../../core/utils';

/**
 * What a badge needs that the effect cannot carry.
 *
 * Only `fine` uses it so far, and only because a penalty priced as a share of
 * capital has no figure until there is a company to charge it to. Optional, so
 * the badge still reads without it - it names the severity instead of the
 * money, which is honest rather than blank.
 */
export interface BadgeContext {
    companyCapital?: number;
}

export interface EffectBadge {
    id: string;
    label: string;
    tone: 'positive' | 'negative' | 'neutral' | 'accent';
    icon?: string;
}

const formatDialName = (dial: string): string => {
    switch (dial) {
        case 'brotherTrust': return 'Brother Trust';
        case 'cfoTrust': return 'CFO Trust';
        case 'friendLoyalty': return 'Friend Loyalty';
        case 'pearHostility': return 'Pear Rivalry';
        default: return dial.charAt(0).toUpperCase() + dial.slice(1);
    }
};

export const formatEffectBadge = (
    effect: Effect,
    context: BadgeContext = {},
): EffectBadge | null => {
    switch (effect.kind) {
        // ------------------------------------------------------------------
        //  THE PLAYER IS TOLD THE REAL NUMBER BEFORE THEY TAP
        // ------------------------------------------------------------------
        //  A share of capital is fair and it is also invisible, so a badge
        //  reading "Severe penalty" would move the old problem rather than
        //  fix it: the player still cannot tell whether to fight it. With the
        //  capital to hand it says what it actually costs today.
        // ------------------------------------------------------------------
        case 'fine': {
            const capital = context.companyCapital;
            const label = typeof capital === 'number'
                ? `-${formatMoney(fineAmount(capital, effect.severity))} Penalty`
                : FINE_LABEL[effect.severity];
            return {
                id: `fine_${effect.severity}`,
                label,
                tone: 'negative',
                icon: '⚖️',
            };
        }
        // The figure the sentence above it is quoting, from the same book.
        case 'quoted': {
            const capital = context.companyCapital;
            const entry = PRICE_BOOK[effect.item];
            const isIn = entry?.direction === 'in';
            if (typeof capital !== 'number') {
                return {
                    id: `quoted_${effect.item}`,
                    label: isIn ? 'Capital in' : 'Capital out',
                    tone: isIn ? 'positive' : 'negative',
                    icon: isIn ? '💰' : '💸',
                };
            }
            const delta = quotedDelta(capital, effect.item);
            return {
                id: `quoted_${effect.item}`,
                label: `${isIn ? '+' : '-'}${formatMoney(Math.abs(delta))} Capital`,
                tone: isIn ? 'positive' : 'negative',
                icon: isIn ? '💰' : '💸',
            };
        }
        case 'capital': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `cap_${effect.amount}`,
                label: `${isPos ? '+' : '-'}${formatMoney(Math.abs(effect.amount))} Capital`,
                tone: isPos ? 'positive' : 'negative',
                icon: isPos ? '💰' : '💸',
            };
        }
        case 'cash': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `cash_${effect.amount}`,
                label: `${isPos ? '+' : '-'}${formatMoney(Math.abs(effect.amount))} Cash`,
                tone: isPos ? 'positive' : 'negative',
                icon: isPos ? '💵' : '💳',
            };
        }
        case 'employees': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `emp_${effect.amount}`,
                label: `${isPos ? '+' : ''}${effect.amount} Staff`,
                tone: isPos ? 'positive' : 'negative',
                icon: '👥',
            };
        }
        case 'researchers': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `res_${effect.amount}`,
                label: `${isPos ? '+' : ''}${effect.amount} Researchers`,
                tone: isPos ? 'positive' : 'negative',
                icon: '🔬',
            };
        }
        case 'brand': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `brand_${effect.amount}`,
                label: `${isPos ? '+' : ''}${effect.amount} Brand`,
                tone: isPos ? 'positive' : 'negative',
                icon: '📈',
            };
        }
        case 'morale': {
            if (effect.amount === 0) return null;
            const isPos = effect.amount > 0;
            return {
                id: `morale_${effect.amount}`,
                label: `${isPos ? '+' : ''}${effect.amount}% Morale`,
                tone: isPos ? 'positive' : 'negative',
                icon: '⚡',
            };
        }
        case 'dial': {
            if (effect.delta === 0) return null;
            const isPos = effect.delta > 0;
            const name = formatDialName(effect.dial);
            return {
                id: `dial_${effect.dial}_${effect.delta}`,
                label: `${isPos ? '+' : ''}${effect.delta} ${name}`,
                tone: isPos ? 'positive' : 'negative',
                icon: '🤝',
            };
        }
        case 'boardSeat': {
            return {
                id: `seat_${effect.person}`,
                label: `+${Math.round(effect.stake * 100)}% Board Seat`,
                tone: 'accent',
                icon: '🏛️',
            };
        }
        case 'reprice': {
            const pct = Math.round((1 - effect.multiplier) * 100);
            return {
                id: `reprice_${effect.company}`,
                label: `${pct}% Discount`,
                tone: 'accent',
                icon: '🏷️',
            };
        }
        case 'ending': {
            return {
                id: `ending_${effect.ending}`,
                label: 'Decisive Turning Point',
                tone: 'negative',
                icon: '⚠️',
            };
        }
        default:
            return null;
    }
};

export const getChoiceBadges = (
    effects?: Effect[],
    context: BadgeContext = {},
): EffectBadge[] => {
    if (!effects || effects.length === 0) return [];
    return effects
        .map(e => formatEffectBadge(e, context))
        .filter((b): b is EffectBadge => b !== null);
};
