// src/core/luxury/luxuryNewsAndMail.test.ts
//
// ============================================================================
//  BUYING A WATCH DELETED THE QUARTER'S NEWS
// ============================================================================
//
//  Two defects in one function, found while wiring the shop into the wire.
//
//  ---------------------------------------------------------------------------
//  1. THE WRONG PUBLISHER
//  ---------------------------------------------------------------------------
//  `useNewsStore` has two ways to publish and they do opposite things:
//
//      addNewsBatch    set({ newsHistory: formattedItems })   REPLACES
//      addSingleNews   [item, ...history].slice(0, MAX)       PREPENDS
//
//  The first is right for what it is - the quarterly edition arriving all at
//  once - and catastrophic for a single event. `personalEventsLogic` called it
//  twice: once for a luxury purchase and once for a partner crisis. So buying
//  a ring wiped every story in the quarter and left the feed showing one item,
//  and a divorce did the same.
//
//  `relationshipEvents.ts` has always called the right one, four times over,
//  which is what made this findable: two files doing the same job through
//  different doors.
//
//  ---------------------------------------------------------------------------
//  2. EVERY PURCHASE LED THE EDITION
//  ---------------------------------------------------------------------------
//  Asked for as "I do not want it making news of everything, expensive things
//  should make news". Every purchase published, and every one was
//  `isHero: true`, so a $500,000 ring took the top of the front page off a
//  quarter in which the company had launched a product.
//
//  The thresholds are READ OFF the catalogue, not picked:
//
//      under $25M      45% of the 85 items    silent
//      $25M to $500M   36%                    a story
//      over $500M      19%                    the front page
// ============================================================================

import fs from 'fs';
import path from 'path';
import { NEWS_FLOOR, NEWS_HERO_FLOOR, announceLuxuryPurchase } from '../../logic/personalEventsLogic';
import { PROMO_NET_WORTH_FLOOR, promoLetter } from './postLuxuryPromo';
import { featuredFor } from './promotions';
import { useNewsStore } from '../store/useNewsStore';
import { useStatsStore } from '../store/useStatsStore';
import { ITEMS, SHOPS } from '../../features/shopping/data/shoppingRegistry';

const feed = () => useNewsStore.getState().newsHistory;

const cheapest = () => [...ITEMS].sort((a, b) => a.price - b.price)[0];
const dearest = () => [...ITEMS].sort((a, b) => b.price - a.price)[0];
const middling = () => ITEMS.find(i => i.price > NEWS_FLOOR && i.price < NEWS_HERO_FLOOR)!;

beforeEach(() => {
    useNewsStore.getState().reset();
    useStatsStore.setState({ money: 50_000_000_000, brandValue: 18 } as never);
});

describe('a purchase no longer deletes the news', () => {
    it('a story published before it is still there afterwards', () => {
        // THE DEFECT, as one assertion.
        useNewsStore.getState().addSingleNews({
            type: 'world', text: 'Something else happened this quarter.', quarter: 1,
        });
        expect(feed().length).toBe(1);

        announceLuxuryPurchase(dearest());
        expect(feed().length).toBe(2);
        expect(feed().some(n => n.text.includes('Something else happened'))).toBe(true);
    });

    it('and two purchases are two stories, not one', () => {
        announceLuxuryPurchase(dearest());
        announceLuxuryPurchase(middling());
        expect(feed().length).toBe(2);
    });

    it('and the new one is at the top, where a new story goes', () => {
        useNewsStore.getState().addSingleNews({
            type: 'world', text: 'Older.', quarter: 1,
        });
        const item = dearest();
        announceLuxuryPurchase(item);
        expect(feed()[0].text).toContain(item.name);
    });
});

describe('and only the expensive things are news', () => {
    it('a ring is not a story', () => {
        // 45% of the catalogue. Asked for in those words.
        const item = cheapest();
        expect(item.price).toBeLessThan(NEWS_FLOOR);

        const result = announceLuxuryPurchase(item);
        expect(feed().length).toBe(0);
        expect(result.newsHeadline).toBe('');
    });

    it('but it still moves the brand, because being seen is worth something', () => {
        // The two halves measure different things and only one of them has a
        // threshold. Deleting the news must not delete the reputation.
        const before = useStatsStore.getState().brandValue;
        const result = announceLuxuryPurchase(cheapest());
        expect(result.brandValueDelta).toBeGreaterThan(0);
        expect(useStatsStore.getState().brandValue).toBeGreaterThan(before);
    });

    it('and a jet is a story but not the front page', () => {
        const item = middling();
        announceLuxuryPurchase(item);
        expect(feed().length).toBe(1);
        expect(feed()[0].isHero).toBe(false);
    });

    it('and an island leads the edition', () => {
        const item = dearest();
        expect(item.price).toBeGreaterThanOrEqual(NEWS_HERO_FLOOR);
        announceLuxuryPurchase(item);
        expect(feed()[0].isHero).toBe(true);
    });

    it('and the thresholds actually divide the catalogue rather than sitting outside it', () => {
        // A floor above the most expensive item would silence the shop
        // entirely and every test above would still pass.
        const silent = ITEMS.filter(i => i.price < NEWS_FLOOR).length;
        const hero = ITEMS.filter(i => i.price >= NEWS_HERO_FLOOR).length;
        expect(silent).toBeGreaterThan(ITEMS.length * 0.3);
        expect(silent).toBeLessThan(ITEMS.length * 0.6);
        expect(hero).toBeGreaterThan(ITEMS.length * 0.1);
        expect(hero).toBeLessThan(ITEMS.length * 0.3);
        expect(NEWS_HERO_FLOOR).toBeGreaterThan(NEWS_FLOOR);
    });
});

// ============================================================================
//  AND THE PROMOTIONS FOLDER FINALLY HAS SOMETHING IN IT
// ============================================================================
//
//  `useMailStore` has had three categories since it was written and has only
//  ever used two. This is what `Promotions` was for.
// ============================================================================

describe('the boutiques write to you', () => {
    it('a letter names the offer that is actually running', () => {
        const featured = featuredFor(SHOPS, 4);
        const lead = featured.find(f => f.discount > 0)!;
        const letter = promoLetter(featured, 'Mr Hale')!;

        expect(letter).not.toBeNull();
        expect(letter.fromName).toContain(lead.shop.name);
        expect(letter.body).toContain(`${Math.round(lead.discount * 100)} per cent`);
    });

    it('and it addresses the player by name', () => {
        const letter = promoLetter(featuredFor(SHOPS, 4), 'Ms Vance')!;
        expect(letter.subject).toContain('Ms Vance');
        expect(letter.body.startsWith('Ms Vance')).toBe(true);
    });

    it('and it lists the other houses running something', () => {
        const featured = featuredFor(SHOPS, 4);
        const others = featured.filter(f => f.discount > 0).slice(1);
        const letter = promoLetter(featured, 'Mr Hale')!;
        for (const o of others) {
            expect([o.shop.name, letter.body.includes(o.shop.name)])
                .toEqual([o.shop.name, true]);
        }
    });

    it('and there is no letter when nothing is on offer', () => {
        // Cannot currently happen and handled anyway: a promotions folder
        // filling with letters about no offer is the failure this avoids.
        expect(promoLetter([], 'Mr Hale')).toBeNull();
        expect(promoLetter(
            featuredFor(SHOPS, 4).map(f => ({ ...f, discount: 0 })), 'Mr Hale',
        )).toBeNull();
    });

    it('and it obeys the house rule on dashes', () => {
        // Player visible text. Hyphenated words are fine; a dash is not.
        for (const q of [0, 2, 6, 20]) {
            const letter = promoLetter(featuredFor(SHOPS, q), 'Mr Hale');
            if (!letter) continue;
            for (const s of [letter.subject, letter.body, letter.fromName]) {
                expect([q, /—/.test(s)]).toEqual([q, false]);
                expect([q, /\s-\s/.test(s)]).toEqual([q, false]);
            }
        }
    });

    it('and it does not arrive before the player is worth writing to', () => {
        // The whole joke of this kind of mail is that it finds you. A founder
        // on a $45,000 salary getting a superyacht broker's letter in the
        // second quarter reads as spam rather than as arrival.
        expect(PROMO_NET_WORTH_FLOOR).toBeGreaterThan(1_000_000);
    });
});

// ============================================================================
//  AND SOMETHING HAS TO POST IT
// ============================================================================
//
//  Everything above passes on a build where the quarterly tick has never heard
//  of any of it, which is the state the maintenance cost, the appreciation
//  rate, the luxury row and the whole LuxoNet store were found in.
// ============================================================================

describe('and the quarter actually posts it', () => {
    const src = () => fs.readFileSync(
        path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8',
    )
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');

    it('the tick calls it, with the quarter and the shops', () => {
        expect(src()).toMatch(
            /require\('\.\.\/luxury\/postLuxuryPromo'\)\.postLuxuryPromo\(/,
        );
        expect(src()).toMatch(/shoppingRegistry'\)\.SHOPS,/);
    });

    it('and it sits beside the letter that does the same job', () => {
        // `postSponsorOffer` is the same operation with a different sender,
        // and keeping the two together is how the next person finds both.
        const s = src();
        const sponsor = s.indexOf('postSponsorOffer(');
        const promo = s.indexOf('postLuxuryPromo(');
        expect(sponsor).toBeGreaterThan(-1);
        expect(promo).toBeGreaterThan(sponsor);
        expect(promo - sponsor).toBeLessThan(1200);
    });

    it('and it only fires at the top of a campaign window', () => {
        // A letter every quarter is furniture, which is the reasoning the
        // sponsorship letter's drought counter already gives.
        const file = fs.readFileSync(path.join(__dirname, 'postLuxuryPromo.ts'), 'utf8');
        expect(file).toMatch(/if \(q % CAMPAIGN_QUARTERS !== 0\) return;/);
    });

    it('and it puts the letter in the folder that was empty for years', () => {
        const file = fs.readFileSync(path.join(__dirname, 'postLuxuryPromo.ts'), 'utf8');
        expect(file).toMatch(/category: 'Promotions'/);
    });
});

// ============================================================================
//  AND THE OTHER FILE THAT CALLED THE WRONG PUBLISHER
// ============================================================================

describe('the partner crisis publishes the same way', () => {
    it('it prepends rather than replacing, like everything else that is an event', () => {
        // COMMENTS STRIPPED. The note left at the fix names the function it
        // stopped calling, and a plain search finds the note. This project has
        // produced that exact false positive three times now, which is itself
        // worth writing down: an audit that reads source as text has to read
        // LIVE source as text.
        const file = fs.readFileSync(
            path.join(__dirname, '..', '..', 'logic', 'personalEventsLogic.ts'), 'utf8',
        )
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter(l => !/^\s*(\/\/|\*)/.test(l))
            .map(l => l.replace(/\s\/\/.*$/, ''))
            .join('\n');

        // Both call sites in the file, and neither of them is the batch.
        expect(file).not.toMatch(/addNewsBatch/);
        expect((file.match(/addSingleNews/g) || []).length).toBe(2);
    });
});

// ============================================================================
//  AND HOW OFTEN THE BOUTIQUE WRITES
// ============================================================================
//
//  Reported as arriving nearly every quarter and reading too long to be
//  believable. It was every SECOND quarter, for the whole run, and the body
//  ran to about a hundred and thirty words of boutique prose.
// ============================================================================

describe('the private client letter is rare and short', () => {
    const { PROMO_EVERY_WINDOWS, promoLetter } = require('./postLuxuryPromo');
    const { CAMPAIGN_QUARTERS } = require('./promotions');

    /** The quarters a letter can go out on, by the two rules in the file. */
    const sendsOn = (upTo: number) => {
        const out: number[] = [];
        for (let q = 0; q <= upTo; q++) {
            if (q % CAMPAIGN_QUARTERS !== 0) continue;
            if (Math.floor(q / CAMPAIGN_QUARTERS) % PROMO_EVERY_WINDOWS !== 0) continue;
            out.push(q);
        }
        return out;
    };

    it('one letter every six quarters, not every two', () => {
        const qs = sendsOn(40);
        expect(qs.length).toBeGreaterThan(3);
        for (let i = 1; i < qs.length; i++) {
            expect(qs[i] - qs[i - 1]).toBe(CAMPAIGN_QUARTERS * PROMO_EVERY_WINDOWS);
        }
        // A year and a half apart.
        expect(CAMPAIGN_QUARTERS * PROMO_EVERY_WINDOWS).toBe(6);
    });

    it('and it still lands at the top of a live campaign window', () => {
        // The offer inside has to be running, or the letter advertises
        // nothing. Every send quarter is a window opening.
        for (const q of sendsOn(40)) expect(q % CAMPAIGN_QUARTERS).toBe(0);
    });

    it('and the body is two lines rather than an essay', () => {
        const letter = promoLetter(
            [{ shop: { name: 'A House', description: 'x' }, discount: 0.2 }] as never,
            'Mr Hale',
        );
        expect(letter).not.toBeNull();
        const words = letter!.body.trim().split(/\s+/).length;
        expect(words).toBeLessThan(40);
        // The claim the letter is actually making.
        expect(letter!.body).toContain('20 per cent');
    });
});
