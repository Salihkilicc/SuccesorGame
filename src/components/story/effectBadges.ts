// src/components/story/effectBadges.ts
import type { Effect } from '../../core/story/effects';
import { formatMoney } from '../../core/utils';

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

export const formatEffectBadge = (effect: Effect): EffectBadge | null => {
    switch (effect.kind) {
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

export const getChoiceBadges = (effects?: Effect[]): EffectBadge[] => {
    if (!effects || effects.length === 0) return [];
    return effects.map(formatEffectBadge).filter((b): b is EffectBadge => b !== null);
};
