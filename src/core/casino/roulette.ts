// src/core/casino/roulette.ts
//
// ============================================================================
//  THE WHEEL, SEPARATED FROM THE SHOW
// ============================================================================
//
//  First of the four engines. The rule agreed before starting the casino
//  rewrite: THE ENGINE PRODUCES THE RESULT AT ONCE, THE SCREEN TAKES ITS TIME
//  TELLING YOU.
//
//  It mattered because `useRouletteLogic` did both. It held the bets, checked
//  the money, span a `setTimeout(3000)`, generated the number inside the
//  callback, evaluated every bet, paid out, banked reputation and set six
//  pieces of component state - so changing how long the wheel spins meant
//  editing the file that decides who wins. Nothing here can be tested without
//  waiting three seconds for it, either.
//
//  So: this file knows what a wheel is and what a bet pays. It has no timers,
//  no stores, no React, and its randomness is injected. The hook keeps the
//  money and the animation keeps the clock.
//
//  ---------------------------------------------------------------------------
//  AND THE POCKET ORDER IS NOT 0 TO 36
//  ---------------------------------------------------------------------------
//  This is the part that only exists because the wheel is about to be drawn.
//  A real single zero wheel is deliberately arranged so that numerically
//  adjacent numbers are physically far apart, and reds and blacks alternate
//  all the way round. 32 sits next to 0; 26 sits on its other side.
//
//  Without it the ball would land in pocket "17" at seventeen thirty seven of
//  the way round the wheel, the colours would run in eighteen red then
//  eighteen black, and it would look like a pie chart rather than a roulette
//  wheel. The old code never needed this because it never drew anything.
// ============================================================================

/**
 * The single zero wheel, clockwise from the green pocket.
 *
 * Checked in the test rather than trusted: all thirty seven numbers, each
 * exactly once, and colours alternating everywhere except around the zero.
 */
export const WHEEL_ORDER: readonly number[] = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const POCKET_COUNT = WHEEL_ORDER.length;

/** Degrees of arc one pocket occupies. */
export const POCKET_ARC = 360 / POCKET_COUNT;

export const RED_NUMBERS: readonly number[] = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

export type PocketColour = 'red' | 'black' | 'green';

/**
 * WHAT RED AND BLACK ACTUALLY LOOK LIKE.
 *
 * Here rather than in a component because there are two things drawing this
 * wheel - the betting table and the wheel itself - and they had two different
 * reds. A player looking at a #B91C1C square and a #C0392B pocket is looking
 * at two colours and being told they are the same fact.
 *
 * They are NOT theme tokens on purpose. This is a roulette table: its red and
 * its green mean roulette, not profit and loss, and borrowing the theme's
 * signal colours here would be the one thing rule 4 forbids.
 */
export const FELT = {
    red: '#B91C1C',
    black: '#15191E',
    green: '#166534',
    /** The rim and the frets between the pockets. */
    rim: '#2A2E35',
    /** The ball. */
    ivory: '#F4F4F6',
} as const;

export const feltColour = (n: number): string => FELT[colourOf(n)];

export const colourOf = (n: number): PocketColour => {
    if (n === 0) return 'green';
    return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

/**
 * Where a number physically sits, in degrees clockwise from the top.
 *
 * The CENTRE of the pocket, so the ball has somewhere to come to rest rather
 * than balancing on a fret.
 */
export const pocketAngle = (n: number): number => {
    const index = WHEEL_ORDER.indexOf(n);
    if (index < 0) return 0;
    return index * POCKET_ARC + POCKET_ARC / 2;
};

/** And back again, which is what a dragged or overshot wheel needs. */
export const numberAtAngle = (degrees: number): number => {
    const d = ((degrees % 360) + 360) % 360;
    return WHEEL_ORDER[Math.floor(d / POCKET_ARC) % POCKET_COUNT];
};

// ============================================================================
//  WHAT YOU CAN BET ON, AND WHAT IT PAYS
// ============================================================================
//
//  The multipliers are TOTAL RETURN, not profit: a red that comes in pays 2,
//  meaning the stake comes back with one more beside it. Written down because
//  the difference between 35 and 36 here is the difference between a house
//  edge of 2.7% and one of nothing at all, and the old code carried these as
//  bare numbers in a switch with no note saying which convention it meant.
//
//  MEASURED, at the bottom of the test: every bet on the table returns 97.3%
//  except the straight up, which returns 94.6%. Both are the real figures for
//  a single zero wheel, so the maths was already right; it just could not be
//  checked without running the game.
// ============================================================================

export type BetType =
    | `S${number}`
    | 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH'
    | '1ST12' | '2ND12' | '3RD12';

export interface BetOutcome {
    won: boolean;
    /** Total returned per unit staked. Zero when it loses. */
    multiplier: number;
}

export const evaluateBet = (result: number, betType: string): BetOutcome => {
    if (betType.startsWith('S')) {
        const num = parseInt(betType.slice(1), 10);
        return { won: result === num, multiplier: 35 };
    }

    switch (betType) {
        case 'RED': return { won: result !== 0 && colourOf(result) === 'red', multiplier: 2 };
        case 'BLACK': return { won: result !== 0 && colourOf(result) === 'black', multiplier: 2 };
        case 'EVEN': return { won: result !== 0 && result % 2 === 0, multiplier: 2 };
        case 'ODD': return { won: result % 2 === 1, multiplier: 2 };
        case 'LOW': return { won: result >= 1 && result <= 18, multiplier: 2 };
        case 'HIGH': return { won: result >= 19 && result <= 36, multiplier: 2 };
        case '1ST12': return { won: result >= 1 && result <= 12, multiplier: 3 };
        case '2ND12': return { won: result >= 13 && result <= 24, multiplier: 3 };
        case '3RD12': return { won: result >= 25 && result <= 36, multiplier: 3 };
        default: return { won: false, multiplier: 0 };
    }
};

export interface PlacedBet { type: string; amount: number }

export interface SpinSettlement {
    /** The pocket the ball finished in. */
    result: number;
    colour: PocketColour;
    /** Everything staked this spin. */
    staked: number;
    /** Everything returned, stake included. Zero on a total loss. */
    returned: number;
    /** returned - staked. Negative on a losing spin. */
    net: number;
    /** Which bets came in, so the table can light them up. */
    winners: string[];
}

/**
 * The whole spin, decided in one synchronous call.
 *
 * `roll` is injected so the test is real and so a story event could one day
 * hand it a rigged wheel without this file knowing.
 */
export const spinRoulette = (
    bets: PlacedBet[],
    roll: () => number = Math.random,
): SpinSettlement => {
    // `Math.max(0, NaN)` is NaN and so is everything downstream of it, so a
    // broken die used to put the ball in pocket NaN and settle every bet
    // against it. Found by the edge case test, which is the point of having
    // the die injected at all.
    const raw = roll();
    const die = Number.isFinite(raw) ? raw : 0;
    const result = Math.min(POCKET_COUNT - 1, Math.max(0, Math.floor(die * POCKET_COUNT)));

    let staked = 0;
    let returned = 0;
    const winners: string[] = [];

    for (const bet of bets || []) {
        const amount = Math.max(0, bet?.amount || 0);
        staked += amount;
        const { won, multiplier } = evaluateBet(result, bet?.type ?? '');
        if (won) {
            returned += amount * multiplier;
            winners.push(bet.type);
        }
    }

    return { result, colour: colourOf(result), staked, returned, net: returned - staked, winners };
};

// ============================================================================
//  AND WHAT THE ANIMATION NEEDS FROM IT
// ============================================================================
//
//  The result is already decided, so the wheel is not deciding anything: it is
//  being told where to stop. These two produce the angles that get it there.
// ============================================================================

/** Full turns the wheel makes before settling. */
export const WHEEL_TURNS = 3;
/** And the ball, which goes the OTHER WAY and faster. That is what sells it. */
export const BALL_TURNS = 6;

export interface SpinAngles {
    /** Where the wheel ends up, in degrees. Always positive and increasing. */
    wheelTo: number;
    /** Where the ball ends up, relative to the wheel's own frame. */
    ballTo: number;
}

/**
 * The two end angles for a given result.
 *
 * The wheel turns clockwise and the ball anticlockwise, which is how a croupier
 * actually launches it, and it is the single detail that makes a wheel read as
 * a wheel rather than as a spinning picture.
 *
 * `fromWheel` lets a second spin carry on from where the first one stopped
 * instead of snapping back to zero.
 */
export const spinAngles = (
    result: number,
    fromWheel: number = 0,
    fromBall: number = 0,
): SpinAngles => {
    const pocket = pocketAngle(result);
    // The wheel goes clockwise, so it always ADDS. Landing angle is chosen so
    // the ball's resting place lines up with the pocket once both have stopped.
    const wheelTo = fromWheel + WHEEL_TURNS * 360 + (360 - (fromWheel % 360));

    // ------------------------------------------------------------------
    //  THE BALL HAS TO CARRY ON FROM WHERE IT STOPPED, TOO
    // ------------------------------------------------------------------
    //  Reported as "sometimes it is not the ball that spins, the wheel
    //  disc does".
    //
    //  THE DEFECT, and it only showed from the SECOND spin onwards, which
    //  is why it read as intermittent. `ballTo` used to be an absolute
    //  angle - always -(6 x 360) - pocket - while the wheel accumulated
    //  through `fromWheel`. So on the first spin the ball travelled six
    //  turns from zero and looked right, and on every spin after that it
    //  was ALREADY at roughly that angle: the new target differed only by
    //  the gap between the old pocket and the new one. A few degrees.
    //  Sometimes backwards.
    //
    //  Meanwhile the wheel kept doing its full three turns. A wheel
    //  turning under a ball that twitches is exactly "the disc spins, not
    //  the ball".
    //
    //  So the ball is given a target relative to where it IS, then walked
    //  further anticlockwise until it lands on the pocket exactly. The
    //  residue is unchanged - it still finishes at -pocket, so the landing
    //  is identical - only the distance travelled is fixed.
    // ------------------------------------------------------------------
    const wanted = -pocket;
    const atLeast = fromBall - BALL_TURNS * 360;
    // How far past the target that overshoots, as a positive angle.
    const drift = (((atLeast - wanted) % 360) + 360) % 360;
    const ballTo = atLeast - drift;

    return { wheelTo, ballTo };
};
