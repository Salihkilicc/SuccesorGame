// src/core/story/firstYear.test.ts
//
// ============================================================================
//  THE FIRST YEAR HAPPENS IN MESSAGES, NOT IN MAIL
// ============================================================================
//
//  "Only sponsorship offers arrive" is a correct observation about the Mail
//  app and a wrong conclusion about the game, and working that out took
//  several days.
//
//  The channel split is deliberate and is written down in data/story/cast.ts:
//  mail is DISTANCE - it has a subject line, it was written to be forwarded,
//  somebody's assistant probably typed it - and everyone who uses only mail
//  is someone who does not consider you a peer. Messages are PROXIMITY. Your
//  father does not send you letters.
//
//  So the first year is his, and it is entirely in Messages. The Mail app
//  genuinely holds nothing but the seeded letters and a sponsorship offer
//  every third quarter, until Pear writes.
//
//  ---------------------------------------------------------------------------
//  AND THE SPINE RUNS THROUGH ONE MESSAGE THREAD
//  ---------------------------------------------------------------------------
//  The death is a message from the CFO. `fatherDead` is raised by PLAYING it,
//  Pear's letter is gated on that flag, and the condolence wave is gated on
//  Pear having been answered. A player who never opens Messages sees the
//  sponsorship letters arrive forever and nothing else, and nothing anywhere
//  is wrong.
//
//  That is worth a test rather than a comment, because it is the shape of the
//  game and every future "nothing is arriving" starts here.
// ============================================================================

import { CONVERSATIONS } from '../../data/story';

const byChannel = (channel: 'mail' | 'message') =>
    CONVERSATIONS.filter(c => c.channel === channel);

describe('the channel split', () => {
    it('is mostly messages, because most of the cast is close to you', () => {
        expect(byChannel('message').length).toBeGreaterThan(byChannel('mail').length);
    });

    it('and the father never writes a letter', () => {
        const his = CONVERSATIONS.filter(c => c.from === 'father');
        expect(his.length).toBeGreaterThan(3);
        expect(his.every(c => c.channel === 'message')).toBe(true);
    });

    it('while Pear writes letters, and texts exactly once', () => {
        // ------------------------------------------------------------------
        //  THE EXCEPTION IS THE PAYOFF, NOT AN OVERSIGHT
        // ------------------------------------------------------------------
        //  data/story/cast.ts, on Pear: "MAIL ONLY, and this is the
        //  character. He does not have your number and has never wanted it.
        //  If he ever texts you, something has broken in him - which is a
        //  scene worth saving for."
        //
        //  event-pear-midnight is that scene. A blanket "he only ever writes
        //  letters" would have deleted the one moment the rule exists to set
        //  up, which is what nearly happened when this test was written.
        // ------------------------------------------------------------------
        const his = CONVERSATIONS.filter(c => c.from === 'pear');
        const texts = his.filter(c => c.channel === 'message');
        expect(his.length).toBeGreaterThan(4);
        expect(texts.map(c => c.id)).toEqual(['event-pear-midnight']);
    });
});

describe('what the Mail app actually holds in the first year', () => {
    it('almost nothing, and that is not a fault', () => {
        // Of the mail scenes, all but a handful are random events - and those
        // are gated on a grown company and a dead father, so none of them can
        // fire in the first year. What is left is Pear, the condolences that
        // follow him, and three notes from inside the company.
        const { EVENTS } = require('../../data/events');
        const eventScenes = new Set(
            EVENTS.map((e: any) => e.conversation?.id).filter(Boolean),
        );
        const notRandom = byChannel('mail').filter(c => !eventScenes.has(c.id));
        expect(byChannel('mail').length - notRandom.length).toBeGreaterThan(20);
        expect(notRandom.length).toBeLessThan(10);
    });

    it('and the first thing that does arrive is on a quarter, not a flag', () => {
        // pear-offer is the earliest, and it used to be gated on the father
        // being dead - a flag raised by playing a MESSAGE, in the app the
        // player was not looking at. The opening act is a script: he writes
        // in the sixth quarter because the story says so.
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        expect(JSON.stringify(pear.when)).toContain('quarterAtLeast');
        expect(JSON.stringify(pear.when)).not.toContain('fatherDead');
    });
});

describe('the spine', () => {
    it('runs through messages from the opening to the death', () => {
        for (const id of ['father-inheritance', 'father-q1', 'father-death']) {
            const c = CONVERSATIONS.find(x => x.id === id)!;
            expect(c.channel).toBe('message');
        }
    });

    it('and the death is what unlocks everything after it', () => {
        // Played, not delivered. The flag is on a choice.
        const death = CONVERSATIONS.find(c => c.id === 'father-death')!;
        const raises = death.nodes
            .flatMap(n => n.choices?.flatMap(ch => ch.effects ?? []) ?? [])
            .filter((e: any) => e.kind === 'flag' && e.flag === 'fatherDead');
        expect(raises.length).toBeGreaterThan(0);

        // And every ending of that scene raises it, so no answer strands the
        // player in a game where the father is neither alive nor dead.
        const last = death.nodes.find(n => n.id === 'tellThem')!;
        for (const choice of last.choices!) {
            expect((choice.effects ?? []).some((e: any) =>
                e.kind === 'flag' && e.flag === 'fatherDead')).toBe(true);
        }
    });

    it('and an unread message raises a badge, so it is findable', () => {
        // The only signal the player gets that the story is waiting for them
        // in the other app.
        const { useMessageStore, initialMessageState, unreadCount } =
            require('../store/useMessageStore');
        useMessageStore.setState({ ...initialMessageState, threads: [] });
        useMessageStore.getState().sendFromCharacter(
            { id: 'cfo', name: 'Arthur Vance', role: 'Chief Financial Officer' },
            'I am very sorry.', 13,
        );
        expect(unreadCount(useMessageStore.getState().threads)).toBe(1);
    });
});

// ============================================================================
//  THE SCRIPT IS IN ONE LANGUAGE
// ============================================================================
//  One line was not. The friend's condolence said "geçmiş olsun", which is
//  what you say to somebody who has been ILL - for a death it is "başın
//  sağolsun". So the single foreign phrase in the whole game was a
//  mistranslation, in the condolence scene, in the message that is meant to
//  be the kindest thing anybody says all year.
//
//  It is also a thing a translator has to leave alone in every language,
//  forever, for a joke that works better without it.
// ============================================================================
describe('the script', () => {
    const spoken = () => CONVERSATIONS.flatMap(c => [
        c.subject ?? '',
        ...c.nodes.map(n => n.text),
        ...c.nodes.flatMap(n => (n.choices ?? []).map(ch => ch.text)),
    ]);

    it('has no Turkish letters in any line the player reads', () => {
        // The cheapest possible detector, and it would have caught the one
        // that shipped. Comments are not checked - half this codebase reasons
        // in Turkish and that is fine, because nobody plays the comments.
        const offenders = spoken().filter(t => /[çğıİöşüÇĞÖŞÜ]/.test(t));
        expect(offenders).toEqual([]);
    });

    it('and the friend still reaches for a phrase he cannot check', () => {
        // The beat the Turkish was carrying: a man half-remembering a formula
        // and asking whether he has it right. It is the father's now, which
        // is better - the player would know it and Marco only ever heard it
        // second-hand.
        const friend = CONVERSATIONS.find(c => c.id === 'condolence-friend')!;
        const text = friend.nodes.map(n => n.text).join(' ');
        expect(text).toContain('he had a good run at it');
        expect(text).toContain('you always said it wrong on purpose');
        // And the reply that only makes sense if he was practising a phrase.
        expect(text).toContain('to practise');
    });
});
