// src/features/casino/data/casinoData.ts
//
// ============================================================================
//  THE LADDER, AND WHY THE RUNGS ARE NOT EVEN
// ============================================================================
//
//  Seven rooms at 0, 100, 200, 300, 400, 500, 600, and the screen drew a
//  progress bar against a hardcoded 700 that matched nothing.
//
//  Even rungs are wrong here, and the reason is in the earning rate rather
//  than in the thresholds. Reputation is paid out per bet:
//
//      spendingRep = max(1, floor(bet / 10_000))
//
//  and the chips scale with the room. Athens tops out at a 50,000 chip, so a
//  maximum bet is worth +5 and the first hundred is about twenty spins. That
//  is a real climb. Istanbul's top chip is 2,500,000, worth +250 a hand - so
//  under even rungs, ONE hand clears an entire room and the remaining five
//  gates are decoration.
//
//  So the rungs widen with the rooms they gate. A hundred to leave Athens,
//  because that is the one you earn at five points a spin, and four hundred
//  for each one after, which is the smallest step that still costs more than
//  a single maximum bet at the bottom of each tier's chip range.
//
//  Asked for as "ilkini 100 yapalim, tier2'ye gecis sonrasi her biri 200 olsun
//  veya 400". Four hundred, for the reason above: two hundred is one hand at
//  the top of Istanbul's range and the ladder collapses again.
//
//  REPUTATION_CEILING moved with them. It was clamped at 1000 in four
//  separate logic files while the ladder now ends at 2100, so the last two
//  rooms would have been unreachable at any stake.
// ============================================================================

// ============================================================================
//  AND THEN IT WAS SEVEN ROOMS TOO MANY AND TWO ROOMS TOO LONG
// ============================================================================
//
//  Reported as "cut the reputation you need between casinos, it is absurdly
//  hard to make progress, and take the ladder down to five".
//
//  Seven rooms at 0/100/500/900/1300/1700/2100, earned at MAX_REP_PER_QUARTER
//  a quarter, is forty two quarters of maximum effort to reach the top - ten
//  and a half years of turning up, in a game whose whole run is about two
//  hundred quarters. The reasoning above is right about WHY the rungs widen;
//  it was wrong about how far apart they should be.
//
//  Five rooms now: a humble start, a regional house, the American spectacle,
//  the European one, and the summit. LONDON and SINGAPORE are SHELVED rather
//  than deleted, in place below.
//
//      Athens        0        the door
//      Istanbul     60        1.2 quarters
//      Las Vegas   180        3.6
//      Monte Carlo 360        7.2
//      Macau       600       12      about three years
//
//  Three years to the top instead of ten and a half, and each gate still
//  costs more than the one before it.
// ============================================================================

export type LocationId =
  | 'athens'
  | 'istanbul'
  | 'las_vegas'
  /** The VIP room. Not on the ladder at all - see data/vipRoom.ts. */
  | 'vip_noir'
  // SHELVED with the rooms themselves. The ids stay so an old save naming one
  // still type checks on its way through.
  | 'london'
  | 'singapore'
  | 'monte_carlo'
  | 'macau';

export interface CasinoTheme {
  primary: string;
  secondary: string;
  chipColor: string;
  gradient: string[];
  bgGradient: string[];
  accentGlow: string;
  badgeBg: string;
  textColor: string;
  icon: string;
  flag: string;
}

export type CasinoLocation = {
  id: LocationId;
  name: string;
  subTitle: string;
  requirement: number;
  /**
   * The share of the player's money one hand can cost here.
   *
   * Replaces a fixed `maxBet`, which could only ever be right for one
   * bankroll. See casinoStakes.ts.
   */
  maxBetPercent: number;
  /** And the floor under it, so a broke player can still sit down. */
  minMaxBet: number;
  theme: CasinoTheme;
  /**
   * The five faces its slot machines show, cheapest first.
   *
   * ------------------------------------------------------------------
   *  A SLOT PER CITY, AND ONLY THE FACES CHANGE
   * ------------------------------------------------------------------
   *  Asked for as "her sehre ayri slot yap, tabii sadece sembollerini
   *  degistir". Which is the right split: the maths is the machine and the
   *  faces are the room, so Athens and Macau look like different places
   *  without seven copies of a payout table to keep in step.
   *
   *  ORDER IS VALUE. The machine supplies the payouts and this supplies
   *  what they look like, so index 4 is always the jackpot face - which is
   *  why it is the city's own emblem, the same icon as `theme.icon` above.
   *
   *  All money and treasure: "yine de parasal yapabilirsin, elmas altin
   *  vs gibi". And every one of them is an icon this repo already draws
   *  somewhere else, so nothing here is a name that might not exist.
   * ------------------------------------------------------------------
   */
  slotFaces: readonly [string, string, string, string, string];
};

/**
 * The most reputation anybody can hold.
 *
 * Was 1000, typed by hand into four separate game logic files. The top room
 * now asks for 2100, so the clamp had to move or Monte Carlo and Macau were
 * gated behind a number the game refused to let you reach.
 */
export const REPUTATION_CEILING = 900;

/** What the progress bar is a fraction OF. The last room, not a round number. */
export const CASINO_LADDER_TOP = 600;

// ============================================================================
//  AND HOW FAST YOU CLIMB IT
// ============================================================================
//
//  Moving the rungs was not enough on its own, and a test found it rather than
//  I did. Reputation was paid as `max(1, floor(bet / 10_000))` with no upper
//  limit, and the chips run to fifty billion. So:
//
//      Athens      top chip 50,000        +5    a real climb
//      Istanbul    top chip 2,500,000     +250  one hand a room
//      Monte Carlo SMALLEST chip 10m      +1000 the cheapest bet in the
//                                               room clears the next gate
//                                               four times over
//
//  A ladder whose gates are cleared by the minimum bet is not a ladder, it is
//  a corridor with doors drawn on it. So a single bet is worth at most
//  MAX_REP_PER_BET, whatever it cost.
//
//  Twenty five, chosen against the rungs rather than in the abstract: sixteen
//  maximum bets to cross any four hundred gate, against twenty spins to leave
//  Athens at five a spin. The same climb at every size of stake, which is the
//  point - the rooms are earned by turning up, not by the size of one chip.
// ============================================================================

/** The most reputation any single bet can be worth. */
export const MAX_REP_PER_BET = 25;

/**
 * And the most a whole QUARTER can be worth, however long you sit there.
 *
 * Capping the bet was not enough either, which only became obvious once the
 * question "is this ladder actually a climb" was asked properly: there is no
 * energy cost on the casino and no limit on how many hands you play in a
 * quarter. `visitedThisQuarter` in useCasinoRiskStore is a boolean for the
 * scandal streak, not a limiter. So sixteen bets a gate is about a minute of
 * tapping, and the whole seven room ladder falls in one sitting to anybody
 * with a bankroll.
 *
 * A quarter is the unit this game measures everything else in. Fifty points
 * is two good evenings, so a four hundred gate is eight quarters and the walk
 * from Athens to Macau is about ten years of turning up. That is what makes
 * Macau a place somebody arrives at rather than a room they unlock.
 *
 * The money is untouched: you can lose as much as you like in an afternoon.
 * It is the STANDING that takes years, which is the right way round.
 */
export const MAX_REP_PER_QUARTER = 50;

/** One dollar of stake in reputation terms, before the cap. */
export const REP_PER_DOLLAR_STAKED = 1 / 10_000;

/**
 * What one bet is worth, which is the only place this is decided now.
 *
 * It was four copies of the same expression in four game logic files, none of
 * which had a cap and none of which knew about the ladder they were feeding.
 */
export const reputationForBet = (bet: number): number => {
    const staked = Math.max(0, bet || 0);
    return Math.max(1, Math.min(MAX_REP_PER_BET, Math.floor(staked * REP_PER_DOLLAR_STAKED)));
};

export const CASINO_LOCATIONS: CasinoLocation[] = [
  {
    id: 'athens',
    name: 'Athens',
    subTitle: 'The Agora',
    requirement: 0,
    maxBetPercent: 0.005,
    minMaxBet: 50_000,
    theme: {
      primary: '#05A8F6',
      secondary: '#EFC94C',
      chipColor: '#05A8F6',
      gradient: ['#05A8F6', '#0C6C9C'],
      bgGradient: ['#132838', '#1C242C', '#161F28'],
      accentGlow: 'rgba(5, 168, 246, 0.25)',
      badgeBg: 'rgba(5, 168, 246, 0.15)',
      textColor: '#7DD3FC',
      icon: 'pillar',
      flag: '🇬🇷',
    },
    slotFaces: ['cash', 'wallet-outline', 'bank-outline', 'diamond-stone', 'pillar'] as const,
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    subTitle: 'Bosphorus Royale',
    requirement: 60,
    maxBetPercent: 0.01,
    minMaxBet: 250_000,
    theme: {
      primary: '#3FC9C0',
      secondary: '#FFA94D',
      chipColor: '#3FC9C0',
      gradient: ['#3FC9C0', '#1C6B66'],
      bgGradient: ['#142B2B', '#1C242C', '#142022'],
      accentGlow: 'rgba(63, 201, 192, 0.25)',
      badgeBg: 'rgba(63, 201, 192, 0.15)',
      textColor: '#6EE7B7',
      icon: 'mosque',
      flag: '🇹🇷',
    },
    slotFaces: ['cash-multiple', 'treasure-chest', 'star-circle', 'ring', 'mosque'] as const,
  },
  {
    id: 'las_vegas',
    name: 'Las Vegas',
    subTitle: 'Neon Palace',
    requirement: 180,
    maxBetPercent: 0.02,
    minMaxBet: 1_000_000,
    theme: {
      primary: '#C4B5FD',
      secondary: '#F09BD0',
      chipColor: '#C4B5FD',
      gradient: ['#A78BFA', '#E879F9'],
      bgGradient: ['#281E38', '#1C242C', '#22192A'],
      accentGlow: 'rgba(196, 181, 253, 0.25)',
      badgeBg: 'rgba(196, 181, 253, 0.15)',
      textColor: '#DDD6FE',
      icon: 'dice-multiple',
      flag: '🇺🇸',
    },
    slotFaces: ['dice-5-outline', 'cash', 'bell-ring-outline', 'diamond-stone', 'dice-multiple'] as const,
  },
  // {
  // id: 'london',
  // name: 'London',
  // subTitle: 'The Crown Club',
  // requirement: 900,
  // maxBet: 100_000_000,
  // theme: {
  // primary: '#93A0F7',
  // secondary: '#EFC94C',
  // chipColor: '#93A0F7',
  // gradient: ['#6366F1', '#3730A3'],
  // bgGradient: ['#1C2038', '#1C242C', '#181A28'],
  // accentGlow: 'rgba(147, 160, 247, 0.25)',
  // badgeBg: 'rgba(147, 160, 247, 0.15)',
  // textColor: '#C7D2FE',
  // icon: 'crown',
  // flag: '🇬🇧',
  // },
  // slotFaces: ['cash-multiple', 'watch', 'bank', 'ring', 'crown'] as const,
  // },
  // {
  // id: 'singapore',
  // name: 'Singapore',
  // subTitle: 'Marina Bay Heights',
  // requirement: 1300,
  // maxBet: 1_000_000_000,
  // theme: {
  // primary: '#4ADE80',
  // secondary: '#7DD3FC',
  // chipColor: '#4ADE80',
  // gradient: ['#10B981', '#065F46'],
  // bgGradient: ['#142B22', '#1C242C', '#13201B'],
  // accentGlow: 'rgba(74, 222, 128, 0.25)',
  // badgeBg: 'rgba(74, 222, 128, 0.15)',
  // textColor: '#86EFAC',
  // icon: 'city-variant',
  // flag: '🇸🇬',
  // },
  // slotFaces: ['cash', 'chip', 'bank-outline', 'diamond-stone', 'city-variant'] as const,
  // },
  {
    id: 'monte_carlo',
    name: 'Monte Carlo',
    subTitle: 'Le Grand Casino',
    requirement: 360,
    maxBetPercent: 0.035,
    minMaxBet: 5_000_000,
    theme: {
      primary: '#EFC94C',
      secondary: '#FFA94D',
      chipColor: '#EFC94C',
      gradient: ['#F59E0B', '#B45309'],
      bgGradient: ['#2E2718', '#1C242C', '#221E15'],
      accentGlow: 'rgba(239, 201, 76, 0.25)',
      badgeBg: 'rgba(239, 201, 76, 0.15)',
      textColor: '#FDE68A',
      icon: 'diamond-stone',
      flag: '🇲🇨',
    },
    slotFaces: ['cash-multiple', 'watch', 'treasure-chest', 'castle', 'diamond-stone'] as const,
  },
  {
    id: 'macau',
    name: 'Macau',
    subTitle: "Dragon's Ascendancy",
    requirement: 600,
    maxBetPercent: 0.05,
    minMaxBet: 10_000_000,
    theme: {
      primary: '#FF8A8A',
      secondary: '#FFA94D',
      chipColor: '#FF8A8A',
      gradient: ['#EF4444', '#991B1B'],
      bgGradient: ['#30191C', '#1C242C', '#261517'],
      accentGlow: 'rgba(255, 138, 138, 0.25)',
      badgeBg: 'rgba(255, 138, 138, 0.15)',
      textColor: '#FECACA',
      icon: 'fire',
      flag: '🇲🇴',
    },
    slotFaces: ['cash', 'treasure-chest', 'tower-fire', 'diamond-stone', 'fire'] as const,
  },
];

// ============================================================================
//  AND ONE ROOM THAT IS NOT ON THE LADDER AT ALL
// ============================================================================
//
//  Asked for as "build a casino you can play with a percentage of your whole
//  fortune, only people over ten billion get in, once every five quarters, and
//  make it extremely premium: gold, black, silver and purple".
//
//  IT IS KEPT OUT OF `CASINO_LOCATIONS` ON PURPOSE. That array is the LADDER:
//  every screen that draws a progress bar, a room list, an unlock check or a
//  reputation gate walks it, and this room is gated by money and a cooldown
//  rather than by standing. Putting it in the array would give it a
//  `requirement` it does not have and a place on a bar it does not belong on.
//
//  It is a location in every other respect - the games, the chips, the header
//  and the themes all take one - so it is the same shape, exported on its own.
//  See data/vipRoom.ts for who gets in and what the stakes are.
//
//  THE LOOK. Gold on black with silver and violet, the palette that was asked
//  for and the only one in this file that does not belong to a city. Every
//  other room is somewhere; this one is a door in a corridor with no sign on
//  it. The faces follow: no landmark, no flag, just the objects themselves.
// ============================================================================

export const VIP_LOCATION: CasinoLocation = {
  id: 'vip_noir',
  name: 'Noir',
  subTitle: 'By Invitation',
  // Not on the ladder. Zero rather than a large number so that a screen which
  // reads it by accident lets the player in rather than locking a room they
  // have already paid ten billion to see.
  requirement: 0,
  // The stakes here are FOUR shares of everything, up to all of it, so these
  // two exist only to satisfy the same type as every other room.
  // See vipRoom.VIP_BET_FRACTIONS.
  maxBetPercent: 1,
  minMaxBet: 1_000_000_000,
  theme: {
    primary: '#EFC94C',
    secondary: '#C4B5FD',
    chipColor: '#D8D8DE',
    gradient: ['#EFC94C', '#8C7318'],
    // Nearly black, and darker than anywhere else in the game. That is the
    // whole effect: the gold has to be the only thing lit.
    bgGradient: ['#14100A', '#0E0E12', '#12101A'],
    accentGlow: 'rgba(239, 201, 76, 0.30)',
    badgeBg: 'rgba(239, 201, 76, 0.12)',
    textColor: '#F5E6A8',
    icon: 'crown-outline',
    flag: '',
  },
  slotFaces: ['silverware-variant', 'watch', 'diamond-stone', 'chess-king', 'crown-outline'] as const,
};

// ============================================================================
//  SHELVED: THE TWO ROOMS THAT CAME OUT
// ============================================================================
//  London (The Crown Club) and Singapore (Marina Bay Heights) are commented
//  out in place inside the array rather than deleted. Asked for as "take the
//  casino down to five", and the rest of that sentence was "we are going to
//  rework the whole thing anyway, treat this as preparation" - so the themes,
//  the slot faces and the copy are all still there to be picked back up.
//
//  Bringing one back is: uncomment it, and give it a `requirement`, a
//  `maxBetPercent` and a `minMaxBet` between its neighbours. Nothing reads the
//  list by length or by index.
// ============================================================================
