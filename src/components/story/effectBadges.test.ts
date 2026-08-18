// src/components/story/effectBadges.test.ts
import { formatEffectBadge, getChoiceBadges } from './effectBadges';
import type { Effect } from '../../core/story/effects';

describe('formatEffectBadge', () => {
    it('formats capital properly for positive and negative amounts', () => {
        const pos = formatEffectBadge({ kind: 'capital', amount: 1_500_000 });
        expect(pos?.label).toContain('1.5M');
        expect(pos?.tone).toBe('positive');

        const neg = formatEffectBadge({ kind: 'capital', amount: -600_000 });
        expect(neg?.label).toContain('600');
        expect(neg?.tone).toBe('negative');
    });

    it('formats employees properly', () => {
        const empPos = formatEffectBadge({ kind: 'employees', amount: 15 });
        expect(empPos?.label).toBe('+15 Staff');
        expect(empPos?.tone).toBe('positive');

        const empNeg = formatEffectBadge({ kind: 'employees', amount: -5 });
        expect(empNeg?.label).toBe('-5 Staff');
        expect(empNeg?.tone).toBe('negative');
    });

    it('formats researchers properly', () => {
        const resPos = formatEffectBadge({ kind: 'researchers', amount: 8 });
        expect(resPos?.label).toBe('+8 Researchers');
        expect(resPos?.tone).toBe('positive');

        const resNeg = formatEffectBadge({ kind: 'researchers', amount: -2 });
        expect(resNeg?.label).toBe('-2 Researchers');
        expect(resNeg?.tone).toBe('negative');
    });

    it('formats brand, morale, and dials properly', () => {
        const brand = formatEffectBadge({ kind: 'brand', amount: 3 });
        expect(brand?.label).toBe('+3 Brand');

        const morale = formatEffectBadge({ kind: 'morale', amount: -4 });
        expect(morale?.label).toBe('-4% Morale');

        const dial = formatEffectBadge({ kind: 'dial', dial: 'friendLoyalty', delta: 10 });
        expect(dial?.label).toBe('+10 Friend Loyalty');
    });

    it('filters out non-visible effects like flag or schedule in getChoiceBadges', () => {
        const effects: Effect[] = [
            { kind: 'flag', flag: 'fatherDead' },
            { kind: 'capital', amount: -500_000 },
            { kind: 'schedule', conversation: 'test', afterQuarters: 1 },
            { kind: 'researchers', amount: 15 },
        ];
        const badges = getChoiceBadges(effects);
        expect(badges.length).toBe(2);
        expect(badges[0].label).toContain('500');
        expect(badges[1].label).toBe('+15 Researchers');
    });
});
