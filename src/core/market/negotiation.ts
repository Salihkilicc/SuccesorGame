// src/core/market/negotiation.ts
//
// ============================================================================
//  APPROACHING A COMPANY, AND BEING ANSWERED A QUARTER LATER
// ============================================================================
//
//  WHAT THIS REPLACES. There is a NegotiationModal in the repo, shelved and
//  marked orphan, and it is worth reading before this file because it is the
//  exact opposite of it:
//
//      setStatus('board_voting');
//      setTimeout(() => { const roll = Math.random() * 100; ... }, 2000);
//      ...on failure: <GameButton title="Adjust offer" onPress={initial} />
//
//  A two-second spinner, a die, and a button that re-rolls it. Nothing about
//  the target mattered, nothing was remembered, and refusing cost nothing
//  because you could simply press it again.
//
//  Everything here is built against that. An approach is a decision that takes
//  A QUARTER to answer, it is answered by a PERSON with a fixed temperament,
//  and the answer is recorded - going back is a new approach, and the second
//  one is harder than the first.
//
//  ---------------------------------------------------------------------------
//  CLOSED VOCABULARIES, SAME BARGAIN AS THE STORY
// ---------------------------------------------------------------------------
//  `Subject`, `Demand` and `Reply` are finite named sets rather than free text
//  or callbacks, for the reason effects.ts gives: a thing described as data can
//  be read, logged, replayed, tested and audited. A negotiation that carried
//  functions would be five small programs inside a data file within a month.
//
//  This module imports NOTHING from the app - no stores, no i18n, no React. It
//  is arithmetic and vocabulary. The store that runs it lives elsewhere, the
//  same split as effects.ts / gameSink.ts.
// ============================================================================

import {
    boardWillSell, REFUSAL_THRESHOLD, FRIENDLY_PREMIUM, type TargetRisk,
} from './mergers';
import type { TraitType } from './governanceTypes';

// ============================================================================
//  WHAT YOU PUT IN THE SUBJECT LINE
// ============================================================================
//  Four ways to open, and the subject is a real decision rather than flavour:
//  it moves resistance, and every personality reads it differently. A merger
//  of equals flatters a founder with a legacy and insults an operator who can
//  do arithmetic.
// ============================================================================

export type Subject =
    /** "Offer to acquire". Says what it is. The baseline everything else is measured against. */
    | 'purchase'
    /** "Proposal: merger of equals". There is no such thing, and some people like being told there is. */
    | 'merger'
    /**
     * "Commercial partnership".
     *
     * The slow route. Lowers resistance more than anything else and NEVER
     * produces an outright yes - you are buying a better price with an extra
     * condition and another quarter.
     */
    | 'partnership'
    /**
     * "Notice of intent".
     *
     * You tell them you are coming. Resistance jumps and they never accept.
     *
     * ITS PLACE: it is the only subject that works on a board that has already
     * turned you down. The polite three are dead after a refusal - a board
     * that said no does not reconsider because you asked again more nicely -
     * and without this the player who is refused once has no move at all
     * except hostile, with nothing in between.
     */
    | 'notice';

export const SUBJECTS: readonly Subject[] = ['purchase', 'merger', 'partnership', 'notice'] as const;

/** Whether this subject can ever produce a plain yes. */
export const canAccept = (s: Subject): boolean => s === 'purchase' || s === 'merger';

// ============================================================================
//  WHAT A BOARD CAN ASK FOR
// ============================================================================
//  Four kinds, and `none` is one of them ON PURPOSE. A negotiation system where
//  every reply is a demand teaches the player that the reply screen is a toll
//  booth, and they stop reading it. Some boards simply answer.
// ============================================================================

export type Demand =
    /** Nothing. They answer the question they were asked. */
    | { kind: 'none' }
    /**
     * A seat on your board for whoever ran the company.
     *
     * Costs nothing today and something every quarter afterwards: the named
     * founders arrive with a trait, a pet issue and a vote. See
     * data/market/founders.ts.
     */
    | { kind: 'seat' }
    /**
     * A floor under your public standing.
     *
     * NOT A PRICE - A GATE. Every other demand is something you can decide to
     * pay in the moment; this one asks what you already are, and if you are
     * below it there is no answer available this quarter. That is the point of
     * having it in the vocabulary: one demand the player cannot buy their way
     * out of, only fix, or go around.
     */
    | { kind: 'reputation'; floor: number }
    /** More money, as premium points on top of the friendly rate. */
    | { kind: 'price'; extraPremium: number };

export type Reply =
    /** Yes, at the friendly premium. */
    | { kind: 'accept' }
    /** Yes, if. */
    | { kind: 'demand'; demand: Demand }
    /** No. The board will not sell to you at any price you could offer politely. */
    | { kind: 'refuse' };

// ============================================================================
//  HOW HARD THEY RESIST
// ============================================================================
//  `boardWillSell` already computes a resistance SCORE from strength, relative
//  size and risk, and then throws all but its sign away - the caller learns
//  "refuses: true" and nothing else. Every number below is built on the score
//  it was already producing.
// ============================================================================

/** How much each subject moves resistance, before personality. */
export const SUBJECT_SHIFT: Record<Subject, number> = {
    purchase: 0,
    merger: -0.05,
    partnership: -0.15,
    notice: 0.20,
};

/**
 * Approaching somebody who has already said no.
 *
 * A board that refused you is harder the second time, always, and this is what
 * stops the old modal's "Adjust offer" button from coming back in a new shape.
 * Going away and returning is a real move; it is just not a free one.
 */
export const SECOND_APPROACH_PENALTY = 0.12;

/**
 * HOW MUCH GOODWILL YOU CAN BANK, AND WHY IT IS ONLY ONE.
 *
 * `priorRefusals` runs negative when the player has met a board's condition -
 * a partnership signed, a seat given - and a negative one is a DISCOUNT on the
 * next approach at the same rate a refusal is a penalty. That is the entire
 * reason the partnership and notice routes exist: they cannot end in
 * ownership, so what they buy is a warmer desk next time.
 *
 * It was written and it could not fire. Two clamps, in two files, both reading
 * `Math.max(0, ...)`: the store refused to record a credit and `resistance`
 * refused to honour one. So `DEMAND_MET_RELIEF`, the comment above it about a
 * board you dealt with honestly being cheaper to overrun, and the whole slow
 * route were describing a mechanic that arithmetic had switched off.
 *
 * Floored at one because otherwise it is farmable: sign four partnerships and
 * walk into anybody. One good turn is remembered. Four is a routine.
 */
export const GOODWILL_FLOOR = -1;

/**
 * What a conviction adds to every board's resistance, forever.
 *
 * The second half of `fbiGuilty` being a poison rather than a label. A board
 * with a fiduciary duty does not recommend a sale to a chief executive who
 * has been found to have obstructed a federal investigation - not out of
 * distaste, but because their own shareholders will ask.
 *
 * 0.30 is enough to close the ordinary target: a mid-sized company at a
 * comfortable 0.35 lands at 0.65, past the refusal threshold. Everything is
 * still buyable hostile, at a price that has also gone up, because the same
 * number feeds `hostilePremiumFor`.
 */
export const CONVICTION_RESISTANCE = 0.30;

export interface ResistanceInput {
    targetMarketCap: number;
    acquirerValuation: number;
    risk: TargetRisk;
    /** Competitor strength 0-100 where known. */
    strength?: number;
    subject: Subject;
    /** From the negotiator's table. See data/market/negotiators.ts. */
    personalityShift: number;
    /** How many times this target has already been approached and refused. */
    priorRefusals: number;
    /** The player has been found guilty. See CONVICTION_RESISTANCE. */
    convicted?: boolean;
    /**
     * What the player's partner is worth to this letter, 0 to 0.08.
     *
     * PASSED IN, like `convicted`, because core/market must not import
     * features/love - and because this module has no opinion about WHY a
     * board is warmer, only that it is. See features/love/logic/
     * partnerEffects.ts for where the number comes from.
     *
     * Subtracted rather than added: everything else in this function makes a
     * board harder and this is the only term that makes one easier, so the
     * sign is stated at the call rather than hidden in the value.
     */
    networkRelief?: number;
}

export const resistance = (i: ResistanceInput): number => {
    const base = boardWillSell(
        i.targetMarketCap, i.acquirerValuation, i.risk, i.strength,
    ).score;
    return Math.max(
        0,
        base
        + SUBJECT_SHIFT[i.subject]
        + i.personalityShift
        // Negative is a credit, not a no-op. See GOODWILL_FLOOR.
        + Math.max(GOODWILL_FLOOR, i.priorRefusals) * SECOND_APPROACH_PENALTY
        + (i.convicted ? CONVICTION_RESISTANCE : 0)
        // Somebody at your table knows somebody at theirs.
        - Math.max(0, i.networkRelief ?? 0),
    );
};

/** Do they engage at all? */
export const willEngage = (score: number): boolean => score < REFUSAL_THRESHOLD;

// ============================================================================
//  THE HOSTILE PREMIUM — THE NUMBER THAT WAS 35%
// ============================================================================
//
//  MEASURED FIRST. At the old flat 35%, against a $100M Low-risk target from a
//  $500M acquirer, the whole cost of going hostile rather than friendly was:
//
//      extra premium       $20.0M   one-off, day one
//      extra integration   $5.1M    one-off, over four quarters
//      lost synergy        $0.3M    PER YEAR, forever
//
//  Three things fall out of those numbers.
//
//  1. THE SYNERGY PENALTY IS DECORATIVE. HOSTILE_SYNERGY_REALIZATION was
//     raised to 0.85 to stop hostile being dominated, and at 0.85 it removes
//     3.6% of the deal's steady-state return - $0.27M a year against $7.53M.
//     Meanwhile MERGER_EXPLANATIONS still tells the player a hostile deal
//     "only realises about 60%" of its synergies, which has not been true
//     since that constant moved. The premium is the only lever with real
//     weight on it, so it has to carry the whole load.
//
//     (3.6% rather than the 1.2% this comment claimed on the first pass. The
//     test below computes it from the quote instead of trusting the prose,
//     which is how the slip was found.)
//
//  2. 35% WAS FLAT, AND THAT IS THE REAL FAULT - not that it was small. It
//     cost exactly the same to overrun a board that barely refused you as one
//     that would fight to the last share, and `boardWillSell` was already
//     computing the difference and discarding it.
//
//  3. THE ROUTE IS ONLY OPEN AGAINST THE STRONGEST TARGETS. Measured across
//     the refusal table, a board only refuses at strength 80+ on a low-risk
//     business, or when the target is about 120% of your own size. Those are
//     precisely the deals where a real acquirer pays fifty points and up, and
//     it is why "a bit more than friendly" is the wrong shape of answer.
//
//  SO: A FLOOR PLUS WHAT THEIR RESISTANCE EARNED.
//
//      45%  the floor - what it costs to go over any board's head at all
//      75%  the ceiling - a stronger, larger company with a board that means it
//
//  Real hostile bids clear around 40-50% against friendly deals at 25-30%, and
//  contested ones with live defences run far past that, so the band is not
//  invented. But the reason it is a BAND is the game reason: it gives the
//  negotiation something to move. A demand met, a subject chosen well, an
//  approach made before you were refused - each of those lowers resistance and
//  therefore lowers what the hostile route costs afterwards. Talking to
//  somebody honestly and then going over their head anyway is cheaper than
//  never talking, which is true, and slightly grim, and exactly the sort of
//  thing this game should be willing to say.
// ============================================================================

// ---------------------------------------------------------------------------
//  SHELVED: THE RESISTANCE CURVE
// ---------------------------------------------------------------------------
//  Everything below still computes, and nothing prices a deal with it any
//  more. The hostile route is a flat 2.5x the market - see HOSTILE_MULTIPLE in
//  core/market/mergers.ts, and the note there for why.
//
//  The short version: the curve was invisible. The acquisition screen printed
//  `valuation * 1.2` next to the button while the engine charged the curve, so
//  the one place the player decides was the one place the number was wrong. A
//  price the player cannot see is a surprise at the till, not a mechanic.
//
//  Kept rather than removed because the argument for it is still right and the
//  thing it needed - the price on the button being the price - now exists. If
//  it comes back, it comes back visible.
// ---------------------------------------------------------------------------

/** What it costs to go over any board's head, however mild they are. */
export const HOSTILE_PREMIUM_FLOOR = 0.45;
/** Added per point of resistance above the refusal threshold. */
export const HOSTILE_RESISTANCE_SLOPE = 0.6;
/** Nobody pays more than this. Beyond it the deal stops being a deal. */
export const HOSTILE_PREMIUM_CEILING = 0.75;

/** @orphan-ok-symbol hostilePremiumFor — shelved, see the note above. */
export const hostilePremiumFor = (score: number): number => {
    const over = Math.max(0, score - REFUSAL_THRESHOLD);
    return Math.min(
        HOSTILE_PREMIUM_CEILING,
        HOSTILE_PREMIUM_FLOOR + over * HOSTILE_RESISTANCE_SLOPE,
    );
};

// ============================================================================
//  WHAT A MET DEMAND IS WORTH
// ============================================================================
//  Meeting a demand does not only close this deal - it lowers what the same
//  board costs if you come back, and therefore what going hostile costs. That
//  is the whole reason the premium is a function rather than a constant.
// ============================================================================
export const DEMAND_MET_RELIEF = 0.10;

export interface OfferTerms {
    /** Premium ratio actually paid, friendly. */
    premiumRatio: number;
    /** Whether a board seat goes with it. */
    seat: boolean;
}

export const termsFor = (demand: Demand, met: boolean): OfferTerms => {
    if (!met) return { premiumRatio: FRIENDLY_PREMIUM, seat: false };
    switch (demand.kind) {
        case 'price':
            return { premiumRatio: FRIENDLY_PREMIUM + demand.extraPremium, seat: false };
        case 'seat':
            return { premiumRatio: FRIENDLY_PREMIUM, seat: true };
        case 'reputation':
        case 'none':
            return { premiumRatio: FRIENDLY_PREMIUM, seat: false };
    }
    const never: never = demand;
    throw new Error(`Unhandled demand: ${JSON.stringify(never)}`);
};

/**
 * What the player would actually pay, if the board's terms were accepted.
 *
 * The FRIENDLY premium plus whatever they asked on top - which is exactly what
 * `termsFor` produces and `quoteAcquisition` charges, so this is the same
 * number the acquisition screen will print rather than a second estimate.
 */
export const priceFor = (offer: Offer, extraPremium: number): number | undefined => {
    if (!(offer.marketCap && offer.marketCap > 0)) return undefined;
    return offer.marketCap * (1 + FRIENDLY_PREMIUM + extraPremium);
};

/** Can the player meet this demand right now? */
export const canMeet = (
    demand: Demand,
    world: { publicReputation: number; capital: number; price: number },
): boolean => {
    switch (demand.kind) {
        case 'none':
        case 'seat':
            return true;
        case 'reputation':
            return world.publicReputation >= demand.floor;
        case 'price':
            return world.capital >= world.price * (1 + demand.extraPremium);
    }
    const never: never = demand;
    throw new Error(`Unhandled demand: ${JSON.stringify(never)}`);
};

// ============================================================================
//  THE RECORD
// ============================================================================
//  One approach, start to finish. Stored rather than resolved on the spot,
//  because the answer arrives a quarter later and the waiting is the mechanic.
// ============================================================================

export type OfferStatus =
    | 'sent'        // waiting for the quarter to turn
    | 'open'        // they replied and want an answer
    | 'closed'      // bought, withdrawn, or refused for good
    ;

export interface Offer {
    id: string;
    targetId: string;
    targetName: string;
    subject: Subject;
    /** The quarter it was sent, so the reply can be one later and no sooner. */
    sentQuarter: number;
    status: OfferStatus;
    /** Resistance at the moment of sending. Frozen - the reply cannot re-roll. */
    score: number;
    /**
     * What they were worth when the letter went. Frozen with everything else.
     *
     * IT IS HERE SO THE MONEY CHECK CAN RUN. `canMeet` needs a price for a
     * price demand, and the screen was passing zero - so `capital >= 0` was
     * always true and a player could agree to a premium they could not fund,
     * then be bounced by the financing screen a tap later with no explanation
     * connecting the two.
     *
     * Optional because saves written before this exists have no value for it;
     * `priceFor` treats a missing one as unknown rather than as free.
     */
    marketCap?: number;
    /**
     * The target's risk rating, frozen with the letter for the same reason.
     *
     * IT HAS TO BE ON THE OFFER. Unnamed companies get a personality chosen by
     * risk (see genericNegotiator), so resolving a reply without it means
     * guessing - and the first version of the store guessed 'Medium' for
     * everybody. The visible symptom was that no low-risk board ever asked for
     * the reputation floor, which is the only demand only they make: a whole
     * branch of the vocabulary was unreachable and nothing failed.
     */
    risk: TargetRisk;
    reply?: Reply;
    /** Set when the player refuses a demand and does not go hostile. */
    withdrawn?: boolean;
}

/**
 * Whether a sent offer is due to be answered.
 *
 * A whole quarter, and STRICTLY - an offer sent in Q7 is answered in Q8 and
 * not on the same tick that created it. Written as its own function so the one
 * rule the feature is about cannot be quietly weakened by a caller.
 */
export const REPLY_DELAY_QUARTERS = 1;

export const isDue = (offer: Offer, quarter: number): boolean =>
    offer.status === 'sent' && quarter >= offer.sentQuarter + REPLY_DELAY_QUARTERS;

// ============================================================================
//  RESOLVING ONE APPROACH
// ============================================================================
//  Pure, and deterministic. THERE IS NO DIE ANYWHERE IN THIS FILE, which is
//  the second half of what replaces the shelved modal: its outcome came from
//  `Math.random()` and could be re-rolled by pressing a button, so the player
//  learned to press the button. Here the same letter to the same board in the
//  same quarter always comes back the same, and the only way to change the
//  answer is to change something true about the company or the approach.
// ============================================================================

export const replyFor = (
    negotiator: Negotiator,
    score: number,
    subject: Subject,
): Reply => {
    if (!willEngage(score)) return { kind: 'refuse' };
    const demand = negotiator.ask(score);
    // A partnership or a notice never produces a plain yes - see `canAccept`.
    // The slow route always attaches a condition; you bought the lower
    // resistance with an extra step rather than with nothing.
    if (demand.kind === 'none' && !canAccept(subject)) {
        return { kind: 'demand', demand: { kind: 'none' } };
    }
    if (demand.kind === 'none') return { kind: 'accept' };
    return { kind: 'demand', demand };
};

/**
 * Their one comeback, after the player has answered.
 *
 * Returns undefined when there is nothing further - which is most of the time,
 * and has to be, or every negotiation becomes an auction.
 */
export const counterFor = (
    negotiator: Negotiator,
    demand: Demand,
    playerMet: boolean,
): Demand | undefined => {
    switch (negotiator.onAnswered) {
        case 'none':
        case 'withdraw':
            return undefined;
        case 'split':
            // Only on a refusal, only on a price, and only once - the caller
            // marks the offer so this cannot loop.
            if (playerMet || demand.kind !== 'price') return undefined;
            return { kind: 'price', extraPremium: demand.extraPremium / 2 };
        case 'raise':
            if (!playerMet || demand.kind !== 'price') return undefined;
            return { kind: 'price', extraPremium: demand.extraPremium + 0.05 };
    }
    const never: never = negotiator.onAnswered;
    throw new Error(`Unhandled counter: ${JSON.stringify(never)}`);
};

/** Personalities are keyed by this. See data/market/negotiators.ts. */
export type NegotiatorId = string;

export interface Negotiator {
    id: NegotiatorId;
    /** The person, if the company has a named one. */
    name: string;
    trait: TraitType;
    /** Moves resistance for everybody, before the subject. */
    shift: number;
    /** How each subject lands with THIS person, on top of SUBJECT_SHIFT. */
    subjectShift: Partial<Record<Subject, number>>;
    /** What they ask for when they engage. */
    ask: (score: number) => Demand;
    /**
     * WHAT THEY DO WITH THE PLAYER'S ANSWER, and the real difference between
     * the five. Five voices over one identical decision is a reskin.
     *
     *   'none'      Your answer stands, whichever it was.
     *   'split'     REFUSE and they come back once at half the ask. Refusing
     *               the first number is therefore the right opening move.
     *   'raise'     MEET it and they come back once asking for more, because
     *               agreeing instantly is information about the ask. Refusing
     *               them works, so they are the exact inverse of 'split'.
     *   'withdraw'  REFUSE and they are gone permanently - no second approach,
     *               ever. Not a trade; a condition.
     */
    onAnswered: 'none' | 'split' | 'raise' | 'withdraw';
    lines: {
        engage: string;
        demandLine: string;
        refuseLine: string;
        met: string;
        rebuffed: string;
    };
}
