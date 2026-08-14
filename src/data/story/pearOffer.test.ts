// src/data/story/pearOffer.test.ts
//
// ============================================================================
//  THE END OF THE FIRST YEAR
// ============================================================================
//
//  Two things are being protected here and they pull in opposite directions.
//
//  The ending must be REACHABLE - it is a secret, and a secret that cannot be
//  found is a bug rather than a secret. And it must not be reachable by
//  ACCIDENT: a player who taps through a long letter and finds they have sold
//  their father's company will not own that decision, they will feel robbed
//  of it.
//
//  The rest is the letter's contempt, which is made of small administrative
//  details that any tidying pass would remove as errors. They are the scene.
// ============================================================================

import { pearOffer } from './pearOffer';
import { fatherDeath } from './fatherDeath';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { ENDINGS } from './endings';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { canUseChannel } from '../../core/story/cast';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';
import { activeLock, emptyLockState } from '../../core/tutorial/locks';
import { INITIAL_DIALS } from '../../core/story/state';
import type { Effect } from '../../core/story/effects';
import type { World } from '../../core/story/conditions';

const known = new Set(CONVERSATIONS.map(c => c.id));
const letter = pearOffer.nodes.map(n => n.text).join(' ');

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 5,
    capital: 5_000_000,
    cash: 100_000,
    morale: 71,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

const effectsOf = (conversationId: string): Effect[] => {
    const c = CONVERSATIONS.find(x => x.id === conversationId)!;
    return c.nodes.flatMap(n => (n.choices ?? []).flatMap(ch => ch.effects ?? []));
};

describe('the father dies at the end of the first year', () => {
    it('is a beat that fires on its own, not one another scene has to remember', () => {
        expect(STORY_BEATS.map(b => b.conversation)).toContain(fatherDeath.id);
        // And it is the one that bypasses the allowance. The offer that
        // follows it decides whether there is a game after this quarter.
        expect(STORY_BEATS.find(b => b.conversation === fatherDeath.id)!.urgent).toBe(true);
        expect(validate(fatherDeath, CAST, known)).toEqual([]);
    });

    it('and every tutorial lock lifts when he does', () => {
        // Designed three prompts before this scene existed: every lock carries
        // `noFlag: fatherDead`. The teaching layer does not fade out, it
        // stops, because the man doing the teaching stopped.
        const fresh = emptyLockState();
        expect(activeLock(TUTORIAL_SEQUENCE, fresh, world())).toBeDefined();
        expect(activeLock(TUTORIAL_SEQUENCE, fresh, world({ flags: { fatherDead: true } })))
            .toBeUndefined();
    });

    it('he gets no last words, only an instruction about inventory', () => {
        // The whole first year rests on "is he right or is he obsessed", and
        // a deathbed scene ANSWERS that. Warm at the end and he was a good man
        // being difficult; paranoid at the end and he was ill. Either way the
        // question dies with him and the next fifty years lose it.
        expect(fatherDeath.nodes.map(n => n.text).join(' ')).toContain('inventory line does not match');
    });

    it('and the last time it can be checked, he was right', () => {
        const node = fatherDeath.nodes.find(n => n.id === 'wasHeRight')!;
        expect(node.text).toContain('He was right');
    });

    it('and asking for a day does not buy one', () => {
        // ------------------------------------------------------------------
        //  THE SCHEDULE IS GONE FROM THIS SCENE ENTIRELY
        // ------------------------------------------------------------------
        //  Both answers used to schedule Pear's letter, identically, so that
        //  asking for a day bought nothing. The lesson is intact and it is
        //  now free: the letter is a beat with a quarter number on it, so
        //  neither answer affects when it lands because neither answer is
        //  connected to it at all.
        //
        //  Which is the honest version. He wrote in the sixth quarter
        //  because the story says he does - see the note at the top of
        //  pearOffer.ts - and making that depend on a scene being reached,
        //  delivered, opened and answered gave a fixed beat four ways not to
        //  happen. All four happened.
        // ------------------------------------------------------------------
        const close = fatherDeath.nodes.find(n => n.id === 'tellThem')!;
        for (const choice of close.choices!) {
            expect((choice.effects ?? []).filter(e => e.kind === 'schedule'))
                .toEqual([]);
        }
        // And what the scene DOES do, on both answers, is the one thing only
        // it can: establish that he is dead.
        for (const choice of close.choices!) {
            expect((choice.effects ?? []).some((e: any) =>
                e.kind === 'flag' && e.flag === 'fatherDead')).toBe(true);
        }
    });
});

describe('the letter is dictated, not written', () => {
    it('arrives by mail, because he does not have your number', () => {
        expect(pearOffer.channel).toBe('mail');
        expect(canUseChannel(CAST.pear, 'message')).toBe(false);
        expect(validate(pearOffer, CAST, known)).toEqual([]);
    });

    it('the subject line is a workflow with your family in it', () => {
        expect(pearOffer.subject).toContain('ref');
        expect(pearOffer.subject).toContain('condolence');
    });

    it('is addressed to the dead man', () => {
        // "Dear Mr Hale" is the father and, now, the player. Nobody updated
        // the address book. It is not even wrong.
        //
        // The TITLE is a token, filled from the gender the player gave on the
        // first screen - the game asked and then addressed everybody as Mr,
        // which is a question asked in order to be contradicted. The surname
        // is the joke and stays literal. See the note on `{title}` in
        // data/i18n/storyText.ts.
        expect(letter).toContain('Dear {title} Hale');
    });

    it('and the title is the one thing in it that knows who you are', () => {
        const { line, nodeKey } = require('../i18n/storyText');
        const { useIdentityStore } = require('../../core/store/useIdentityStore');
        const node = pearOffer.nodes.find(n => n.id === pearOffer.start)!;

        useIdentityStore.setState({ gender: 'female' });
        expect(line(nodeKey(pearOffer.id, node.id), node.text)).toContain('Dear Ms Hale');

        useIdentityStore.setState({ gender: 'male' });
        expect(line(nodeKey(pearOffer.id, node.id), node.text)).toContain('Dear Mr Hale');
    });

    it('one merge field did not populate, and only one', () => {
        // Used once so it lands as a fact about the machine rather than as a
        // running gag. Two would be a joke; one is an accident nobody caught.
        const merges = letter.match(/«[A-Z]+»/g) ?? [];
        expect(merges).toHaveLength(1);
    });

    it('promises an attachment that is not attached', () => {
        expect(letter).toContain('set out in the attached');
    });

    it('and Vogel does not sign it himself', () => {
        expect(letter).toContain('on behalf of Nathan Vogel');
    });

    it('never calls the player "you" as a person', () => {
        // The insult is the format. He uses the estate, the holder, the
        // counterparty - and "your staff", which is about the staff.
        expect(letter).toContain('the holder');
        expect(letter).toContain('the counterparty');
    });

    it('the only human line in it is about somebody else', () => {
        expect(letter).toContain('P.S.');
        expect(letter).toContain('Lisbon');
    });
});

describe('yes is a real ending', () => {
    it('the ending it names exists', () => {
        const ends = effectsOf(pearOffer.id).filter(e => e.kind === 'ending') as any[];
        expect(ends).toHaveLength(1);
        expect(ENDINGS[ends[0].ending]).toBeDefined();
    });

    it('and pays a fair price rather than a humiliating one', () => {
        // An insultingly low offer is easy to refuse, and the scene would
        // cost nothing to walk away from. The price has to be good.
        const cash = effectsOf(pearOffer.id).filter(e => e.kind === 'cash') as any[];
        expect(cash).toHaveLength(1);
        expect(cash[0].amount).toBeGreaterThan(40_000_000);
    });

    it('the ending text does not tell the player they were wrong', () => {
        const body = ENDINGS.soldToPear.body.toLowerCase();
        expect(body).not.toContain('should have');
        expect(body).not.toContain('mistake');
        // The bitterness is entirely in the specifics.
        expect(body).toContain('footnote');
    });

    it('but it cannot be reached by tapping through', () => {
        // There is a way back on the last card. An ending arrived at by
        // drifting is one the player will not own afterwards.
        const accept = pearOffer.nodes.find(n => n.id === 'accept')!;
        expect(accept.choices!.some(c => c.next === 'decline')).toBe(true);
        // And the only choice carrying the ending says what it does.
        const signing = accept.choices!.find(c => (c.effects ?? []).some(e => e.kind === 'ending'))!;
        expect(signing.text).toBe('Sign it.');
    });
});

describe('no starts the actual game', () => {
    it('every way of declining raises hostility', () => {
        const decline = pearOffer.nodes.find(n => n.id === 'decline')!;
        expect(decline.choices!.length).toBeGreaterThan(1);
        for (const choice of decline.choices!) {
            const dials = (choice.effects ?? []).filter(e => e.kind === 'dial') as any[];
            const hostility = dials.find(d => d.dial === 'pearHostility');
            expect(hostility).toBeDefined();
            expect(hostility.delta).toBeGreaterThan(0);
        }
    });

    it('and saying it out loud costs more than silence', () => {
        const decline = pearOffer.nodes.find(n => n.id === 'decline')!;
        const [quiet, loud] = decline.choices!.map(c =>
            ((c.effects ?? []).find(e => e.kind === 'dial' && (e as any).dial === 'pearHostility') as any).delta);
        expect(loud).toBeGreaterThan(quiet);
    });

    it('he does not argue, threaten, or improve the offer', () => {
        // Four words. He is not going to fight; he is going to wait, and he
        // has more time than the player does.
        const decline = pearOffer.nodes.find(n => n.id === 'decline')!;
        expect(decline.text).toBe('Noted. We will revisit.');
    });

    it('declining does not end the game', () => {
        const decline = pearOffer.nodes.find(n => n.id === 'decline')!;
        for (const choice of decline.choices!) {
            expect((choice.effects ?? []).some(e => e.kind === 'ending')).toBe(false);
        }
    });
});
