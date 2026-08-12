// src/core/market/postSponsorOffer.ts
//
// ============================================================================
//  A LETTER ABOUT PUTTING THE NAME ON SOMETHING
// ============================================================================
//
//  The third file in the same split: sponsorship.ts is arithmetic and thirty
//  offers, useSponsorshipStore remembers, and this one touches the app.
//
//  GENERATED RATHER THAN A CONVERSATION, for the same reason the negotiation
//  replies are: a `Conversation` is static data and this letter has to quote a
//  quarterly cost, a term and a brand figure that come from the offer. Putting
//  a templating language inside a data file is what the story system exists to
//  avoid.
//
//  IT ONLY ARRIVES WHEN THERE IS NOTHING SIGNED. A company already sponsoring
//  something does not get asked - which keeps the letter from becoming
//  furniture, and means the drought counter and the letter are the same
//  mechanic seen from two sides.
// ============================================================================

import { useMailStore } from '../store/useMailStore';
import { useSponsorshipStore } from '../store/useSponsorshipStore';
import { useStatsStore } from '../store/useStatsStore';
import { useGameStore } from '../store/useGameStore';
import { DROUGHT_GRACE_QUARTERS, type SponsorOffer } from './sponsorship';
import { formatMoney } from '../utils';

/** How often somebody asks, when nothing is signed. */
export const OFFER_EVERY_QUARTERS = 3;

export const bodyFor = (offer: SponsorOffer, quartersWithout: number): string => {
    const lines = [
        offer.pitch,
        '',
        `TERMS: ${formatMoney(offer.quarterlyCost)} per quarter for ${offer.quarters} quarters.`,
    ];
    if (quartersWithout > DROUGHT_GRACE_QUARTERS) {
        // Said once, plainly, by whoever is asking - because a player who has
        // never signed one has a problem the game should name rather than
        // apply silently.
        lines.push(
            '',
            'You will forgive me for noticing that your name is currently on nothing at all. That is unusual for a company your size and people do remark on it.',
        );
    }
    return lines.join('\n');
};

/**
 * Send the next offer, if one is due and the shelf is not empty.
 *
 * Returns the offer sent, so the tick's test can assert without reading mail.
 */
export const postSponsorOffer = (quarter: number): SponsorOffer | undefined => {
    const store = useSponsorshipStore.getState();
    if (store.active) return undefined;
    if (quarter % OFFER_EVERY_QUARTERS !== 0) return undefined;

    const value = useStatsStore.getState().companyValue ?? 0;
    const offer = store.nextFor(value);
    if (!offer) return undefined;

    store.markSeen(offer.id);
    useMailStore.getState().receiveMail({
        fromName: offer.name,
        fromEmail: 'partnerships@' + offer.id.replace(/[^a-z0-9]/g, '') + '.org',
        subject: `Sponsorship — ${offer.name}`,
        body: bodyFor(offer, store.quartersWithout),
        atMonth: useGameStore.getState().currentMonth,
        category: 'Primary',
        sponsorOfferId: offer.id,
    });
    return offer;
};
