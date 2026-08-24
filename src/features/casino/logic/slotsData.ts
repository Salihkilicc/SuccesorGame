// src/features/casino/logic/slotsData.ts
//
// ============================================================================
//  THREE MACHINES ABOUT THE COMPANY
// ============================================================================
//
//  What was here: Street Fighter Slots, Poseidon's Fortune and High Roller
//  Deluxe, with thirteen emoji between them, in a game about a succession.
//
//  ---------------------------------------------------------------------------
//  AND THE MULTIPLIER TABLES DECIDED NOTHING
//  ---------------------------------------------------------------------------
//  Every machine carried a `multipliers` map and a `twoKindMultiplier`, five
//  and one per machine, eighteen hand-written numbers - and NOTHING READ ANY OF
//  THEM. The payout in useSlotsLogic was a flat `bet * 3` for a jackpot and
//  `bet * 2` for a mini, whatever landed. So the reels were scenery: what they
//  showed had no bearing on what you won, and the three machines differed only
//  in which pictures went past.
//
//  The same shape as the buyout price and the sponsorship brand gain: careful
//  data, correctly authored, that nothing downstream consults.
//
//  ---------------------------------------------------------------------------
//  AND THE HOUSE TOOK FORTY FIVE PER CENT
//  ---------------------------------------------------------------------------
//  Measured off the old odds: a jackpot at 1/14 paying 3x and a mini at 1/6
//  paying 2x returns 0.548 of the stake. Real machines return between 0.92 and
//  0.96, and even a punishing one does not take half. That was not a
//  difficulty setting, it was an unnoticed arithmetic result - nobody multiplied
//  the two lines together.
//
//  ---------------------------------------------------------------------------
//  SO: THE TICKER, THE BOARDROOM, THE DYNASTY
//  ---------------------------------------------------------------------------
//  Asked for as "bizim oyuna gore, temaya gore". Each machine is one of the
//  three things this game is actually about, the symbols are
//  MaterialCommunityIcons rather than emoji, and the multipliers are now what
//  a line pays.
//
//  The three climb in volatility rather than in generosity: the Ticker pays
//  small and often, the Dynasty pays rarely and enormously, and all three
//  return the same fraction of the stake in the long run. Picking a machine is
//  a choice about the SHAPE of the evening, not about which one is better,
//  because a machine that is simply better makes the other two furniture.
// ============================================================================

import { palette } from '../../../core/theme';

export type SlotVariant = 'ticker' | 'boardroom' | 'dynasty';

export type SlotSymbol = {
    /** Stable key. Used by the reel, the payout table and the tests. */
    id: string;
    /** MaterialCommunityIcons name. */
    icon: string;
    /** What three of them pay, as a multiple of the stake. */
    payout: number;
    /**
     * The colour it is drawn in, from the palette.
     *
     * ------------------------------------------------------------------
     *  COLOUR IS THE PAYOUT TABLE, DRAWN
     * ------------------------------------------------------------------
     *  Every symbol on a reel used to be tinted with the ROOM's colour, so
     *  five different things arrived in one colour and a machine read as a
     *  column of identical blue shapes. Reported as "daha renkli".
     *
     *  More colours would fix the look and waste the opportunity. These
     *  climb with the payout - grey at the bottom, orange and violet at the
     *  top - so a player learns what a good symbol looks like before they
     *  have read a single number, and a near miss on the crown is visible
     *  from across the reel.
     *
     *  Green and red are absent on purpose. They mean profit and loss in
     *  this game and the amount that floats up after a spin is already
     *  using them; a symbol that looked like a signal would be worse than
     *  a symbol with no colour at all. See core/theme.ts.
     * ------------------------------------------------------------------
     */
    colour: string;
};

export type SlotConfig = {
    title: string;
    icon: string;
    subtitle: string;
    symbols: SlotSymbol[];
    /** What two of a kind pays, as a multiple of the stake. */
    twoKindMultiplier: number;
    /**
     * Chance of three of a kind. This is the machine's CHARACTER: the Ticker
     * hits one spin in nine and the Dynasty one in fifty five.
     *
     * The two-of-a-kind rate is NOT stored beside it. See `miniOdds` below -
     * it is solved for, so that editing a payout cannot silently move the
     * return away from TARGET_RTP the way the old flat 3x and 2x did.
     */
    jackpotOdds: number;
    minBet: number;
    maxBet: number;
};

/**
 * What every machine returns over a long enough evening.
 *
 * Ninety four per cent, which is an ordinary real-world figure and about
 * forty points kinder than what was here. The house still wins; it stops
 * being the worst trade in the game by an order of magnitude.
 *
 * Every machine is tuned to this same number - see slotsData.test.ts, which
 * checks it rather than trusting it - so the three of them differ in how the
 * evening FEELS and not in what it costs.
 */
export const TARGET_RTP = 0.94;

const sym = (
    id: string, icon: string, payout: number, colour: string,
): SlotSymbol => ({ id, icon, payout, colour });

export const SLOT_CONFIG: Record<SlotVariant, SlotConfig> = {
    // ------------------------------------------------------------------
    //  THE TICKER - small, frequent, and nearly always something
    // ------------------------------------------------------------------
    //  The grinder. A jackpot better than one spin in nine, and the payouts
    //  are correspondingly modest. This is the machine to sit at when what
    //  you want is to still be sitting there in an hour.
    // ------------------------------------------------------------------
    ticker: {
        title: 'The Ticker',
        icon: 'chart-line',
        subtitle: 'Small print, small margins, all night long',
        //  Icons the rest of the game already uses: `bank` and
        //  `rocket-launch-outline` are both from core/market/companyVisuals,
        //  which is where every company on the stock screen gets its face.
        symbols: [
            sym('bear', 'trending-down', 3, palette.grey),
            sym('bull', 'trending-up', 4, palette.greyLight),
            sym('bell', 'bell-ring-outline', 5, palette.blueLight),
            sym('vault', 'bank', 6, palette.orangeMuted),
            sym('ipo', 'rocket-launch-outline', 9, palette.violet),
        ],
        twoKindMultiplier: 1.5,
        jackpotOdds: 0.11,
        minBet: 10,
        maxBet: 30_000,
    },

    // ------------------------------------------------------------------
    //  THE BOARDROOM - the middle of the three, in every sense
    // ------------------------------------------------------------------
    boardroom: {
        title: 'The Boardroom',
        icon: 'gavel',
        subtitle: 'Motions carried, seats taken, minutes kept',
        symbols: [
            sym('minutes', 'file-document-outline', 4, palette.grey),
            sym('seat', 'seat-outline', 6, palette.greyLight),
            sym('gavel', 'gavel', 8, palette.blueLight),
            sym('seal', 'seal-variant', 11, palette.orangeMuted),
            sym('signature', 'fountain-pen-tip', 16, palette.orange),
        ],
        twoKindMultiplier: 1.4,
        jackpotOdds: 0.06,
        minBet: 10,
        maxBet: 60_000,
    },

    // ------------------------------------------------------------------
    //  THE DYNASTY - rare, and worth waiting for
    // ------------------------------------------------------------------
    //  The one that pays a hundred times the stake and almost never does.
    //  Same return as the other two over a long enough night, which is the
    //  point of a volatility ladder: you are choosing the shape of the
    //  variance, not buying a better deal.
    // ------------------------------------------------------------------
    dynasty: {
        title: 'The Dynasty',
        icon: 'crown',
        subtitle: 'Rings, wills, and the name on the building',
        //  `castle` is the fairytale venue from the proposal sheet and
        //  `crown` is the London casino's own emblem, so the two most
        //  valuable faces in the game are things the player has already met.
        symbols: [
            sym('cradle', 'baby-carriage', 8, palette.grey),
            sym('ring', 'ring', 14, palette.greyLight),
            sym('will', 'scroll', 22, palette.blueLight),
            sym('estate', 'castle', 40, palette.violet),
            sym('crown', 'crown', 100, palette.orange),
        ],
        twoKindMultiplier: 1.2,
        jackpotOdds: 0.018,
        minBet: 10,
        maxBet: 100_000,
    },
};

export const VARIANTS: readonly SlotVariant[] = ['ticker', 'boardroom', 'dynasty'] as const;

/** Every icon name a machine can show, for the reel strip. */
export const iconStrip = (config: SlotConfig): string[] => config.symbols.map(s => s.icon);

/** What colour an icon is drawn in. Falls back to plain white. */
export const colourOfIcon = (config: SlotConfig, icon: string): string =>
    config.symbols.find(s => s.icon === icon)?.colour ?? '#FFFFFF';

/** The symbol behind an icon name, for turning a landed reel into money. */
export const symbolByIcon = (config: SlotConfig, icon: string): SlotSymbol | undefined =>
    config.symbols.find(s => s.icon === icon);

/**
 * What a machine actually returns per unit staked.
 *
 * Three of a kind is equally likely to be any symbol, so a jackpot is worth
 * the AVERAGE of the payout table. Two of a kind pays the flat two-kind rate.
 *
 * Exported because a number this important should be checkable rather than
 * asserted in a comment - see slotsData.test.ts, which measures all three.
 */
export const meanJackpot = (config: SlotConfig): number => {
    const payouts = config.symbols.map(s => s.payout);
    if (payouts.length === 0) return 0;
    return payouts.reduce((a, b) => a + b, 0) / payouts.length;
};

/**
 * The chance of two of a kind, SOLVED rather than stored.
 *
 * This is the whole reason the machines can be trusted. Three numbers decide
 * a return - the payout table, the jackpot rate and the two-kind rate - and
 * the old file had all three typed by hand and none of them multiplied
 * together, which is how it ended up taking forty five per cent. Fixing the
 * numbers once would have fixed nothing: the next person to make the crown
 * pay more would have put it straight back.
 *
 * So two of the three are the design and the third falls out of them:
 *
 *      jackpot x meanPayout  +  mini x twoKind  =  TARGET_RTP
 *
 * Edit a payout and the machine rebalances itself.
 */
export const miniOdds = (config: SlotConfig): number => {
    const two = Math.max(0.01, config.twoKindMultiplier);
    const fromJackpot = config.jackpotOdds * meanJackpot(config);
    const remaining = TARGET_RTP - fromJackpot;
    // Never negative, and never so generous that the two rates cannot both
    // fit inside one spin.
    return Math.max(0, Math.min(1 - config.jackpotOdds, remaining / two));
};

export const expectedReturn = (config: SlotConfig): number =>
    config.jackpotOdds * meanJackpot(config) + miniOdds(config) * config.twoKindMultiplier;

/**
 * Whether a machine can actually be balanced, and the limit of the trick above.
 *
 * Solving the two-kind rate absorbs a payout edit only while there is slack to
 * absorb it with. Once the jackpot leg ALONE exceeds the target - a rare enough
 * face paying enough that one in fifty spins returns more than the whole
 * budget - the second prize goes to zero and the machine still pays out more
 * than it takes. That is a misconfiguration rather than a bug, and this is how
 * it says so instead of quietly running at a hundred and thirty per cent.
 *
 * Checked for all three in slotsData.test.ts, so a tuning pass cannot ship one
 * that is broken this way.
 */
export const isBalanced = (config: SlotConfig): boolean =>
    config.jackpotOdds * meanJackpot(config) <= TARGET_RTP;
