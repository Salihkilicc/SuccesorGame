// src/data/events/pearEscalation.test.ts
//
// ============================================================================
//  TWENTY PROMPTS OF A RULE, SPENT ON ONE MESSAGE
// ============================================================================
//
//  The cast file said, in prompt 3, before any of this existed:
//
//      "MAIL ONLY, and this is the character. He does not have your number and
//       has never wanted it. If he ever texts you, something has broken in him
//       - which is a scene worth saving for."
//
//  Everything here protects that. The letters have to stay letters, the break
//  has to happen exactly once, and it has to be earned by something the player
//  DID rather than by hostility alone - being hated is not the same as having
//  beaten anybody.
// ============================================================================

import {
    pearPatent, pearPatentEvent,
    pearSuppliers, pearSuppliersEvent,
    pearPriceWar, pearPriceWarEvent,
    pearMidnight, pearMidnightEvent,
} from './pearEscalation';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { canUseChannel } from '../../core/story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS, type StoryFlag } from '../../core/story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));
const LETTERS = [pearPatent, pearSuppliers, pearPriceWar];

const world = (over: {
    hostility?: number;
    share?: number;
    /** Merged on top of the usual "father dead, Pear refused". */
    flags?: Partial<Record<StoryFlag, true>>;
    /**
     * REPLACES the base flags rather than merging.
     *
     * The first version of this helper only merged, so the test for "somebody
     * who never refused him" could not express itself - `refusedPear` was in
     * the base and no argument could take it out. It passed a world that
     * HAD refused and asserted the letters would not arrive, which is a claim
     * about nothing.
     */
    onlyFlags?: Partial<Record<StoryFlag, true>>;
} = {}): World => ({
    dials: { ...INITIAL_DIALS, pearHostility: over.hostility ?? 85 },
    flags: over.onlyFlags
        ?? { fatherDead: true, refusedPear: true, ...(over.flags ?? {}) },
    quarter: 24,
    capital: 80_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: over.share ?? 4,
});

describe('all of it is in the game', () => {
    it('registered, valid, in the pool', () => {
        for (const c of [...LETTERS, pearMidnight]) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of [pearPatentEvent, pearSuppliersEvent, pearPriceWarEvent, pearMidnightEvent]) {
            expect(ids).toContain(e.id);
        }
    });
});

describe('the letters stay letters', () => {
    it('all three are mail, and he still does not use anything else', () => {
        for (const c of LETTERS) expect(c.channel).toBe('mail');
        expect(canUseChannel(CAST.pear, 'message')).toBe(false);
    });

    it('and he never signs one himself', () => {
        // Vogel is travelling. Permanently. For years.
        expect(pearPatent.nodes[0].text).toContain('on behalf of Nathan Vogel');
    });

    it('they escalate with hostility rather than all arriving at once', () => {
        const irritated = world({ hostility: 55 });
        expect(testAll(pearPatentEvent.when, irritated)).toBe(true);
        expect(testAll(pearSuppliersEvent.when, irritated)).toBe(false);
        expect(testAll(pearPriceWarEvent.when, irritated)).toBe(false);

        const atWar = world({ hostility: 85 });
        expect(testAll(pearSuppliersEvent.when, atWar)).toBe(true);
        expect(testAll(pearPriceWarEvent.when, atWar)).toBe(true);
    });

    it('and none of them arrive for somebody who never refused him', () => {
        const neverAsked = world({ onlyFlags: { fatherDead: true } });
        for (const e of [pearPatentEvent, pearSuppliersEvent, pearPriceWarEvent]) {
            expect(testAll(e.when, neverAsked)).toBe(false);
        }
    });

    it('the supplier letter is a copy of one sent to somebody else', () => {
        // The cruellest of the three: he is not negotiating with the player,
        // he is negotiating around them and sending a copy.
        expect(pearSuppliers.subject!.startsWith('FW:')).toBe(true);
        expect(pearSuppliers.nodes[0].text).toContain('Forwarded for your information');
    });

    it('and the price cut is a category decision that is not about you', () => {
        expect(pearPriceWar.nodes[0].text).toContain('not directed at any particular');
        // Pressed, he agrees in a way that is worse than denying.
        const node = pearPriceWar.nodes.find(n => n.id === 'directed')!;
        expect(node.text).toContain('a property of the participants rather than of the decision');
    });
});

describe('and then he texts, exactly once', () => {
    it('it is the only conversation in the game that breaks a channel rule', () => {
        const breaks = CONVERSATIONS.filter(c => c.channelBreak);
        expect(breaks.map(c => c.id)).toEqual([pearMidnight.id]);
    });

    it('and the break is declared, so the audit permits it deliberately', () => {
        // Probed by deleting the declaration: the validator reports
        // "Nathan Vogel does not use message (mail only)". The rule is intact
        // and this is an exception somebody had to write a sentence for.
        expect(pearMidnight.channelBreak).toBeTruthy();
        expect(pearMidnight.channelBreak!.length).toBeGreaterThan(60);
        expect(validate({ ...pearMidnight, channelBreak: undefined }, CAST, known)
            .map(p => p.kind)).toContain('wrong-channel');
    });

    it('hostility alone does not earn it', () => {
        // Being hated is not the same as having beaten anybody. Without the
        // share or the bid, the letters are all he sends.
        const hatedButLosing = world({ hostility: 95, share: 3 });
        expect(testAll(pearMidnightEvent.when, hatedButLosing)).toBe(false);
    });

    it('taking the category does', () => {
        expect(testAll(pearMidnightEvent.when, world({ share: 12 }))).toBe(true);
    });

    it('and so does going for the company itself', () => {
        expect(testAll(pearMidnightEvent.when,
            world({ share: 3, flags: { movedOnPear: true } }))).toBe(true);
    });

    it('it happens once, ever', () => {
        expect(pearMidnightEvent.cooldown).toBeUndefined();
        const after = world({ share: 12, flags: { droveHimToIt: true } });
        expect(testAll(pearMidnightEvent.when, after)).toBe(false);
    });
});

describe('what the message actually is', () => {
    const text = pearMidnight.nodes.map(n => n.text).join(' ');

    it('is not a threat, and says so', () => {
        // The letters were the threats. He has nothing left to send, which is
        // why he sends the one thing he never has.
        expect(text).toContain('I have sent you the threats');
    });

    it('opens with the timestamp and where he got the number', () => {
        // The fact that he has had it for six years is the loudest thing in
        // the message and it is in the first line, stated as admin.
        expect(pearMidnight.nodes[0].text).toContain('00:41');
        expect(pearMidnight.nodes[0].text).toContain('2019 supplier register');
    });

    it('and he is not angry - he is interested, which is worse', () => {
        expect(text).toContain('I wanted to know what it was like to type it');
    });

    it('the one true thing is about the father, and it costs him to say', () => {
        // The only warmth Vogel shows in the entire game, and it is a
        // concession he has been holding since the Lisbon postscript.
        expect(text).toContain('Your father was better than me');
        expect(text).toContain('he would not do the two or three things I was willing to do');
    });

    it('every ending to it closes the number', () => {
        // He used it once. Whatever the player says, he goes back to the
        // office - and the player only notices in retrospect.
        for (const node of pearMidnight.nodes) {
            const terminal = (node.choices ?? []).filter(c => !c.next);
            for (const c of terminal) {
                expect((c.effects ?? []).some(e =>
                    e.kind === 'flag' && (e as any).flag === 'droveHimToIt')).toBe(true);
            }
        }
    });

    it('and telling him to go to bed is an available answer', () => {
        const node = pearMidnight.nodes.find(n => n.id === 'goToBed')!;
        expect(node.text).toContain('I will not use this number again');
    });
});
