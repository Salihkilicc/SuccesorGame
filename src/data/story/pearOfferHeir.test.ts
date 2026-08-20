// src/data/story/pearOfferHeir.test.ts
//
// ============================================================================
//  THE SAME QUESTION, ASKED OF THE NEXT ONE
// ============================================================================
//
//  The spine of this game is one question asked twice: will you sell your
//  father's company. The first act asks it of the founder. This asks it of
//  somebody who never met the man whose name is on the building.
//
//  Two things here are load-bearing and the rest is wiring.
//
//    HE DOES NOT WRITE IF YOU OWN HIM. That silence is the reward for the
//    whole endgame, and a gate that failed open would take it away from the
//    only players who earned it.
//
//    THE LETTER AND THE MONEY AGREE. They did not: the salutation quoted a
//    scaling number and the scene paid a literal, and the patch for that was
//    a special case inside the generic cash effect.
// ============================================================================

import { pearOfferHeir } from './pearOfferHeir';
import { pearOffer } from './pearOffer';
import { pearOfferAmount, PEAR_OFFER_FLOOR, PEAR_OFFER_MULTIPLE } from '../../core/story/pearPrice';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { ENDINGS } from './endings';
import { CAST } from './cast';

const choices = (c: typeof pearOfferHeir) => c.nodes.flatMap(n => n.choices ?? []);
const effects = (c: typeof pearOfferHeir) => choices(c).flatMap(ch => ch.effects ?? []);

describe('when he writes', () => {
    it('is the quarter somebody inherits, which is his whole thesis', () => {
        expect(pearOfferHeir.when).toContainEqual({ kind: 'flag', flag: 'succeeded' });
    });

    it('and NOT if the family already owns him', () => {
        // The silence is the reward. A gate that failed open would take it
        // away from the only players who ever earned it.
        expect(pearOfferHeir.when).toContainEqual({ kind: 'noFlag', flag: 'ownsPear' });
    });

    it('and something actually raises that flag', () => {
        // A gate on a flag nobody writes is a scene that never fires, and it
        // would look entirely correct in every file that mentions it.
        const fs = require('fs');
        const path = require('path');
        const run = fs.readFileSync(
            path.join(__dirname, '..', '..', 'core', 'story', 'runSuccession.ts'), 'utf8',
        );
        expect(run).toMatch(/raise\('succeeded'\)/);
    });

    it('and it arrives once per generation rather than once per save', () => {
        // `seenScenes` is deliberately not cleared by a succession, so without
        // this Pear writes to the second Hale and never to the third - the one
        // silence in this game that would mean nothing.
        const fs = require('fs');
        const path = require('path');
        const run = fs.readFileSync(
            path.join(__dirname, '..', '..', 'core', 'story', 'runSuccession.ts'), 'utf8',
        );
        expect(run).toMatch(/id !== 'pear-offer-heir'/);
    });

    it('and it jumps the queue, because it is the spine', () => {
        const beat = STORY_BEATS.find(b => b.conversation === pearOfferHeir.id);
        expect(beat?.urgent).toBe(true);
        expect(beat?.chance).toBeUndefined();
    });

    it('and the runner can play it', () => {
        expect(CONVERSATIONS.map(c => c.id)).toContain(pearOfferHeir.id);
        expect(pearOfferHeir.channel).toBe('mail');
        expect(CAST.pear.channels).toBe('mail');
        expect(pearOfferHeir.channelBreak).toBeUndefined();
    });
});

describe('what it costs to say yes', () => {
    it('ends the game, and not on the founder\'s ending', () => {
        // `soldToPear` is written for a twenty six year old who had run the
        // company for a year. Its last line is that nobody found out whether
        // he would have been any good at it, which cannot be said to somebody
        // who did not stay long enough to be asked.
        const ends = effects(pearOfferHeir).filter(e => e.kind === 'ending') as any[];
        expect(ends).toHaveLength(1);
        expect(ends[0].ending).toBe('soldWhatYouInherited');
        expect(ENDINGS.soldWhatYouInherited).toBeDefined();
    });

    it('and pays what the letter quoted', () => {
        // Not a literal. See the header of pearPrice.ts for what the literal
        // did at a billion.
        expect(effects(pearOfferHeir).filter(e => e.kind === 'sellToPear')).toHaveLength(1);
        expect(effects(pearOfferHeir).filter(e => e.kind === 'cash')).toEqual([]);
    });

    it('while the first letter now pays the same way', () => {
        expect(effects(pearOffer as any).filter(e => e.kind === 'sellToPear')).toHaveLength(1);
    });

    it('and there is still a way back at the edge', () => {
        // An ending reached by drifting is one the player will not own
        // afterwards, which is why the first letter has this too.
        const accept = pearOfferHeir.nodes.find(n => n.id === 'accept')!;
        expect((accept.choices ?? []).some(c => c.next === 'decline')).toBe(true);
    });

    it('and refusing does not end anything', () => {
        const decline = pearOfferHeir.nodes.find(n => n.id === 'decline')!;
        for (const choice of decline.choices ?? []) {
            expect((choice.effects ?? []).some((e: any) => e.kind === 'ending')).toBe(false);
        }
    });
});

describe('the price', () => {
    it('is a premium, because an insulting offer is easy to refuse', () => {
        expect(PEAR_OFFER_MULTIPLE).toBeGreaterThan(1);
        expect(pearOfferAmount(1_000_000_000)).toBe(1_250_000_000);
    });

    it('and has a floor, for the letter that arrives when he owns a factory', () => {
        // Forty eight million is life changing money for a twenty six year
        // old, which is what makes the early ending a real decision rather
        // than a mistake. It stops binding almost immediately.
        expect(pearOfferAmount(4_500_000)).toBe(PEAR_OFFER_FLOOR);
        expect(pearOfferAmount(0)).toBe(PEAR_OFFER_FLOOR);
    });

    it('and one function answers for both letters', () => {
        // The words used to be computed in data/i18n/storyText.ts and the
        // money in the scene, and they agreed only in the sixth quarter.
        const fs = require('fs');
        const path = require('path');
        const text = fs.readFileSync(
            path.join(__dirname, '..', 'i18n', 'storyText.ts'), 'utf8',
        );
        expect(text).toMatch(/pearOfferAmount/);
        expect(text).not.toMatch(/48_000_000/);
    });

    it('and nonsense in does not become an offer', () => {
        expect(pearOfferAmount(NaN)).toBe(PEAR_OFFER_FLOOR);
        expect(pearOfferAmount(-1e12)).toBe(PEAR_OFFER_FLOOR);
    });
});

describe('the writing', () => {
    const lines = [
        pearOfferHeir.subject ?? '',
        ...pearOfferHeir.nodes.map(n => n.text),
        ...choices(pearOfferHeir).map(c => c.text),
    ];

    it('names the man it is really about', () => {
        expect(lines.join(' ')).toMatch(/your predecessor|your father/i);
    });

    it('and says the cruel thing plainly rather than apologising for it', () => {
        // "A business is never cheaper than in the quarter somebody inherits
        // it." He is not embarrassed and twenty years have not taught him to
        // be, which is the character.
        expect(lines.join(' ')).toMatch(/never cheaper/i);
    });

    it('and no dash got into any of it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        expect(lines.filter(l => DASH.test(l))).toEqual([]);
    });
});
