import { Shop, ShoppingItem } from '../../types';

// ============================================================================
// SPACE - THE TOP OF THE MARKET (Min $2B)
// ============================================================================
//
//  Asked for as "put a few very expensive things in, space included" and
//  "some shops are empty and it needs more, expensive things".
//
//  ---------------------------------------------------------------------------
//  THE SHOP STOPPED AT SIX AND A HALF BILLION AND THE GAME DOES NOT
//  ---------------------------------------------------------------------------
//  The ceiling was the Zenith Tower at $6.5B, which is a lot of money and is
//  not the money this game ends with. Its OWN title ladder says so, in
//  core/story/title.ts, and it was written long before this catalogue:
//
//      $1B      Magnate
//      $10B     Tycoon
//      $100B    Titan of Industry
//      $1T      Colossus
//
//  So a player who reaches the last of those four titles had a shop whose most
//  expensive object cost them 0.65% of what they were worth. That is the
//  complaint - "we become trillionaires and there need to be things worth
//  spending it on" - and it is answerable out of the game's own numbers rather
//  than out of taste. The Ark Programme below is $980B, one notch under
//  Colossus, and it is deliberately the only thing at that height.
//
//  ---------------------------------------------------------------------------
//  AND SPACE IS THE MOST EXPENSIVE THING IN THE GAME TO OWN
//  ---------------------------------------------------------------------------
//  Which is the joke, and it is also true. A yacht is the standing joke about
//  ownership costs and an orbital asset is worse in every direction: it needs a
//  ground crew that never stands down, a launch cadence to stay up at all, and
//  it is being sandblasted by a vacuum the entire time. The rates in
//  core/luxury put SPACE above MARINE on upkeep, above MARINE on decay, and
//  below it on drift - the three worst numbers in the game on one department.
//
//  Buying one of these is meant to be a decision a player regrets slowly.
// ============================================================================

export const spaceData: { shops: Shop[], items: ShoppingItem[] } = {
    shops: [
        {
            id: 'shop_ascendant_orbital',
            name: 'Ascendant Orbital',
            url: 'www.ascendant.orbital',
            category: 'SPACE',
            description: 'Low orbit, held privately.',
            bannerColor: '#05A8F6',
            emoji: '',
        },
        {
            id: 'shop_farside_ventures',
            name: 'Farside Ventures',
            url: 'www.farside.ventures',
            category: 'SPACE',
            description: 'Everything past the moon.',
            bannerColor: '#05A8F6',
            emoji: '',
        },
    ],

    items: [
        // ====================================================================
        // ASCENDANT ORBITAL - Low orbit
        // ====================================================================
        {
            id: 'spc_asc_001',
            shopId: 'shop_ascendant_orbital',
            name: 'Suborbital Tourist Fleet',
            price: 2400000000,
            type: 'suborbital_fleet',
            brand: 'Ascendant Orbital',
            category: 'SPACE',
            specs: ['Six Vehicles', 'Eleven Minutes', 'Reusable', 'Licensed'],
            description: 'Six ships, a spaceport lease and the licence to fly paying passengers to the edge.',
        },
        {
            id: 'spc_asc_002',
            shopId: 'shop_ascendant_orbital',
            name: 'Private Launch Complex',
            price: 14000000000,
            type: 'launch_site',
            brand: 'Ascendant Orbital',
            category: 'SPACE',
            specs: ['Two Pads', 'Equatorial', 'Own Airspace', 'Fuel Plant'],
            description: 'An equatorial launch site with two pads, its own airspace and nobody to ask.',
        },
        {
            id: 'spc_asc_003',
            shopId: 'shop_ascendant_orbital',
            name: 'Geostationary Constellation',
            price: 38000000000,
            type: 'satellite_network',
            brand: 'Ascendant Orbital',
            category: 'SPACE',
            specs: ['400 Satellites', 'Global Coverage', 'Own Spectrum', 'Encrypted'],
            description: 'Four hundred satellites and the spectrum rights. Half the planet talks through it.',
        },
        {
            id: 'spc_asc_004',
            shopId: 'shop_ascendant_orbital',
            name: 'Orbital Residence Ring',
            price: 95000000000,
            type: 'orbital_station',
            brand: 'Ascendant Orbital',
            category: 'SPACE',
            specs: ['Spun Gravity', 'Twelve Suites', 'Cupola Deck', 'Permanent Crew'],
            description: 'A spun ring with twelve suites and a window nobody else on Earth is looking through.',
        },

        // ====================================================================
        // FARSIDE VENTURES - Past the moon
        // ====================================================================
        {
            id: 'spc_far_001',
            shopId: 'shop_farside_ventures',
            name: 'Deep Field Observatory',
            price: 26000000000,
            type: 'observatory',
            brand: 'Farside Ventures',
            category: 'SPACE',
            specs: ['Lunar Farside', 'Radio Quiet', 'Naming Rights', 'Sole Access'],
            description: 'Built on the far side, where the moon itself blocks every radio on Earth.',
        },
        {
            id: 'spc_far_002',
            shopId: 'shop_farside_ventures',
            name: 'Lunar South Pole Claim',
            price: 180000000000,
            type: 'lunar_claim',
            brand: 'Farside Ventures',
            category: 'SPACE',
            specs: ['Water Ice', 'Permanent Light', 'Disputed', 'First Mover'],
            description: 'The craters that hold the ice. Whether anyone can own it is being argued in four capitals.',
        },
        {
            id: 'spc_far_003',
            shopId: 'shop_farside_ventures',
            name: 'Asteroid Mining Charter',
            price: 420000000000,
            type: 'asteroid_charter',
            brand: 'Farside Ventures',
            category: 'SPACE',
            specs: ['Metal Rich', 'Nine Year Transit', 'Sole Charter', 'Unvalued'],
            description: 'One rock, nine years out, and the only charter to touch it. Nobody can price what is on it.',
        },
        {
            id: 'spc_far_004',
            shopId: 'shop_farside_ventures',
            name: 'The Ark Programme',
            price: 980000000000,
            type: 'ark',
            brand: 'Farside Ventures',
            category: 'SPACE',
            specs: ['Thousand Berths', 'Closed Loop', 'Century Build', 'One Buyer'],
            description: 'A thousand berths and a closed ecology, built over a century. There has only ever been one buyer.',
        },
    ],
};
