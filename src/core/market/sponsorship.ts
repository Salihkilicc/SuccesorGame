// src/core/market/sponsorship.ts
//
// ============================================================================
//  PUTTING THE NAME ON SOMETHING
// ============================================================================
//
//  Three tiers, thirty offers, and a drought that costs you.
//
//  ---------------------------------------------------------------------------
//  THIRTY, BECAUSE TEN WOULD REPEAT
//  ---------------------------------------------------------------------------
//  A campaign runs sixty quarters or more and an offer arrives every few. With
//  three of them per tier the player would see the same regional football club
//  four times and stop reading the letters, which is the failure mode this
//  system has: it is a mail that arrives often, so the moment it becomes
//  furniture it is dead. Ten per tier, drawn without replacement, means the
//  well runs dry rather than looping - and when it does, that is honest too:
//  there really are only so many things worth putting a name on.
//
//  ---------------------------------------------------------------------------
//  THE BIG ONES ARE GATED ON WHAT THE COMPANY IS WORTH, NOT ON WHAT IT HAS
//  ---------------------------------------------------------------------------
//  A stadium naming right is not offered to somebody who could afford it this
//  quarter - it is offered to somebody whose name is worth putting on a
//  stadium. So the gate is `companyValue`, and a player sitting on a pile of
//  cash still gets local offers until the company itself is worth something.
//
//  ---------------------------------------------------------------------------
//  AND THE DROUGHT IS A CEILING, NOT A DRAIN
//  ---------------------------------------------------------------------------
//  Twelve quarters with your name on nothing and the brand erodes. Written as
//  a ceiling penalty rather than a per-quarter subtraction, for the reason
//  measured in the conviction work: brand mean-reverts towards a target every
//  tick, so subtracting from the VALUE is pulled straight back out. A drain of
//  1.5 a quarter produced 21.5 against a clean 21.3 - which is nothing.
//
//  It grows with the drought rather than arriving all at once, so a player who
//  lets a deal lapse for a year has a problem and a player who has never
//  signed one has a different, larger problem.
// ============================================================================

export type SponsorTier = 'local' | 'national' | 'global';

export const TIERS: readonly SponsorTier[] = ['local', 'national', 'global'] as const;

export interface SponsorOffer {
    id: string;
    tier: SponsorTier;
    /** What you would be putting the name on. */
    name: string;
    /** One line, in the voice of whoever is asking. */
    pitch: string;
    /** Paid every quarter for the term. */
    quarterlyCost: number;
    /**
     * SHELVED as the thing that drives the effect, kept as authored data.
     *
     * It used to be added to the brand VALUE every quarter, which the walk in
     * advanceCategoryBrand pulled straight back out. `sponsorPeak` sizes a
     * deal off what it COSTS now, which is what was asked for and is harder to
     * game than a hand-tuned figure.
     *
     * Not removed, because it is the only place anybody wrote down how much
     * NOISE each of these thirty things makes as opposed to what it charges -
     * the polar programme is quiet for its price and the arena is loud for
     * its - and that is worth keeping for whoever wants a second axis.
     */
    brandPerQuarter: number;
    /** How many quarters it runs. */
    quarters: number;
}

/**
 * What a company has to be worth before each tier writes to it.
 *
 * Company VALUE rather than cash: a stadium is not offered to somebody who
 * could afford it this quarter, it is offered to somebody whose name is worth
 * putting on a stadium.
 */
export const TIER_MINIMUM_VALUE: Record<SponsorTier, number> = {
    local: 0,
    national: 250_000_000,
    global: 4_000_000_000,
};

export const tiersOpenAt = (companyValue: number): SponsorTier[] =>
    TIERS.filter(t => companyValue >= TIER_MINIMUM_VALUE[t]);

// ============================================================================
//  THE DROUGHT
// ============================================================================

/** How long you can go with your name on nothing before it starts to show. */
export const DROUGHT_GRACE_QUARTERS = 12;
/** Ceiling points lost per quarter of drought after the grace period. */
export const DROUGHT_PENALTY_PER_QUARTER = 0.8;
/** And it stops somewhere, because a slow game over is not a mechanic. */
export const DROUGHT_PENALTY_CAP = 20;

export const droughtPenalty = (quartersWithoutSponsor: number): number => {
    const over = Math.max(0, (quartersWithoutSponsor || 0) - DROUGHT_GRACE_QUARTERS);
    return Math.min(DROUGHT_PENALTY_CAP, over * DROUGHT_PENALTY_PER_QUARTER);
};

// ============================================================================
//  THIRTY OFFERS
// ============================================================================
//  Ten a tier. The numbers climb with the tier and so does the term - a
//  regional shirt is one season, a stadium is a decade - which is the real
//  decision inside the letter: the big ones are a commitment, not a purchase.
// ============================================================================

const local = (
    id: string, name: string, pitch: string,
    quarterlyCost: number, brandPerQuarter: number,
): SponsorOffer => ({ id, tier: 'local', name, pitch, quarterlyCost, brandPerQuarter, quarters: 4 });

const national = (
    id: string, name: string, pitch: string,
    quarterlyCost: number, brandPerQuarter: number,
): SponsorOffer => ({ id, tier: 'national', name, pitch, quarterlyCost, brandPerQuarter, quarters: 8 });

const global_ = (
    id: string, name: string, pitch: string,
    quarterlyCost: number, brandPerQuarter: number,
): SponsorOffer => ({ id, tier: 'global', name, pitch, quarterlyCost, brandPerQuarter, quarters: 16 });

export const SPONSOR_OFFERS: SponsorOffer[] = [
    // ------------------------------------------------------------------
    //  LOCAL — a season, a few hundred thousand, and somebody who is
    //  slightly embarrassed to be asking.
    // ------------------------------------------------------------------
    local('spon-l-1', 'Fairview Rovers FC',
        'Third division, seventh in the table, and the shirts have said BUILDERS MERCHANT on them since 1994 because nobody else asked.',
        180_000, 0.8),
    local('spon-l-2', 'The county agricultural show',
        'Two hundred thousand visitors over four days, most of them ours, and the main ring has been sponsored by a bank that no longer exists.',
        140_000, 0.7),
    local('spon-l-3', 'Riverside Community Pool',
        'It closes in March without somebody. I am not going to dress that up, there is no marketing case, there is a pool.',
        90_000, 0.6),
    local('spon-l-4', 'The Harbour Light Festival',
        'Eleven nights, forty thousand people, and a projection on the old grain silo that everybody photographs. Your name goes on the silo.',
        160_000, 0.9),
    local('spon-l-5', 'Ashcroft Technical College',
        'Two hundred apprenticeships a year and about a third of them end up on your floor. Sponsoring us is nearly a recruitment budget.',
        210_000, 1.0),
    local('spon-l-6', 'The county cricket ground',
        'The stand is falling down and the club is older than either of our companies. It would be a plaque and a good afternoon in July.',
        120_000, 0.6),
    local('spon-l-7', 'Northgate Hospice',
        'We do not put names on things. We would put yours in the annual report and thank you once, quietly, and that is the whole offer.',
        150_000, 0.7),
    local('spon-l-8', 'The regional science fair',
        'Nine hundred entries last year. The winner is fourteen and has built a better inventory system than the one you are running.',
        75_000, 0.5),
    local('spon-l-9', 'Vale Amateur Boxing Club',
        'Six nights a week in a church hall. Two of ours went to the nationals. It is the cheapest goodwill you will ever buy and I know that is a crass way to put it.',
        60_000, 0.5),
    local('spon-l-10', 'The Marbury Christmas lights',
        'Four streets, six weeks, and everybody in this town walks under them. The last sponsor pulled out in October and we have not told anybody yet.',
        95_000, 0.6),

    // ------------------------------------------------------------------
    //  NATIONAL — two years, real money, and people who negotiate for a
    //  living.
    // ------------------------------------------------------------------
    national('spon-n-1', 'The national cup competition',
        'Sixty-four clubs, one televised final, and a trophy that has carried a brewery\'s name since 1961. They are not renewing.',
        1_400_000, 2.2),
    national('spon-n-2', 'The touring orchestra',
        'Thirty cities, two of them yours. Our audience is older and wealthier than yours and that is precisely the point of this letter.',
        900_000, 1.6),
    national('spon-n-3', 'The motor racing series',
        'Eight rounds, four hours of coverage each, and a livery you would approve. Also two crashes a season, which the press will attach your name to.',
        2_100_000, 2.8),
    national('spon-n-4', 'The national maths olympiad',
        'It costs less than one of your advertisements and the photographs are of clever children. I am aware of how that sounds and it is still true.',
        420_000, 1.4),
    national('spon-n-5', 'The mountain rescue association',
        'Forty teams, all volunteers, and every helicopter photograph in the papers this winter had a logo on the door. It could be yours.',
        780_000, 1.9),
    national('spon-n-6', 'The public broadcaster\'s nature series',
        'Eight episodes, one presenter everybody trusts, and a two-second card at the end. It is the most expensive two seconds available.',
        1_800_000, 2.6),
    national('spon-n-7', 'The national swimming squad',
        'Four years to the games. If they do well your name is in every photograph and if they do badly nobody will remember you were there.',
        1_100_000, 2.0),
    national('spon-n-8', 'The literary prize',
        'Sixty years old, six shortlisted novels, and a dinner in November where you will be seated next to people who do not know what your company makes.',
        650_000, 1.5),
    national('spon-n-9', 'The air ambulance charity',
        'Nine aircraft. No government funding. Your name on the fuselage, which is a photograph that runs in a newspaper roughly every fortnight.',
        950_000, 2.1),
    national('spon-n-10', 'The touring theatre company',
        'Two hundred performances a year in towns with no theatre. It is not glamorous, it is not televised, and it is the only thing on this list that will still be running in forty years.',
        540_000, 1.3),

    // ------------------------------------------------------------------
    //  GLOBAL — a decade, an absurd number, and people who are doing you a
    //  favour by asking.
    // ------------------------------------------------------------------
    global_('spon-g-1', 'The Arena, naming rights',
        'Nineteen thousand seats, a hundred and forty events a year, and a name that will be spoken by taxi drivers for twenty years. The current holder is a bank in administration.',
        9_500_000, 5.5),
    global_('spon-g-2', 'The continental football championship',
        'Twenty-four nations, a month, and the largest television audience of any four-week period in human history. There are six slots and one is open.',
        24_000_000, 8.5),
    global_('spon-g-3', 'The polar research programme',
        'Two vessels and a station. No advertising, no logo on anything, and your name in every scientific paper that comes out of it for a generation.',
        6_200_000, 4.2),
    global_('spon-g-4', 'The world athletics tour',
        'Fourteen cities, one calendar, and a sport that is currently rebuilding its reputation. That last part is why the price is what it is.',
        15_000_000, 6.4),
    global_('spon-g-5', 'The observatory',
        'The largest telescope ever built and it needs a name. Every photograph of the early universe for the next fifty years will have yours under it.',
        11_000_000, 6.8),
    global_('spon-g-6', 'The transcontinental cycling race',
        'Three weeks, four countries, and eleven hours of daily coverage in which almost nothing happens and everybody watches anyway.',
        13_500_000, 6.0),
    global_('spon-g-7', 'The vaccine access initiative',
        'Forty-one countries. You would be named in the founding instrument, which is a document that will outlive both of us and possibly the company.',
        18_000_000, 7.2),
    global_('spon-g-8', 'The world exposition pavilion',
        'Six months, thirty million visitors, and a building that will be photographed more than anything your company has ever made.',
        21_000_000, 7.8),
    global_('spon-g-9', 'The ocean cleanup fleet',
        'Nine vessels. It may not work. If it does it will be the most photographed thing of the decade and your name is on the side of all nine.',
        8_800_000, 5.2),
    global_('spon-g-10', 'The concert hall',
        'Two thousand four hundred seats and the best acoustic in the world, which is a sentence three cities are currently arguing about. Ours is the true one.',
        7_400_000, 4.8),
];

// ============================================================================
//  WHAT SIGNING ONE ACTUALLY DOES
// ============================================================================
//
//  It used to add `brandPerQuarter` to the brand VALUE every quarter of the
//  term, through gameSink().brand(). Reported as "hic kalici degil, 2 quarter
//  suruyor sonra etkisi bitiyor", and the measurement agrees:
//
//      a one-off +10 of brand, at an 8% share
//        q1 +8.3    q2 +6.9    q3 +5.7    q4 +4.8    q6 +3.3
//
//  Brand walks towards `sqrt(share) x 43.3` at a quarter to a
//  third of the gap per tick, so anything added to the VALUE is pulled back
//  out with a half life of about four quarters. The largest deal in the game
//  costs 384 million over sixteen quarters, peaks at +39 brand points, and is
//  down to +9 eight quarters after it ends.
//
//  ---------------------------------------------------------------------------
//  AND THIS FILE ALREADY KNEW
//  ---------------------------------------------------------------------------
//  Read the drought note at the top: the penalty was written as a CEILING
//  penalty rather than a per-quarter subtraction, for exactly this reason,
//  with the measurement quoted. So the thing that punishes you was built to
//  stick and the thing you paid for was not. One file, one page apart.
//
//  ---------------------------------------------------------------------------
//  A SPLASH THAT FADES, NOT A DRIP THAT LEAKS
//  ---------------------------------------------------------------------------
//  Asked for directly: "sure boyunca 30 artirirsa her quarter op olur ... en
//  buyugu ilk 40 artirdi sonra 16 quarterda azalarak gitsin".
//
//  Which is also how it works. A naming rights announcement is an event: the
//  photographs run, everybody mentions it, and eighteen months later it is the
//  name of the building and nobody thinks about it. So the deal lands at its
//  full size on the quarter it is signed and fades to nothing across its term,
//  and the money keeps being paid the whole way - which is what makes renewing
//  a decision rather than a formality.
//
//  IT SHIFTS THE EQUILIBRIUM, not the value. A ceiling is the right instrument
//  for the drought because a ceiling can only hold you down; it cannot lift
//  anybody. Moving the target that brand walks towards is a lift that stays
//  put while it lasts, instead of being eaten by the same mean reversion that
//  made the old version pointless.
// ============================================================================

/**
 * What the largest contract in the game is worth at the moment of signing.
 *
 * Forty brand points, which is a little over nine on the 0-100 index. Chosen
 * against the alternative rather than in the abstract: the old drip settled at
 * roughly fifty points for the same deal, so this is a nerf as well as a
 * reshape, and it is meant to be. "Cok etkilemesin."
 */
export const SPONSOR_PEAK_POINTS = 40;

/**
 * The peak is sized by MONEY, and sized by its square root.
 *
 * Straight proportion does not work here: the biggest contract costs five
 * hundred times the smallest, so a linear scale would make every local deal
 * worth a rounding error and there would be no reason to read the letter. The
 * square root gives 1.0 for a village boxing club, 8 for a national series and
 * 40 for the continental championship, which is a spread somebody can feel at
 * every size of company.
 */
export const totalContractValue = (offer: SponsorOffer): number =>
    Math.max(0, offer.quarterlyCost) * Math.max(1, offer.quarters);

/** The dearest contract on the list, so the scale has a top. */
export const maxContractValue = (): number =>
    Math.max(...SPONSOR_OFFERS.map(totalContractValue));

/**
 * What a deal is worth on the quarter it is signed, in brand points.
 *
 * Added to the EQUILIBRIUM rather than to the value. See the note above.
 */
export const sponsorPeak = (offer: SponsorOffer): number => {
    const top = maxContractValue();
    if (!(top > 0)) return 0;
    return SPONSOR_PEAK_POINTS * Math.sqrt(totalContractValue(offer) / top);
};

/**
 * And what is left of it after `quartersElapsed` of the term.
 *
 * Linear to nothing at the end of the term, which is the shape that was asked
 * for and also the legible one: a player can be told "it fades over the four
 * years" and check it. A curve would be truer to how attention actually decays
 * and impossible to read off a screen.
 *
 * The money is paid every quarter regardless. That asymmetry IS the mechanic:
 * the back half of a long contract is expensive and quiet, which is what makes
 * signing a ten year deal a commitment rather than a purchase.
 */
export const sponsorGlow = (
    offer: SponsorOffer,
    quartersElapsed: number,
): number => {
    const term = Math.max(1, offer.quarters);
    const elapsed = Math.max(0, Math.min(term, quartersElapsed || 0));
    const remaining = (term - elapsed) / term;
    return sponsorPeak(offer) * remaining;
};

export const offersInTier = (tier: SponsorTier): SponsorOffer[] =>
    SPONSOR_OFFERS.filter(o => o.tier === tier);

export const offerById = (id: string): SponsorOffer | undefined =>
    SPONSOR_OFFERS.find(o => o.id === id);

/**
 * Pick the next offer for a company, without repeating one it has seen.
 *
 * Deterministic on the seen list rather than random: the same company in the
 * same state gets the same letter, which is the rule the rest of this codebase
 * has settled on, and it means the well empties in a stated order rather than
 * on a die that can hand out the same one twice.
 */
export const nextOffer = (
    companyValue: number,
    seen: string[],
): SponsorOffer | undefined => {
    const open = tiersOpenAt(companyValue);
    // Best tier available first: a company worth four billion is not written
    // to about a village pool, and being offered one would read as the game
    // not knowing what you had built.
    for (const tier of [...open].reverse()) {
        const unseen = offersInTier(tier).filter(o => !seen.includes(o.id));
        if (unseen.length) return unseen[0];
    }
    return undefined;
};
