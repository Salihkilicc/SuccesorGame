// src/features/love/components/proposalWizard.test.ts
//
// ============================================================================
//  ASKING SOMEBODY TO MARRY YOU
// ============================================================================
//
//  Three faults, and each of them is the kind that looks like nothing in the
//  file and like a different app on the screen.
//
//    THE VENUE WAS A CAROUSEL. Twelve places behind a prev and a next arrow,
//    so reaching the last took eleven taps and no two were ever visible
//    together - which is the one thing a list of prices is for. The yacht is
//    fifteen thousand for fifteen per cent and the billboard is a hundred
//    thousand for thirty; that comparison IS the decision and it could not be
//    made.
//
//    THE SYMBOLS WERE EMOJI. Eight of them, up to sixty points, in a typeface
//    and a colour nothing in the theme chose. Half the arrows had already been
//    converted to icons and half had not.
//
//    AND THE RESULT USED THE PROFIT COLOURS. Green for a yes, red for a no, in
//    a game where those two mean money in and money out and nothing else.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { PROPOSAL_LOCATIONS } from '../data/loveConstants';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

/** Shelved code is kept in this codebase, so the rules have to read past it. */
const code = (...p: string[]) => read(...p)
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');

const wizard = () => code('features', 'love', 'components', 'ProposalWizardView.tsx');

const isEmoji = (ch: string): boolean => {
    const o = ch.codePointAt(0) ?? 0;
    return (o >= 0x1F300 && o <= 0x1FAFF)
        || (o >= 0x2600 && o <= 0x27BF)
        || (o >= 0x2B00 && o <= 0x2BFF);
};

describe('the venues', () => {
    it('are a list rather than one at a time', () => {
        expect(wizard()).toContain('PROPOSAL_LOCATIONS.map');
        expect(wizard()).not.toContain('onCycleLocation');
        expect(wizard()).toMatch(/onPickLocation\(index\)/);
    });

    it('and the ones you cannot afford stay on it', () => {
        // A row that vanishes teaches nothing, and a price you cannot see is
        // not a thing to grow towards. Same argument as the financing routes
        // on the acquisition screen.
        expect(wizard()).toMatch(/const affordable = money >= place\.cost/);
        expect(wizard()).toMatch(/venueRowOff/);
    });

    it('and each one carries its own icon, in the data', () => {
        // A lookup table in the view would be a second list to keep in step
        // with this one.
        expect(PROPOSAL_LOCATIONS.length).toBeGreaterThan(10);
        for (const place of PROPOSAL_LOCATIONS) {
            expect(typeof place.icon).toBe('string');
            expect(place.icon.length).toBeGreaterThan(2);
        }
    });

    it('and the list is capped, so the propose button stays on screen', () => {
        expect(wizard()).toMatch(/venueList:\s*\{[^}]*maxHeight/);
    });
});

describe('the symbols', () => {
    it('are icons, not emoji', () => {
        const offenders = wizard()
            .split('\n')
            .filter(l => [...l].some(isEmoji));
        expect(offenders).toEqual([]);
    });

    it('and come from the set the rest of the app uses', () => {
        expect(wizard()).toContain('MaterialCommunityIcons');
    });
});

describe('the answer', () => {
    it('is not coloured like a quarter', () => {
        // Green and red mean profit and loss in this game and nothing else -
        // rule 3 in core/theme.ts. Getting married is not a quarter.
        expect(wizard()).not.toMatch(/colors\.success/);
        expect(wizard()).not.toMatch(/colors\.danger/);
    });

    it('and having no ring is not a loss either', () => {
        // It is a thing to go and fix. The Go Shopping button is right there.
        expect(wizard()).toMatch(/love\.noRing/);
        expect(wizard()).not.toMatch(/noRing[\s\S]{0,120}colors\.danger/);
    });
});

describe('the sheet it is asked in', () => {
    const screen = () => code('features', 'profile', 'screens', 'FamilyMemberScreen.tsx');

    it('uses the palette rather than two hex values that once matched it', () => {
        expect(screen()).toMatch(/modalCard:\s*\{[\s\S]{0,300}theme\.colors\.surfaceRaised/);
        expect(screen()).not.toMatch(/modalCard:\s*\{[\s\S]{0,300}'#434B50'/);
    });

    it('and stays a modal, because it is a decision rather than a place', () => {
        // The rule this codebase settled on. A proposal has an answer and then
        // it is over, like the IPO and the plant rebuild.
        expect(screen()).toContain('<ProposalWizardView');
        expect(screen()).toMatch(/modalCard:\s*\{[\s\S]{0,300}maxHeight/);
    });
});
