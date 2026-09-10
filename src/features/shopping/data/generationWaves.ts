// src/features/shopping/data/generationWaves.ts
//
// ============================================================================
//  THE SHELF THE FOUNDER SAW IS THE SHELF HIS GREAT GRANDCHILD SEES
// ============================================================================
//
//  Asked for as "the market growing when the child's time comes", and then
//  sized: twelve new things a generation, three of them properly expensive,
//  "because they are getting richer".
//
//  The catalogue is 108 items and every one of them is on the shelf in the
//  first quarter of the first generation. So an heir who inherits a company
//  worth four hundred billion opens LuxoNet and finds the same grid their
//  founder was browsing at four million, minus whatever the family has already
//  bought. The most expensive room in the game is also the most static.
//
//  ---------------------------------------------------------------------------
//  WHAT ARRIVES, AND WHY IT IS WRITTEN RATHER THAN GENERATED
//  ---------------------------------------------------------------------------
//  Two waves. Wave A opens for the second generation, wave B for the third,
//  and then it stops: a list that ends is more honest than a generator that
//  keeps inventing an eleventh Mile Spire forever, and this game is already
//  full of hand written things that are good BECAUSE somebody wrote them.
//
//  Each wave holds more than it shows. Eighteen written, twelve drawn: nine
//  from the ordinary band and three from the top of the market. Two runs of
//  the same game do not see the same shelf, which is the point of drawing at
//  all, and the six that did not come up are the reason to play a third.
//
//  ---------------------------------------------------------------------------
//  THE PRICES CLIMB BECAUSE THE PLAYER DOES
//  ---------------------------------------------------------------------------
//  Wave A sits where a second generation is: hundreds of millions to twenty
//  billion, with three things between seventy and two hundred sixty billion.
//  Wave B starts where wave A's ordinary band ended, and its top three run to
//  eight hundred eighty, one notch under the Ark and deliberately so. The Ark
//  is still the most expensive object in the game and nothing here unseats it.
//
//  ---------------------------------------------------------------------------
//  THEY LIVE IN `ITEMS` FROM THE FIRST QUARTER, AND ONLY THE SHELF IS GATED
//  ---------------------------------------------------------------------------
//  Tempting to keep them out of the registry until they unlock. That breaks
//  two things quietly.
//
//    PRESTIGE. `TOTAL_CATALOG_VALUE` is the denominator of the profile score.
//    If the catalogue grows at a succession, every collection in the game is
//    worth a smaller share of it the morning after, and a player who bought
//    nothing and sold nothing watches their number fall. Keeping the whole
//    written catalogue in the denominator from quarter one means the score
//    never moves under anybody.
//
//    OWNERSHIP. An owned asset is looked up by id in half a dozen places. An
//    id that only exists in some generations is a save waiting to fail.
//
//  So `ITEMS` is everything, always, and `logic/shelfNow.ts` answers the only
//  question that changes: what is on sale today.
//
//  No real makers, no real models, no named building anybody owns. See
//  noRealBrands.test.ts, which reads every field of every one of these.
// ============================================================================

import type { ShoppingItem } from '../types';

/**
 * One generation's worth of new stock.
 *
 * `rich` and `top` are separate lists rather than one list with a flag,
 * because the draw takes a fixed number from each. Three at the top every
 * time is the whole of "they are getting richer"; leaving it to chance would
 * produce a generation whose twelve new things were all yachts.
 */
export type Wave = {
    /** The generation this opens for. The founder is 1 and gets nothing. */
    generation: number;
    /** The ordinary band. Expensive, and not the top of the market. */
    rich: ShoppingItem[];
    /** The top of the market for this generation. */
    top: ShoppingItem[];
};

/** How many of the ordinary band come up per generation. */
export const RICH_DRAWN = 9;

/** How many of the top come up per generation. */
export const TOP_DRAWN = 3;

/** Twelve, as asked for. */
export const WAVE_DRAWN = RICH_DRAWN + TOP_DRAWN;

// ============================================================================
//  WAVE A - THE SECOND GENERATION
// ============================================================================
//
//  What a family buys once the money is older than the person spending it.
//  Almost everything here used to belong to somebody whose line ran out, which
//  is not subtle and is not meant to be: the player is buying the wreckage of
//  other dynasties in the same quarter they took over their own.
// ============================================================================

const WAVE_A_RICH: ShoppingItem[] = [
    {
        id: 'gw_a_01',
        shopId: 'shop_heritage_estates',
        name: 'The Emptied Duchy',
        price: 3_400_000_000,
        type: 'estate',
        brand: 'Heritage Estates',
        category: 'REAL_ESTATE',
        specs: ['Nine Villages', 'Own Courts', 'Sealed Archive', 'Standing Staff'],
        description: 'A duchy whose last family ran out of sons. Nine villages, a court that still sits, and four hundred years of paperwork in the cellar.',
    },
    {
        id: 'gw_a_02',
        shopId: 'shop_vault_properties',
        name: 'The Sovereign Vault Floor',
        price: 2_100_000_000,
        type: 'vault',
        brand: 'Vault Properties',
        category: 'REAL_ESTATE',
        specs: ['Bedrock', 'No Address', 'Own Power', 'Two Keys'],
        description: 'Eleven storeys under a neutral city. There is no street number and the second key is not yours.',
    },
    {
        id: 'gw_a_03',
        shopId: 'shop_urban_corp',
        name: 'The Harbour Freehold',
        price: 9_600_000_000,
        type: 'infrastructure',
        brand: 'Urban Corp',
        category: 'REAL_ESTATE',
        specs: ['Deep Water', 'Customs Rights', 'Rail Head', 'Perpetual'],
        description: 'A working harbour, freehold, with the right to clear its own customs. Everything that lands here lands on your paperwork.',
    },
    {
        id: 'gw_a_04',
        shopId: 'shop_skyline_architects',
        name: 'The Mile Spire',
        price: 18_000_000_000,
        type: 'tower',
        brand: 'Skyline Architects',
        category: 'REAL_ESTATE',
        specs: ['One Mile', 'Sky Lobbies', 'Own Power Station', 'Four Minute Lift'],
        description: 'A mile of tower with its own power station in the base. The lift to the top takes four minutes and people have learned to bring something to read.',
    },
    {
        id: 'gw_a_05',
        shopId: 'shop_poseidon_yards',
        name: 'The Icebound Explorer',
        price: 1_400_000_000,
        type: 'yacht',
        brand: 'Poseidon Yards',
        category: 'MARINE',
        specs: ['Polar Class', 'Submarine Bay', 'Ninety Days', 'Two Helipads'],
        description: 'Rated to break her own ice and stay out ninety days without seeing another hull.',
    },
    {
        id: 'gw_a_06',
        shopId: 'shop_deep_blue_systems',
        name: 'The Abyssal Survey Fleet',
        price: 3_800_000_000,
        type: 'submersible_fleet',
        brand: 'Deep Blue Systems',
        category: 'MARINE',
        specs: ['Full Ocean Depth', 'Three Craft', 'Mother Ship', 'Salvage Licence'],
        description: 'Three craft rated to the bottom of anything, a mother ship to carry them, and a licence that lets you keep what they find.',
    },
    {
        id: 'gw_a_07',
        shopId: 'shop_elitas_travel',
        name: 'The Continental Wing',
        price: 2_900_000_000,
        type: 'aircraft_fleet',
        brand: 'Elitas Travel',
        category: 'AIRCRAFT',
        specs: ['Twelve Aircraft', 'Own Slots', 'Ninety Crew', 'Six Hour Reach'],
        description: 'Twelve aircraft, ninety crew, and landing slots at four airports that do not sell them.',
    },
    {
        id: 'gw_a_08',
        shopId: 'shop_mach1_defense',
        name: 'The Interceptor Flight',
        price: 4_200_000_000,
        type: 'jet_fleet',
        brand: 'Mach1 Defense',
        category: 'AIRCRAFT',
        specs: ['Six Airframes', 'Demilitarized', 'Own Field', 'Type Rated'],
        description: 'Six of them with the teeth taken out, and a field to keep them on. The paperwork took eleven months longer than the sale.',
    },
    {
        id: 'gw_a_09',
        shopId: 'shop_cloud9_copters',
        name: 'The Rooftop Network',
        price: 1_100_000_000,
        type: 'helicopter_fleet',
        brand: 'Cloud9 Copters',
        category: 'AIRCRAFT',
        specs: ['Nine Machines', 'Forty Pads', 'Night Rated', 'Own Airspace'],
        description: 'Forty rooftops across one city, the machines to reach all of them, and the airspace nobody else may cross.',
    },
    {
        id: 'gw_a_10',
        shopId: 'shop_eden_islands',
        name: 'The Closed Archipelago',
        price: 5_500_000_000,
        type: 'island',
        brand: 'Eden Islands',
        category: 'REAL_ESTATE',
        specs: ['Fourteen Islands', 'One Reef', 'Desalination', 'No Overflight'],
        description: 'Fourteen islands inside a single reef, and a signed agreement that nothing at all flies over them.',
    },
    {
        id: 'gw_a_11',
        shopId: 'shop_ice_district',
        name: 'The Winter Principality',
        price: 2_600_000_000,
        type: 'resort',
        brand: 'Ice District',
        category: 'REAL_ESTATE',
        specs: ['Whole Valley', 'Own Lifts', 'Glacier Rights', 'Closed Season'],
        description: 'A valley, the lifts that serve it, and the right to close the season whenever you feel like it.',
    },
    {
        id: 'gw_a_12',
        shopId: 'shop_gem_vault',
        name: 'The Recovered Regalia',
        price: 900_000_000,
        type: 'jewelry_set',
        brand: 'Gem Vault',
        category: 'JEWELRY',
        specs: ['Eleven Pieces', 'Provenance', 'Unmounted', 'Private Sale'],
        description: 'Eleven pieces from a state that stopped existing, sold quietly by people who would rather not explain how they came by them.',
    },
    {
        id: 'gw_a_13',
        shopId: 'shop_imperial_crown',
        name: 'The Dispersed Collection',
        price: 1_800_000_000,
        type: 'jewelry_set',
        brand: 'Imperial Crown',
        category: 'JEWELRY',
        specs: ['Sixty Lots', 'Reassembled', 'Catalogued', 'One Owner'],
        description: 'Sixty lots scattered across a century of auctions, bought back one at a time by somebody very patient. What you are paying for is the patience.',
    },
];

const WAVE_A_TOP: ShoppingItem[] = [
    {
        id: 'gw_a_t1',
        shopId: 'shop_skyline_architects',
        name: 'The Chartered City',
        price: 210_000_000_000,
        type: 'city',
        brand: 'Skyline Architects',
        category: 'REAL_ESTATE',
        specs: ['Own Charter', 'Two Million', 'Own Courts', 'Ninety Nine Years'],
        description: 'Two million people, a charter of its own, and a ninety nine year lease on the ground under all of it. The courts answer to the charter.',
    },
    {
        id: 'gw_a_t2',
        shopId: 'shop_ascendant_orbital',
        name: 'The Orbital Freight Line',
        price: 140_000_000_000,
        type: 'launch_service',
        brand: 'Ascendant Orbital',
        category: 'SPACE',
        specs: ['Weekly Cadence', 'Two Ports', 'Own Fleet', 'Tariff Rights'],
        description: 'A launch every week, two ports to fly it from, and the right to set the tariff on everything anybody else sends up.',
    },
    {
        id: 'gw_a_t3',
        shopId: 'shop_urban_corp',
        name: 'The Continental Grid',
        price: 96_000_000_000,
        type: 'infrastructure',
        brand: 'Urban Corp',
        category: 'REAL_ESTATE',
        specs: ['Four Countries', 'Baseload', 'Sixty Year Term', 'Regulated'],
        description: 'The power under four countries. It is regulated, it is boring, and it has never once stopped.',
    },
    {
        id: 'gw_a_t4',
        shopId: 'shop_farside_ventures',
        name: 'The Belt Claim',
        price: 260_000_000_000,
        type: 'mineral_claim',
        brand: 'Farside Ventures',
        category: 'SPACE',
        specs: ['Registered Claim', 'Nine Bodies', 'Survey Complete', 'Unworked'],
        description: 'Nine bodies, surveyed, registered, and nobody has put a machine on any of them. The survey alone took eleven years.',
    },
    {
        id: 'gw_a_t5',
        shopId: 'shop_horizon_cruisers',
        name: 'The Floating City',
        price: 74_000_000_000,
        type: 'ship',
        brand: 'Horizon Cruisers',
        category: 'MARINE',
        specs: ['Forty Thousand', 'Never Docks', 'Own Flag', 'Own Registry'],
        description: 'Forty thousand residents under a flag of her own. She has not tied up anywhere in nine years and her registry is a filing cabinet aboard.',
    },
];

// ============================================================================
//  WAVE B - THE THIRD GENERATION
// ============================================================================
//
//  The band starts where wave A's ended. By here the family is not buying
//  what a dead dynasty left behind; it is buying things that had to be BUILT
//  for somebody with this much money, and several of them are not finished.
// ============================================================================

const WAVE_B_RICH: ShoppingItem[] = [
    {
        id: 'gw_b_01',
        shopId: 'shop_urban_corp',
        name: 'The Strait Concession',
        price: 44_000_000_000,
        type: 'infrastructure',
        brand: 'Urban Corp',
        category: 'REAL_ESTATE',
        specs: ['Both Shores', 'Transit Fees', 'Ninety Years', 'Guaranteed'],
        description: 'Both shores of a strait and the fee on everything that passes between them. Two governments guaranteed it and neither can afford to buy it back.',
    },
    {
        id: 'gw_b_02',
        shopId: 'shop_skyline_architects',
        name: 'The Buried Capital',
        price: 31_000_000_000,
        type: 'city',
        brand: 'Skyline Architects',
        category: 'REAL_ESTATE',
        specs: ['Whole City', 'Below Ground', 'Own Climate', 'Sealed'],
        description: 'A capital built downwards because the surface stopped being liveable. It has its own weather now, and somebody sets it.',
    },
    {
        id: 'gw_b_03',
        shopId: 'shop_heritage_estates',
        name: 'The Vacated Kingdom',
        price: 27_000_000_000,
        type: 'estate',
        brand: 'Heritage Estates',
        category: 'REAL_ESTATE',
        specs: ['Six Palaces', 'Crown Lands', 'Standing Guard', 'Ceremonial'],
        description: 'Six palaces, the land around them, and a guard that still changes at eleven every morning for nobody at all.',
    },
    {
        id: 'gw_b_04',
        shopId: 'shop_vault_properties',
        name: 'The Continental Reserve',
        price: 12_000_000_000,
        type: 'vault',
        brand: 'Vault Properties',
        category: 'REAL_ESTATE',
        specs: ['Bullion Grade', 'Four Sites', 'Own Assay', 'No Register'],
        description: 'Four vaults on three continents, an assay office of your own, and no register that anybody else is entitled to read.',
    },
    {
        id: 'gw_b_05',
        shopId: 'shop_poseidon_yards',
        name: 'The Sovereign Flotilla',
        price: 38_000_000_000,
        type: 'yacht_fleet',
        brand: 'Poseidon Yards',
        category: 'MARINE',
        specs: ['Nine Hulls', 'Own Flag', 'Refuelling', 'Standing Crew'],
        description: 'Nine hulls under one flag, crewed the year round, refuelling each other in open water so that none of them has to come in.',
    },
    {
        id: 'gw_b_06',
        shopId: 'shop_deep_blue_systems',
        name: 'The Trench Colony',
        price: 22_000_000_000,
        type: 'habitat',
        brand: 'Deep Blue Systems',
        category: 'MARINE',
        specs: ['Eleven Kilometres', 'Forty Residents', 'Sealed', 'Grown Food'],
        description: 'Forty people at the bottom of the deepest water on the planet, growing what they eat. Nobody has come up in two years.',
    },
    {
        id: 'gw_b_07',
        shopId: 'shop_elitas_travel',
        name: 'The Standing Air Bridge',
        price: 16_000_000_000,
        type: 'aircraft_fleet',
        brand: 'Elitas Travel',
        category: 'AIRCRAFT',
        specs: ['Sixty Aircraft', 'Four Hubs', 'Own Fuel', 'Nine Hundred Crew'],
        description: 'Sixty aircraft, four hubs and a fuel contract of your own. It moves whatever you say, wherever you say, without asking a schedule.',
    },
    {
        id: 'gw_b_08',
        shopId: 'shop_ascendant_orbital',
        name: 'The Ring Habitat',
        price: 58_000_000_000,
        type: 'orbital_station',
        brand: 'Ascendant Orbital',
        category: 'SPACE',
        specs: ['Four Thousand', 'Spun Gravity', 'Own Farms', 'Permanent'],
        description: 'Four thousand people living at one gravity in a ring that is never coming down. Children have been born up there.',
    },
    {
        id: 'gw_b_09',
        shopId: 'shop_eden_islands',
        name: 'The Made Island',
        price: 19_000_000_000,
        type: 'island',
        brand: 'Eden Islands',
        category: 'REAL_ESTATE',
        specs: ['Built Not Found', 'Forty Kilometres', 'Grown Reef', 'Deep Anchorage'],
        description: 'Forty kilometres of island that was not there twenty years ago, with a reef they grew on purpose and a chart that had to be redrawn.',
    },
    {
        id: 'gw_b_10',
        shopId: 'shop_ice_district',
        name: 'The Polar Freehold',
        price: 9_400_000_000,
        type: 'estate',
        brand: 'Ice District',
        category: 'REAL_ESTATE',
        specs: ['Whole Coast', 'Ice Rights', 'Research Station', 'Sole Access'],
        description: 'A coast nobody else may land on, and a station on it that has been running since before your grandfather bought his first factory.',
    },
    {
        id: 'gw_b_11',
        shopId: 'shop_mach1_defense',
        name: 'The Standing Squadron',
        price: 13_000_000_000,
        type: 'jet_fleet',
        brand: 'Mach1 Defense',
        category: 'AIRCRAFT',
        specs: ['Twenty Airframes', 'Own Field', 'Demilitarized', 'Crew Housing'],
        description: 'Twenty of them, a field to fly them from, and the houses for the four hundred people who keep them in the air.',
    },
    {
        id: 'gw_b_12',
        shopId: 'shop_gem_vault',
        name: 'The Single Stone',
        price: 6_800_000_000,
        type: 'gemstone',
        brand: 'Gem Vault',
        category: 'JEWELRY',
        specs: ['Eleven Hundred Carats', 'Uncut', 'One Owner', 'Unnamed'],
        description: 'Eleven hundred carats, still rough. Nobody has agreed on a name for it because nobody outside the room has been allowed to see it.',
    },
    {
        id: 'gw_b_13',
        shopId: 'shop_imperial_crown',
        name: 'The Whole Treasury',
        price: 8_100_000_000,
        type: 'jewelry_set',
        brand: 'Imperial Crown',
        category: 'JEWELRY',
        specs: ['Four Hundred Pieces', 'One Dynasty', 'Complete', 'Never Split'],
        description: 'Four hundred pieces from a single dynasty, complete, never once broken up in six hundred years. The completeness is the rare part.',
    },
];

const WAVE_B_TOP: ShoppingItem[] = [
    {
        id: 'gw_b_t1',
        shopId: 'shop_farside_ventures',
        name: 'The Outer System Charter',
        price: 880_000_000_000,
        type: 'charter',
        brand: 'Farside Ventures',
        category: 'SPACE',
        specs: ['Six Worlds', 'Exclusive', 'Two Centuries', 'Untested'],
        description: 'An exclusive charter over six worlds for two hundred years, signed by people who cannot enforce it and will not be alive to try.',
    },
    {
        id: 'gw_b_t2',
        shopId: 'shop_ascendant_orbital',
        name: 'The Orbital Ring',
        price: 760_000_000_000,
        type: 'megastructure',
        brand: 'Ascendant Orbital',
        category: 'SPACE',
        specs: ['Full Circumference', 'Four Tethers', 'Own Cadence', 'Half Built'],
        description: 'A ring all the way round, tethered at four points. It is half finished, and the half that exists is already carrying freight for other people.',
    },
    {
        id: 'gw_b_t3',
        shopId: 'shop_skyline_architects',
        name: 'The Roofed Sea',
        price: 520_000_000_000,
        type: 'megastructure',
        brand: 'Skyline Architects',
        category: 'REAL_ESTATE',
        specs: ['Inland Sea', 'Roofed', 'Own Climate', 'Nine Million'],
        description: 'They put a roof over an inland sea. Nine million people live under it now, in weather that somebody in an office decides on a Tuesday.',
    },
    {
        id: 'gw_b_t4',
        shopId: 'shop_urban_corp',
        name: 'The Water Concession',
        price: 410_000_000_000,
        type: 'infrastructure',
        brand: 'Urban Corp',
        category: 'REAL_ESTATE',
        specs: ['Two Continents', 'Fresh Water', 'Perpetual', 'Regulated'],
        description: 'The fresh water under two continents, in perpetuity. Every regulator involved signed it, and four of them have since said in public that they should not have.',
    },
    {
        id: 'gw_b_t5',
        shopId: 'shop_horizon_cruisers',
        name: 'The Migrant Fleet',
        price: 330_000_000_000,
        type: 'ship_fleet',
        brand: 'Horizon Cruisers',
        category: 'MARINE',
        specs: ['Ninety Hulls', 'Two Million', 'Own Flag', 'Never Lands'],
        description: 'Ninety hulls and two million people who have no other address. It has stayed outside every territorial water since the day it launched.',
    },
];

// ============================================================================
//  THE WAVES, IN ORDER
// ============================================================================

export const WAVE_A: Wave = {
    generation: 2,
    rich: WAVE_A_RICH,
    top: WAVE_A_TOP,
};

export const WAVE_B: Wave = {
    generation: 3,
    rich: WAVE_B_RICH,
    top: WAVE_B_TOP,
};

export const WAVES: Wave[] = [WAVE_A, WAVE_B];

/**
 * The last generation that opens anything new.
 *
 * After this the shelf is what it is. Asked for directly: "let it stop, the
 * shelf can stay as it is".
 */
export const LAST_GROWING_GENERATION = WAVES[WAVES.length - 1].generation;

/** Everything both waves hold, drawn or not. This is what joins `ITEMS`. */
export const WAVE_ITEMS: ShoppingItem[] = WAVES.flatMap(w => [...w.rich, ...w.top]);

/** Every id that is gated behind a generation, for the shelf to filter on. */
export const WAVE_ITEM_IDS: ReadonlySet<string> = new Set(WAVE_ITEMS.map(i => i.id));
