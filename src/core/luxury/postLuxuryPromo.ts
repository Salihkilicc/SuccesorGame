// src/core/luxury/postLuxuryPromo.ts
//
// ============================================================================
//  THE SHOPS WRITE TO YOU, THE WAY THEY WRITE TO RICH PEOPLE
// ============================================================================
//
//  Asked for as "let us do the advert thing through the mail as well, mail
//  could come to us, like the mail rich people get".
//
//  `useMailStore` has had a `Promotions` category since it was written and
//  NOTHING HAS EVER PUT ANYTHING IN IT. Three categories, two used. Which is
//  this project's usual shape - a field waiting years for a caller - and in
//  this one case the waiting was correct, because the thing that should fill
//  it did not exist until the campaigns did.
//
//  ---------------------------------------------------------------------------
//  IT ARRIVES WHEN THE CAMPAIGN OPENS, NOT EVERY QUARTER
//  ---------------------------------------------------------------------------
//  Same reasoning the sponsorship letter gives for its drought counter: a
//  letter that comes every quarter is furniture, and furniture is not read.
//  A campaign window is two quarters, so the boutique writes once at the top
//  of the window and then leaves you alone.
//
//  ---------------------------------------------------------------------------
//  AND ONLY ONCE YOU ARE WORTH WRITING TO
//  ---------------------------------------------------------------------------
//  The whole joke of this kind of mail is that it finds you. A founder on a
//  $45,000 quarterly salary does not get a letter from a superyacht broker,
//  and one arriving in the second quarter of a run would read as spam rather
//  than as arrival. Gated on net worth, so the first one landing IS the
//  moment something changed.
//
//  PURE UP TO THE POSTING. `promoLetter` takes what it needs and returns a
//  letter or nothing; only `postLuxuryPromo` touches a store.
// ============================================================================

import { useMailStore } from '../store/useMailStore';
import { useStatsStore } from '../store/useStatsStore';
import { useGameStore } from '../store/useGameStore';
import { formatMoney } from '../utils';
import { CAMPAIGN_QUARTERS, featuredFor, type Featured } from './promotions';
import type { Shop } from '../../features/shopping/types';

/**
 * How rich you have to be before the boutiques find you.
 *
 * A hundred million. Below it the letter is a joke at the player's expense
 * rather than at the world's, and the arrival of the first one is worth
 * something as a marker.
 */
export const PROMO_NET_WORTH_FLOOR = 100_000_000;

/**
 * How many campaign windows pass between letters.
 *
 * A window is two quarters, so three windows is six - one letter every year
 * and a half. Enough that the envelope is worth opening, which is the whole
 * claim the letter makes about itself.
 */
export const PROMO_EVERY_WINDOWS = 3;

export type PromoLetter = {
    fromName: string;
    fromEmail: string;
    subject: string;
    body: string;
};

/** A plausible address for a shop that has never had one. */
const addressFor = (shop: Shop): string => {
    const host = (shop.url || `${shop.id}.com`).replace(/^www\./, '');
    return `private.clients@${host}`;
};

/**
 * The letter, or nothing.
 *
 * Nothing when no campaign is running, which cannot currently happen and is
 * handled anyway: a promotions inbox that fills with letters about no offer is
 * the failure this is meant to avoid.
 */
export const promoLetter = (
    featured: readonly Featured[],
    honorificName: string,
): PromoLetter | null => {
    const onOffer = featured.filter(f => f.discount > 0);
    if (onOffer.length === 0) return null;

    const lead = onOffer[0];
    const others = onOffer.slice(1);

    const alsoRunning = others.length > 0
        ? '\n\nOur associated houses are extending the same courtesy this season:\n'
        + others.map(o => `  ${o.shop.name}: ${Math.round(o.discount * 100)} per cent`).join('\n')
        : '';

    return {
        fromName: `${lead.shop.name} Private Clients`,
        fromEmail: addressFor(lead.shop),
        subject: `A private allocation for you, ${honorificName}`,
        // ------------------------------------------------------------------
        //  SHORT, BECAUSE A LONG ONE IS NOT READ
        // ------------------------------------------------------------------
        //  This ran to about a hundred and thirty words of boutique prose -
        //  "you will not have seen this offered publicly", "we do not extend
        //  it and we do not advertise it" - and was reported as too long and
        //  not believable. A private client note is two lines and a number.
        // ------------------------------------------------------------------
        body: `${honorificName},\n\n`
            + `${Math.round(lead.discount * 100)} per cent off the list, this season only, `
            + 'for a small number of clients.'
            + alsoRunning
            + '\n\nWith our compliments.',
    };
};

/**
 * Post it, if this is the quarter for it and the player is worth writing to.
 *
 * Called from the quarterly tick beside `postSponsorOffer`, which is the same
 * job with a different sender. Silent on every other quarter.
 */
export const postLuxuryPromo = (quarter: number, shops: readonly Shop[]): void => {
    const q = Number.isFinite(quarter) ? Math.max(0, Math.floor(quarter)) : 0;

    // ----------------------------------------------------------------------
    //  ONE SEASON IN THREE, NOT EVERY OTHER QUARTER
    // ----------------------------------------------------------------------
    //  The rule above was already about not being furniture - a campaign
    //  window is two quarters, so the boutique wrote once at the top of each
    //  one. Reported anyway as arriving nearly every quarter, and it was:
    //  every second quarter, for ever, for the whole run.
    //
    //  A private client list does not write six times a year. PROMO_EVERY
    //  quarters keeps the letter tied to the top of a campaign window - the
    //  offer inside it has to be live - and then only takes every third one.
    // ----------------------------------------------------------------------
    if (q % CAMPAIGN_QUARTERS !== 0) return;
    if (Math.floor(q / CAMPAIGN_QUARTERS) % PROMO_EVERY_WINDOWS !== 0) return;

    const netWorth = (useStatsStore.getState() as { netWorth?: number }).netWorth ?? 0;
    if (netWorth < PROMO_NET_WORTH_FLOOR) return;

    // "Mr Hale" rather than "Elena", because this is a boutique writing to a
    // client list and not a friend. `honorific` takes the gender and the
    // surname is the one thing a succession does not change.
    const { honorific } = require('../identity');
    const { useIdentityStore } = require('../store/useIdentityStore');
    const id = useIdentityStore.getState();
    const name = `${honorific(id.gender)} ${id.lastName || ''}`.trim();

    const letter = promoLetter(featuredFor(shops, q), name);
    if (!letter) return;

    useMailStore.getState().receiveMail({
        ...letter,
        atMonth: useGameStore.getState().currentMonth,
        // THE CATEGORY THAT HAS NEVER BEEN USED. This is what it was for.
        category: 'Promotions',
    });

    if (__DEV__) {
        console.log(`[luxury] promo posted for Q${q}, net worth ${formatMoney(netWorth)}`);
    }
};
