import { CategoryData } from '../shopTypes';

// ============================================================================
// REAL ESTATE - The Billionaire's Portfolio
// ============================================================================

export const realEstateData: CategoryData = {
    shops: [
        {
            id: 'shop_eden_islands',
            name: 'Eden Islands',
            url: 'www.edenislands.luxury',
            category: 'REAL_ESTATE',
            description: 'Buy the horizon.',
            bannerColor: '#16A085',
            emoji: '🏝️',
        },
        {
            id: 'shop_skyline_architects',
            name: 'Skyline Architects',
            url: 'www.skylinearch.com',
            category: 'REAL_ESTATE',
            description: 'Own the skyline.',
            bannerColor: '#34495E',
            emoji: '🏢',
        },
        {
            id: 'shop_dynasty8_elite',
            name: 'Dynasty 8 Elite',
            url: 'www.dynasty8elite.com',
            category: 'REAL_ESTATE',
            description: 'Residences of distinction.',
            bannerColor: '#2C3E50',
            emoji: '🏠',
        },
        {
            id: 'shop_vault_properties',
            name: 'Vault Properties',
            url: 'www.vaultprop.secure',
            category: 'REAL_ESTATE',
            description: 'Fortified luxury.',
            bannerColor: '#7F8C8D',
            emoji: '🔒',
        },
        {
            id: 'shop_heritage_estates',
            name: 'Heritage Estates',
            url: 'www.heritage-estates.eu',
            category: 'REAL_ESTATE',
            description: 'History is yours.',
            bannerColor: '#8E44AD',
            emoji: '🏰',
        },
        {
            id: 'shop_urban_corp',
            name: 'Urban Corp',
            url: 'www.urbancorp.global',
            category: 'REAL_ESTATE',
            description: 'Commercial dominance.',
            bannerColor: '#2980B9',
            emoji: '🏙️',
        },
    ],

    items: [
        // ========================================================================
        // EDEN ISLANDS - Private Islands
        // ========================================================================
        {
            id: 're_eden_001',
            shopId: 'shop_eden_islands',
            name: 'The World Island (Dubai)',
            price: 1200000000,
            type: 'private_island_complex',
            brand: 'Eden Islands',
            category: 'REAL_ESTATE',
            specs: ['Man-Made', 'Dubai Coast', 'Helipad Network', 'Royal Status'],
            description: 'Your own continent off the coast of Dubai. The ultimate statement of power.',
        },
        {
            id: 're_eden_002',
            shopId: 'shop_eden_islands',
            name: 'Pacific Atoll Kingdom',
            price: 850000000,
            type: 'sovereign_island',
            brand: 'Eden Islands',
            category: 'REAL_ESTATE',
            specs: ['Unknown Sovereignty', 'Naval Dock', 'AirStrip', 'Self-Sustaining'],
            description: 'A completely autonomous atoll in the deep Pacific. Rules do not apply here.',
        },
        {
            id: 're_eden_003',
            shopId: 'shop_eden_islands',
            name: 'Caribbean Expanse',
            price: 550000000,
            type: 'private_island',
            brand: 'Eden Islands',
            category: 'REAL_ESTATE',
            specs: ['300 Acres', 'Superyacht Marina', '7 Villas', 'White Sand'],
            description: 'The jewel of the Caribbean. Includes a private marina for your fleet.',
        },
        {
            id: 're_eden_004',
            shopId: 'shop_eden_islands',
            name: 'Greek Cyclades Empire',
            price: 420000000,
            type: 'island_group',
            brand: 'Eden Islands',
            category: 'REAL_ESTATE',
            specs: ['3 Islands', 'Ancient Ruins', 'Olive Groves', 'Mediterranean'],
            description: 'A cluster of three islands steeped in history and bathed in luxury.',
        },

        // ========================================================================
        // SKYLINE ARCHITECTS - Skyscrapers
        // ========================================================================
        {
            id: 're_sky_001',
            shopId: 'shop_skyline_architects',
            name: 'Burj Khalifa Owner Floor',
            price: 6500000000,
            type: 'skyscraper_floor',
            brand: 'Skyline Architects',
            category: 'REAL_ESTATE',
            specs: ['World\'s Highest', 'Entire Top Section', 'Cloud View', 'Dubai'],
            description: 'Ownership of the pinnacle of the world. Look down on everything.',
        },
        {
            id: 're_sky_002',
            shopId: 'shop_skyline_architects',
            name: 'Tokyo Spire',
            price: 3200000000,
            type: 'skyscraper',
            brand: 'Skyline Architects',
            category: 'REAL_ESTATE',
            specs: ['Shinjuku', 'Seismic Proof', 'Neo-Futurist', '100 Floors'],
            description: 'A neon-lit monolith dominating the Tokyo night. The future of vertical living.',
        },
        {
            id: 're_sky_003',
            shopId: 'shop_skyline_architects',
            name: 'NYC Billionaire Tower',
            price: 2500000000,
            type: 'residential_tower',
            brand: 'Skyline Architects',
            category: 'REAL_ESTATE',
            specs: ['Billionaire\'s Row', 'Central Park View', 'Private Concierge', 'Penthouse'],
            description: 'The toothpick tower that defines the Manhattan skyline. Unrivaled prestige.',
        },
        {
            id: 're_sky_004',
            shopId: 'shop_skyline_architects',
            name: 'Singapore Garden Tower',
            price: 1800000000,
            type: 'green_skyscraper',
            brand: 'Skyline Architects',
            category: 'REAL_ESTATE',
            specs: ['Vertical Forest', 'Infinity Pool', 'Marina Bay', 'Eco-Luxury'],
            description: 'A living breathing ecosystem in the sky. Nature meets architecture.',
        },

        // ========================================================================
        // DYNASTY 8 ELITE - Residences
        // ========================================================================
        {
            id: 're_d8e_001',
            shopId: 'shop_dynasty8_elite',
            name: 'London Historic Palace',
            price: 450000000,
            type: 'palace',
            brand: 'Dynasty 8 Elite',
            category: 'REAL_ESTATE',
            specs: ['Kensington', 'Royal Neighbors', 'Ballroom', 'Gardens'],
            description: 'A residence fit for modern royalty in the heart of London.',
        },
        {
            id: 're_d8e_002',
            shopId: 'shop_dynasty8_elite',
            name: 'Beverly Hills Mega-Mansion',
            price: 120000000,
            type: 'mansion',
            brand: 'Dynasty 8 Elite',
            category: 'REAL_ESTATE',
            specs: ['90210', 'IMAX Theater', 'Bowling Alley', 'Car Gallery'],
            description: 'The ultimate Hollywood estate. Space for your entire ego.',
        },
        {
            id: 're_d8e_003',
            shopId: 'shop_dynasty8_elite',
            name: 'Monaco Penthouse',
            price: 85000000,
            type: 'penthouse',
            brand: 'Dynasty 8 Elite',
            category: 'REAL_ESTATE',
            specs: ['Monte Carlo', 'F1 Track View', 'Private Casino', 'Rooftop Pool'],
            description: 'Watch the Grand Prix from your jacuzzi. The epitome of Monaco life.',
        },

        // ========================================================================
        // VAULT PROPERTIES - Bunkers (Maintained Highest End)
        // ========================================================================
        {
            id: 're_vault_001',
            shopId: 'shop_vault_properties',
            name: 'Alpine Doomsday Fortress',
            price: 450000000,
            type: 'bunker_complex',
            brand: 'Vault Properties',
            category: 'REAL_ESTATE',
            specs: ['Swiss Alps', 'Nuclear Proof', '50 Year Supplies', 'Luxury Suites'],
            description: 'Survive the end of the world in five-star comfort.',
        },
        {
            id: 're_vault_002',
            shopId: 'shop_vault_properties',
            name: 'Dakota Missile Silo',
            price: 85000000,
            type: 'converted_silo',
            brand: 'Vault Properties',
            category: 'REAL_ESTATE',
            specs: ['15 Floors Deep', 'Data Center', 'Hydroponics', 'Armory'],
            description: 'Deep earth protection. Totally self-sufficient for decades.',
        },

        // ========================================================================
        // HERITAGE ESTATES - Castles (Maintained Highest End)
        // ========================================================================
        {
            id: 're_her_001',
            shopId: 'shop_heritage_estates',
            name: 'Château de Versailles Annex',
            price: 350000000,
            type: 'castle',
            brand: 'Heritage Estates',
            category: 'REAL_ESTATE',
            specs: ['France', 'Historic', 'Orangery', 'Private Park'],
            description: 'A private wing of history adjacent to the main palace.',
        },
        {
            id: 're_her_002',
            shopId: 'shop_heritage_estates',
            name: 'Tuscan Medici Villa',
            price: 150000000,
            type: 'villa',
            brand: 'Heritage Estates',
            category: 'REAL_ESTATE',
            specs: ['Italy', 'Vineyard', 'Renaissance Art', 'Chapel'],
            description: 'Live like the Medici family. Includes a priceless art collection.',
        },

        // ========================================================================
        // URBAN CORP - Commercial (Maintained Highest End)
        // ========================================================================
        {
            id: 're_urb_001',
            shopId: 'shop_urban_corp',
            name: 'Silicon Valley Campus HQ',
            price: 2800000000,
            type: 'tech_campus',
            brand: 'Urban Corp',
            category: 'REAL_ESTATE',
            specs: ['300 Acres', 'R&D Labs', 'Auditorium', 'Carbon Neutral'],
            description: 'The birthplace of the next trillion-dollar idea.',
        },
        {
            id: 're_urb_002',
            shopId: 'shop_urban_corp',
            name: 'Shanghai Financial Hub',
            price: 1900000000,
            type: 'office_tower',
            brand: 'Urban Corp',
            category: 'REAL_ESTATE',
            specs: ['The Bund', 'Trading Floors', 'Helipad', 'Bank Vault'],
            description: 'Command the flow of capital in the East.',
        },
    ],
};
