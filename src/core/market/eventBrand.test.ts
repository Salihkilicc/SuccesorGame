// src/core/market/eventBrand.test.ts
//
// ============================================================================
//  THE NIGHT THAT GETS PHOTOGRAPHED
// ============================================================================
//
//  Reported as hosting an event costing money and buying nothing. Unlike the
//  sponsorship and the scene amounts, this one was not a broken wire - there
//  was no wire. `organizeEvent` moved capital and morale and touched nothing
//  else, and `TeamEvent` had no brand field to touch it with.
//
//  The expectation was reasonable, and the game had planted it: the gala's own
//  description says it is "the kind of night that gets photographed". That line
//  was the only place in the game where an event met reputation.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS IS AND IS NOT
//  ---------------------------------------------------------------------------
//  It is a SHOCK, not a moved equilibrium, and the difference is the whole
//  design: brand walks back towards what market share supports, so a shock
//  fades over about three quarters on its own. A night should fade. A sixteen
//  quarter sponsorship should not, which is why that one moves the destination
//  instead. Two mechanisms because there are two different things being
//  modelled, not because nobody tidied up.
//
//  And it goes through `gameSink().brand`, which already spreads a company
//  wide amount by category weight, normalises it so the total lands exactly,
//  converts the index to points and falls back to the flat field before any
//  category exists. A second implementation of that here is how this codebase
//  ended up with four buyout deciders.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    TEAM_EVENTS,
    eventBrandGain,
    eventMoraleGain,
    eventCost,
    type TeamEvent,
} from './workforce';
import { indexToPoints, applyCorporateShock, corporateBrandFrom, brandIndex, brandEquilibrium, advanceCategoryBrand } from './brand';
import { sponsorPeak, SPONSOR_OFFERS } from './sponsorship';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';

const byId = (id: string): TeamEvent => TEAM_EVENTS.find(e => e.id === id)!;

const code = (p: string) =>
    fs.readFileSync(path.join(__dirname, p), 'utf8')
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('which events reach the outside world', () => {
    it('the two expensive ones, and only those', () => {
        expect(eventBrandGain(byId('retreat'), 0)).toBeGreaterThan(0);
        expect(eventBrandGain(byId('gala'), 0)).toBeGreaterThan(0);
        // A team lunch is not a press event.
        expect(eventBrandGain(byId('lunch'), 0)).toBe(0);
        expect(eventBrandGain(byId('offsite'), 0)).toBe(0);
    });

    it('and an event with no field set gets nothing rather than a default', () => {
        // Opt in, so a cheap event added later cannot pick up a press effect
        // by somebody forgetting to write a zero.
        const invented = { id: 'x', name: 'x', costPerPerson: 1, moraleBoost: 1, description: '' };
        expect(eventBrandGain(invented as TeamEvent, 0)).toBe(0);
    });

    it('and the gala is worth more than the retreat, as it costs more', () => {
        expect(eventBrandGain(byId('gala'), 0))
            .toBeGreaterThan(eventBrandGain(byId('retreat'), 0));
        expect(eventCost(byId('gala'), 100))
            .toBeGreaterThan(eventCost(byId('retreat'), 100));
    });

    it('and a night is worth less than a sixteen quarter contract', () => {
        // The sanity check on the size. If a party outweighed the biggest
        // sponsorship in the game, sponsorships would be furniture.
        const biggestDeal = Math.max(...SPONSOR_OFFERS.map(sponsorPeak));
        expect(eventBrandGain(byId('gala'), 0)).toBeLessThan(biggestDeal / 2);
    });
});

describe('hosting twice in one quarter', () => {
    it('halves the press the same way it halves the morale', () => {
        // ONE rule, not two. A player who could stack the press by hosting
        // twice would have found a lever the morale side already closes.
        const gala = byId('gala');
        expect(eventBrandGain(gala, 1)).toBeCloseTo(eventBrandGain(gala, 0) / 2, 6);
        expect(eventMoraleGain(gala, 1)).toBe(Math.round(eventMoraleGain(gala, 0) / 2));
    });
});

describe('what the glow actually does to the brand', () => {
    const share = 5;

    it('lands as the index amount it says, once converted', () => {
        const cats = { Consumer: brandEquilibrium(share) };
        const before = brandIndex(corporateBrandFrom(cats, ['Consumer']));
        const gain = eventBrandGain(byId('gala'), 0);
        const after = brandIndex(corporateBrandFrom(
            applyCorporateShock({ ...cats }, indexToPoints(gain), ['Consumer']),
            ['Consumer'],
        ));
        expect(after - before).toBeCloseTo(gain, 4);
    });

    it('and fades, because a night is not a contract', () => {
        // The mean reversion is the fade. Measured rather than asserted: the
        // sponsorship gets its own mechanism precisely because this one does
        // not hold.
        const settled = brandEquilibrium(share);
        let brand = settled + indexToPoints(eventBrandGain(byId('gala'), 0));
        const startGap = brandIndex(brand) - brandIndex(settled);
        for (let q = 0; q < 4; q++) {
            brand = advanceCategoryBrand({ current: brand, share, servedRatio: 1 }).newBrand;
        }
        const endGap = brandIndex(brand) - brandIndex(settled);
        expect(endGap).toBeLessThan(startGap / 2);
        expect(endGap).toBeGreaterThan(0);
    });
});

describe('the wiring', () => {
    it('goes through the one effect that already knows how to do this', () => {
        const src = code('../store/useGameStore.ts');
        expect(src).toMatch(/gameSink\(\)\.brand\(brandGain\)/);
        // And does not reimplement the spreading beside it.
        const organize = src.slice(src.indexOf('organizeEvent: ('), src.indexOf('setOvertime:'));
        expect(organize).not.toMatch(/applyCorporateShock/);
        expect(organize).not.toMatch(/brandByCategory/);
    });

    it('and only fires when there is something to fire', () => {
        // A lunch must not call the effect with a zero. It is cheap, but a
        // zero shock still writes brandByCategory and would make a lunch
        // register as a reputation event in anything watching.
        const src = code('../store/useGameStore.ts');
        expect(src).toMatch(/if \(brandGain > 0\)/);
    });

    it('and the screen says so before the player pays', () => {
        // The effect this whole entry is about was invisible. Adding a second
        // invisible one would be the same bug with a nicer commit message.
        const ui = code('../../components/MyCompany/Management/EmployeesModule.tsx');
        expect(ui).toMatch(/eventBrandGain\(ev, eventsHosted\)/);
        expect(ui).toMatch(/press > 0 &&/);
        expect(ui).toMatch(/company\.eventPress/);
    });

    it('and its wording exists in both catalogues, with no dashes', () => {
        for (const c of [en, tr] as Record<string, string>[]) {
            expect(c['company.eventPress']).toBeTruthy();
            expect(c['company.eventPress']).toContain('{v1}');
            expect(c['company.eventPress']).not.toMatch(/—/);
            expect(c['company.eventPress']).not.toMatch(/\s-\s/);
        }
    });
});
