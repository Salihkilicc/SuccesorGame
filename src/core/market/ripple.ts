// src/core/market/ripple.ts
//
// ============================================================================
//  YOU WERE NOT THE ONLY ONE LOOKING AT IT
// ============================================================================
//
//  An acquisition in this game has always been a private transaction: you and
//  the target's board and a number. Nobody else was in the room, which is the
//  one thing about buying a company that is never true.
//
//  ---------------------------------------------------------------------------
//  TWO SHAPES, AND THEY WANT OPPOSITE THINGS FROM YOU
//  ---------------------------------------------------------------------------
//  A RIVAL wanted the company for the same reason you did, and losing it costs
//  them something real. They cannot undo the sale, so they take the part of it
//  that can still be moved: the people. What you paid for was a business plus
//  the synergy of running it beside your own, and the synergy is entirely made
//  of people who can resign.
//
//  A VULTURE never wanted to own it. They wanted it CHEAP - in eighteen
//  months, out of an administration, at a third of what you just paid. Buying
//  it early does not defeat them, it costs them a trade, and they are not
//  angry about that; they are simply going to explain to everybody, in
//  writing and with figures, exactly what you overpaid.
//
//  ---------------------------------------------------------------------------
//  ONE MECHANIC, TWO WEIGHTS - AND WHY IT IS NOT A SIEGE
//  ---------------------------------------------------------------------------
//  Both end in a RAID: a permanent cut to that deal's synergy realisation.
//  Deliberately a different shape from the territory dilemma, which trades a
//  recurring cost against a temporary one. Here the trade is CASH NOW against
//  PERMANENT DEGRADATION, and the reason it is permanent is not balance, it is
//  that people who have left do not come back. A siege ends when the besieger
//  stops paying for it. A team does not reassemble.
//
//  It also lands on exactly the thing the player bought, which a share penalty
//  would not: you still own the company, it still earns, and the reason you
//  paid a premium for it has quietly gone.
// ============================================================================

/** Who is annoyed, and how they express it. */
export type RippleKind =
    /** Somebody who wanted it. They hire its people. */
    | 'rival'
    /** Somebody who wanted it cheap, later. They publish. */
    | 'vulture';

export interface Ripple {
    /** Market id of the company that was bought. */
    company: string;
    kind: RippleKind;
    /** Cast id of whoever writes. Always somebody the game already knows. */
    from: string;
    /** The story flag raised when this company is acquired. */
    flag: string;
}

// ============================================================================
//  HOW HARD IT HURTS
// ============================================================================
//  A rival takes more than a vulture, and the reason is not that they are
//  angrier - it is that they can. A competitor who wanted the company has
//  somewhere to put its engineers on Monday; a fund does not, and all it can
//  really do is make the good ones read something worrying about their new
//  owner.
// ============================================================================

/** What a rival leaves you of the synergy you paid for. */
export const RIVAL_REALIZATION = 0.5;
/** What a vulture's note leaves you. */
export const VULTURE_REALIZATION = 0.7;

/**
 * What defending costs, as a multiple of the deal's ANNUAL EBIT.
 *
 * Not a flat sum, and that is the whole design of the cash option. A flat
 * retention package would be unaffordable early and free late, so the choice
 * would only exist in a narrow band of the campaign. Priced off the target's
 * own earnings, it stays a real decision at every scale - and it is priced off
 * the target rather than off the player, so buying something enormous means
 * defending something enormous.
 *
 * 1.5x annual EBIT. Measured against the synergy at stake: full synergy is
 * 30% of EBIT a year (SYNERGY_ANNUAL_RATIO), so a rival taking half of it
 * costs 0.15x EBIT every year, forever. The defence pays for itself in ten
 * years and never in a campaign shorter than that - which is the point. It is
 * NOT a good deal on a spreadsheet. It is a good deal if you intend to still
 * be holding this company in a decade, and the player has to decide whether
 * they are that person.
 */
export const DEFENCE_COST_MULTIPLE = 1.5;

export const defenceCost = (targetAnnualEbit: number): number =>
    // `Math.max(0, undefined)` is NaN, not 0, and NaN spent against capital is
    // a balance sheet that reads NaN forever with nothing to point at. Found
    // by a wiring test that expected a charge and got zero.
    Math.max(0, Number.isFinite(targetAnnualEbit) ? targetAnnualEbit : 0)
    * DEFENCE_COST_MULTIPLE;

/** What a raid leaves, given who is doing it. */
export const realizationAfter = (kind: RippleKind): number =>
    kind === 'rival' ? RIVAL_REALIZATION : VULTURE_REALIZATION;

// ============================================================================
//  THE SIX
// ============================================================================
//  Every one of these is a company the market actually lists and a person the
//  game has already spent prompts building. Nobody new is invented for this,
//  and that is the point of choosing these six rather than six at random: the
//  ripple is only interesting if the person on the other end is somebody the
//  player already has an opinion about.
//
//  Four rivals and two vultures. The two vultures are the two companies that
//  were VISIBLY dying - SkyNet burning its runway, Planora small and
//  unprofitable - because a fund circling a healthy business is not a vulture,
//  it is just a buyer.
// ============================================================================

export const RIPPLES: Ripple[] = [
    // Edison Motors is the Robotics incumbent and VoltMotors makes batteries.
    // He was not going to let a drivetrain supplier go to somebody else.
    { company: 'ind_voltmotors', kind: 'rival', from: 'edison', flag: 'boughtVoltmotors' },
    // Streamify is music streaming in the Consumer category. Vogel has been
    // buying that shelf for a decade.
    { company: 'tech_streamify', kind: 'rival', from: 'pear', flag: 'boughtStreamify' },
    // A chip company, taken by somebody who is not an AI lab, in front of the
    // AI lab that depends on it.
    { company: 'tech_chip', kind: 'rival', from: 'openai', flag: 'boughtNovidia' },
    // A device startup inside the standards committee's category.
    { company: 'health_bio', kind: 'rival', from: 'swanson', flag: 'boughtBiogen' },
    // Halberd was waiting for her runway to run out, and it was going to.
    { company: 'tech_skynet', kind: 'vulture', from: 'vulture', flag: 'boughtSkynet' },
    // And they were waiting for his, which is worse, because you were the
    // reason he had one.
    { company: 'tech_planora', kind: 'vulture', from: 'vulture', flag: 'boughtPlanora' },
];

export const rippleFor = (company: string): Ripple | undefined =>
    RIPPLES.find(r => r.company === company);

/** The flag to raise when a company is bought, if anybody cares that it was. */
export const rippleFlagFor = (company: string): string | undefined =>
    rippleFor(company)?.flag;
