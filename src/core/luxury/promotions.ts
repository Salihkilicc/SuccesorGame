// src/core/luxury/promotions.ts
//
// ============================================================================
//  THE SHOP HAD THREE ADVERTS AND THEY WERE THE SAME THREE FOREVER
// ============================================================================
//
//  Asked for as "I would like the shops to have taken out adverts, and for
//  those to change, and to be able to run campaigns".
//
//  `AdBannerCarousel` had a hardcoded array of three: Velocity Motors, Dynasty
//  8, Poseidon. Twenty seven shops in the catalogue and the same three on the
//  front page in the first quarter and the fortieth.
//
//  ---------------------------------------------------------------------------
//  AND A CAMPAIGN THAT DOES NOT MOVE THE PRICE IS A LIE
//  ---------------------------------------------------------------------------
//  This is the part worth being careful about, because it is the shape of
//  almost every defect this project has had. A banner saying 15% OFF that the
//  checkout has never heard of is decoration, and this codebase's whole
//  history is decoration that looked like a system: a maintenance cost nobody
//  billed, an appreciation rate nobody read, a luxury row reading a store
//  nobody wrote.
//
//  So the discount is not a property of the banner. It is a property of the
//  ITEM AT THIS QUARTER, and `effectivePrice` is what the shelf, the cart and
//  the till all call. The banner is generated from the same function.
//
//  ---------------------------------------------------------------------------
//  DERIVED FROM THE QUARTER, NOT STORED
//  ---------------------------------------------------------------------------
//  No store, no persistence, no tick to forget to call. Which campaign is
//  running is a pure function of what quarter it is, so it is the same on a
//  reload, the same on two screens at once, and it cannot drift out of step
//  with a saved copy of itself because there is no saved copy.
//
//  A campaign runs for a WINDOW of quarters rather than for one, or the shop
//  would change its mind every three months and no offer would ever be worth
//  waiting for. The window index seeds the choice, so everything inside a
//  window is fixed and the boundary is where the front page changes.
//
//  PURE. No stores, no React, no Math.random.
// ============================================================================

import type { Shop, ShoppingItem } from '../../features/shopping/types';

/** How many quarters an offer stands. Half a year is long enough to plan around. */
export const CAMPAIGN_QUARTERS = 2;

/** How many shops are running something at once. */
export const CAMPAIGNS_AT_ONCE = 3;

/**
 * The discounts a shop may offer.
 *
 * Modest on purpose. The catalogue is the endgame money sink and a 40% sale on
 * a $6.5B tower would move more value in one press than most quarters of
 * trading; the interesting version of a campaign is a nudge on a decision the
 * player was already close to making.
 */
export const DISCOUNT_STEPS: readonly number[] = [0.05, 0.10, 0.15, 0.20];

/** How many shops are on the front page. Three fit; more is a list. */
export const FEATURED_COUNT = 3;

export type Campaign = {
    shopId: string;
    /** 0.05 to 0.20. */
    discount: number;
    /** Inclusive. The last quarter this offer stands. */
    endsQuarter: number;
};

/**
 * A small deterministic hash.
 *
 * Not Math.random, and the reason is the whole design: the front page has to
 * be the same after a reload and the same on two screens at once. A seeded
 * integer hash gives that for free and needs nothing stored.
 */
const hash = (n: number): number => {
    let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
};

const windowOf = (quarter: number): number => {
    const q = Number.isFinite(quarter) ? Math.max(0, Math.floor(quarter)) : 0;
    return Math.floor(q / CAMPAIGN_QUARTERS);
};

/**
 * Pick `count` distinct entries from a list, by seed.
 *
 * Walks forward from a seeded start rather than sampling with rejection, so
 * the result is distinct by construction and the function cannot spin.
 */
const pick = <T>(list: readonly T[], count: number, seed: number): T[] => {
    if (list.length === 0 || count <= 0) return [];
    const take = Math.min(count, list.length);
    const start = hash(seed) % list.length;
    // A stride coprime with the length visits every entry before repeating.
    const stride = 1 + (hash(seed + 1) % Math.max(1, list.length - 1));
    const step = list.length % stride === 0 ? 1 : stride;

    const out: T[] = [];
    const seen = new Set<number>();
    let i = start;
    while (out.length < take) {
        if (!seen.has(i)) {
            seen.add(i);
            out.push(list[i]);
        } else {
            i = (i + 1) % list.length;
            continue;
        }
        i = (i + step) % list.length;
    }
    return out;
};

/**
 * What is on offer this quarter.
 *
 * Stable for the whole of a campaign window and different in the next one.
 */
export const campaignsFor = (shops: readonly Shop[], quarter: number): Campaign[] => {
    const w = windowOf(quarter);
    const chosen = pick(shops, CAMPAIGNS_AT_ONCE, w);
    const endsQuarter = (w + 1) * CAMPAIGN_QUARTERS - 1;

    return chosen.map((shop, i) => ({
        shopId: shop.id,
        discount: DISCOUNT_STEPS[hash(w * 31 + i) % DISCOUNT_STEPS.length],
        endsQuarter,
    }));
};

/** The discount on one item right now, as a fraction. Zero when nothing applies. */
export const discountFor = (
    item: Pick<ShoppingItem, 'shopId'>,
    shops: readonly Shop[],
    quarter: number,
): number =>
    campaignsFor(shops, quarter).find(c => c.shopId === item?.shopId)?.discount ?? 0;

/**
 * What this item costs today.
 *
 * THE ONE PRICE. The shelf shows it, the cart adds it up and the till charges
 * it, so a banner cannot advertise a number the checkout has never heard of.
 * Rounded to whole dollars, because a price with cents on a hypercar is a bug
 * that looks like a feature.
 */
export const effectivePrice = (
    item: Pick<ShoppingItem, 'shopId' | 'price'>,
    shops: readonly Shop[],
    quarter: number,
): number => {
    const base = Number.isFinite(item?.price) ? Math.max(0, item.price) : 0;
    return Math.round(base * (1 - discountFor(item, shops, quarter)));
};

/**
 * Which shops are on the front page, and what each one is saying.
 *
 * The shops RUNNING SOMETHING come first, because an advert with an offer in
 * it is worth more of the page than an advert without one. The rest of the
 * slots are filled from the same rotation, so a quiet quarter still has three
 * banners and they are still not the same three as last time.
 */
export type Featured = {
    shop: Shop;
    /** Zero when this shop is on the page but not on offer. */
    discount: number;
    endsQuarter: number;
};

export const featuredFor = (shops: readonly Shop[], quarter: number): Featured[] => {
    const live = campaignsFor(shops, quarter);
    const byId = new Map(shops.map(s => [s.id, s]));

    const out: Featured[] = [];
    for (const c of live) {
        const shop = byId.get(c.shopId);
        if (shop) out.push({ shop, discount: c.discount, endsQuarter: c.endsQuarter });
    }
    if (out.length >= FEATURED_COUNT) return out.slice(0, FEATURED_COUNT);

    // Fill from a DIFFERENT seed, or the filler is the campaign list again.
    const taken = new Set(out.map(f => f.shop.id));
    const rest = shops.filter(s => !taken.has(s.id));
    const endsQuarter = (windowOf(quarter) + 1) * CAMPAIGN_QUARTERS - 1;
    for (const shop of pick(rest, FEATURED_COUNT - out.length, windowOf(quarter) + 7919)) {
        out.push({ shop, discount: 0, endsQuarter });
    }
    return out;
};
