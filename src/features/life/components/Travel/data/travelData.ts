import { ImageSourcePropType } from 'react-native';

export type VacationType = 'BEACH' | 'SNOW' | 'CULTURE' | 'NATURE' | 'CITY' | 'HISTORIC';
export type TravelClass = 'ECONOMY' | 'BUSINESS' | 'PRIVATE';

export interface Souvenir {
    id: string;
    name: string;
    emoji: string;
    description: string;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export interface VacationSpot {
    id: string;
    name: string;
    country: string;
    type: VacationType;
    baseCost: number;       // Solo Economy Cost
    emoji: string;          // Country Flag/Icon
    color: string;          // Theme Color
    transportIcon: string;  // ✈️, 🚢, 🚙, 🚄
    souvenir: Souvenir;     // The unique item found here
    narratives: {
        low: string[];  // Disasters (Economy only)
        mid: string[];  // Okay/Good
        high: string[]; // Legendary
    };
}

export const VACATION_SPOTS: VacationSpot[] = [
    {
        id: 'japan',
        name: 'Tokyo & Kyoto',
        country: 'Japan',
        type: 'CULTURE',
        baseCost: 37500,
        emoji: '🇯🇵',
        color: '#FFB7C5',
        transportIcon: '🚄',
        souvenir: { id: 'jp_katana', name: 'Samurai Katana', emoji: '⚔️', description: 'A sharp traditional blade.', rarity: 'LEGENDARY' },
        narratives: {
            low: ['Lost in Shinjuku station for 3 hours.', 'Vending machine ate your money.', 'Missed the last train.'],
            mid: ['Saw the cherry blossoms in full bloom.', 'Ate amazing ramen in a quiet alley.', 'Visited the Golden Pavilion.'],
            high: ['Private dinner with a Sumo wrestler.', 'Received a handmade sword from a master.', 'Meditated with monks in a mountain temple.']
        }
    },
    {
        id: 'france',
        name: 'Paris',
        country: 'France',
        type: 'CITY',
        baseCost: 45000,
        emoji: '🇫🇷',
        color: '#FFD700',
        transportIcon: '✈️',
        souvenir: { id: 'fr_wine', name: '1982 Vintage Wine', emoji: '🍷', description: 'A bottle of exquisite red wine.', rarity: 'RARE' },
        narratives: {
            low: ['Waiter scoffed at your pronunciation.', 'Stuck in traffic at the Arc de Triomphe.', 'Croissant was stale.'],
            mid: ['Romantic picnic under the Eiffel Tower.', 'The Louvre was less crowded than expected.', 'Found a perfect little bakery.'],
            high: ['Private after-hours tour of Versailles.', 'Chef cooked a custom meal for you.', 'Front row seats at Paris Fashion Week.']
        }
    },
    {
        id: 'italy',
        name: 'Venice & Rome',
        country: 'Italy',
        type: 'HISTORIC',
        baseCost: 42000,
        emoji: '🇮🇹',
        color: '#228B22',
        transportIcon: '🛵',
        souvenir: { id: 'it_mask', name: 'Venetian Mask', emoji: '🎭', description: 'A mysterious carnival mask.', rarity: 'COMMON' },
        narratives: {
            low: ['Pigeon attacked your gelato.', 'Gondola tipped over slightly.', 'Museum queue was 4 hours long.'],
            mid: ['Threw a coin in the Trevi Fountain.', 'Best pizza of your life in Naples.', 'Sunset boat ride in Venice.'],
            high: ['Private opera performance at La Scala.', 'Discovered a secret Roman villa.', 'Shared wine with a famous designer.']
        }
    },
    {
        id: 'egypt',
        name: 'Cairo',
        country: 'Egypt',
        type: 'HISTORIC',
        baseCost: 22500,
        emoji: '🇪🇬',
        color: '#EDC9AF',
        transportIcon: '🐪',
        souvenir: { id: 'eg_scarab', name: 'Golden Scarab', emoji: '🪲', description: 'An ancient symbol of rebirth.', rarity: 'RARE' },
        narratives: {
            low: ['Sand got absolutely everywhere.', 'Camel refused to stand up.', 'Sunburn was intense.'],
            mid: ['The Sphinx was majestic at sunset.', 'Cruised down the Nile river.', 'Bargained well at the bazaar.'],
            high: ['Allowed into a restricted tomb area.', 'Found a minor artifact in the sand.', 'Private access to the Great Pyramid.']
        }
    },
    {
        id: 'brazil',
        name: 'Rio de Janeiro',
        country: 'Brazil',
        type: 'BEACH',
        baseCost: 30000,
        emoji: '🇧🇷',
        color: '#009B3A',
        transportIcon: '✈️',
        souvenir: { id: 'br_ball', name: 'Signed Football', emoji: '⚽', description: 'Signed by a local legend.', rarity: 'COMMON' },
        narratives: {
            low: ['Lost your sandals on the beach.', 'Rained during the parade.', 'Mosquitoes were relentless.'],
            mid: ['Danced all night at the Carnival.', 'The view from Christ the Redeemer was holy.', 'Played beach volleyball with locals.'],
            high: ['VIP box at the Maracanã stadium.', 'Learned samba from a pro dancer.', 'Helicopter tour over the Amazon.']
        }
    },
    {
        id: 'usa',
        name: 'New York City',
        country: 'USA',
        type: 'CITY',
        baseCost: 37500,
        emoji: '🇺🇸',
        color: '#3C3B6E',
        transportIcon: '🚁',
        souvenir: { id: 'us_bat', name: 'Babe Ruth Bat', emoji: '⚾', description: 'A legendary baseball bat.', rarity: 'LEGENDARY' },
        narratives: {
            low: ['Subway was delayed for hours.', 'Hot dog gave you food poisoning.', 'Got shouted at by a local.'],
            mid: ['Saw a Broadway show.', 'Picnic in Central Park.', 'Walked across the Brooklyn Bridge.'],
            high: ['Private helicopter tour of Manhattan.', 'VIP seats at the Yankees game.', 'Exclusive party in a penthouse.']
        }
    },
    {
        id: 'uk',
        name: 'London',
        country: 'UK',
        type: 'CULTURE',
        baseCost: 39000,
        emoji: '🇬🇧',
        color: '#C8102E',
        transportIcon: '🚌',
        souvenir: { id: 'uk_tea', name: 'Royal Tea Set', emoji: '🫖', description: 'Fine china fit for a queen.', rarity: 'RARE' },
        narratives: {
            low: ['Rained the entire trip.', 'Tube was overcrowded.', 'Tea was lukewarm.'],
            mid: ['Watched the changing of the guard.', 'Visited the British Museum.', 'Had fish and chips at a pub.'],
            high: ['Private tea with a royal family member.', 'Exclusive tour of Buckingham Palace.', 'Front row at the Globe Theatre.']
        }
    },
    {
        id: 'turkey',
        name: 'Istanbul',
        country: 'Turkey',
        type: 'HISTORIC',
        baseCost: 27000,
        emoji: '🇹🇷',
        color: '#E30A17',
        transportIcon: '🚢',
        souvenir: { id: 'tr_carpet', name: 'Hereke Carpet', emoji: '🧶', description: 'A hand-woven masterpiece.', rarity: 'LEGENDARY' },
        narratives: {
            low: ['Got lost in the Grand Bazaar.', 'Traffic was a nightmare.', 'Burned your tongue on tea.'],
            mid: ['Cruised the Bosphorus strait.', 'Visited Hagia Sophia.', 'Ate delicious baklava.'],
            high: ['Private yacht party on the Bosphorus.', 'Bought a priceless antique rug.', 'Soaked in a historic VIP Hamam.']
        }
    },
    {
        id: 'tanzania',
        name: 'Serengeti',
        country: 'Tanzania',
        type: 'NATURE',
        baseCost: 52500,
        emoji: '🇹🇿',
        color: '#FCD116',
        transportIcon: '🚙',
        souvenir: { id: 'tz_necklace', name: 'Lion Tooth Necklace', emoji: '🦁', description: 'A symbol of bravery.', rarity: 'RARE' },
        narratives: {
            low: ['Jeep broke down in the savannah.', 'Missed the Great Migration.', 'Tsetse flies were biting.'],
            mid: ['Saw the Big Five up close.', 'Camped under the stars.', 'Visited a Maasai village.'],
            high: ['Private hot air balloon safari.', 'Adopted a wild lion cub (symbolically).', 'Stayed in a luxury isolation lodge.']
        }
    },
    {
        id: 'iceland',
        name: 'Reykjavik',
        country: 'Iceland',
        type: 'SNOW',
        baseCost: 45000,
        emoji: '🇮🇸',
        color: '#A5F2F3',
        transportIcon: '🚙',
        souvenir: { id: 'is_obsidian', name: 'Volcanic Obsidian', emoji: '⚫', description: 'Dark glass from the earth.', rarity: 'COMMON' },
        narratives: {
            low: ['Blizzard cancelled the tour.', 'Too cloudy for Northern Lights.', 'Slipped on ice.'],
            mid: ['Relaxed in the Blue Lagoon.', 'Saw geysers erupting.', 'Walked on a black sand beach.'],
            high: ['Private Northern Lights hunt.', 'Helicopter ride over a volcano.', 'Dived between tectonic plates.']
        }
    },
    {
        id: 'thailand',
        name: 'Bangkok & Phuket',
        country: 'Thailand',
        type: 'BEACH',
        baseCost: 24000,
        emoji: '🇹🇭',
        color: '#FFD100',
        transportIcon: '🚤',
        souvenir: { id: 'th_buddha', name: 'Golden Statue', emoji: '🙏', description: 'A peaceful golden figure.', rarity: 'COMMON' },
        narratives: {
            low: ['Too humid to breathe.', 'Got ripped off by a tuk-tuk.', 'Spicy food was too hot.'],
            mid: ['Visited the Grand Palace.', 'Island hopping by boat.', 'Enjoyed a Thai massage.'],
            high: ['Private island retreat.', 'Blessed by a senior monk.', 'Dinner at a rooftop sky bar.']
        }
    },
    {
        id: 'greece',
        name: 'Santorini',
        country: 'Greece',
        type: 'BEACH',
        baseCost: 40500,
        emoji: '🇬🇷',
        color: '#0D5EAF',
        transportIcon: '⛴️',
        souvenir: { id: 'gr_amphora', name: 'Ancient Amphora', emoji: '🏺', description: 'Replica of ancient pottery.', rarity: 'RARE' },
        narratives: {
            low: ['Ferry was delayed by wind.', 'Too many cruise ships.', 'Got sunburned on the hike.'],
            mid: ['Watched the sunset in Oia.', 'Swam in volcanic springs.', 'Ate fresh feta and olives.'],
            high: ['Private yacht around the caldera.', 'Bought a cliffside villa for a week.', 'Discovered a hidden sea cave.']
        }
    },
    {
        id: 'china',
        name: 'Beijing',
        country: 'China',
        type: 'HISTORIC',
        baseCost: 33000,
        emoji: '🇨🇳',
        color: '#DE2910',
        transportIcon: '🚂',
        souvenir: { id: 'cn_dragon', name: 'Jade Dragon', emoji: '🐉', description: 'Exquisite green jade carving.', rarity: 'LEGENDARY' },
        narratives: {
            low: ['Smog obscured the view.', 'Crowded on the Great Wall.', 'Lost in translation.'],
            mid: ['Walked the Great Wall.', 'Visited the Forbidden City.', 'Had authentic Peking Duck.'],
            high: ['Private tour of the Forbidden City.', 'Tea ceremony with a master.', 'Helicopter over the Wall.']
        }
    },
    {
        id: 'mexico',
        name: 'Cancun & Tulum',
        country: 'Mexico',
        type: 'CULTURE',
        baseCost: 27000,
        emoji: '🇲🇽',
        color: '#006847',
        transportIcon: '✈️',
        souvenir: { id: 'mx_calendar', name: 'Aztec Calendar', emoji: '☀️', description: 'Stone carving of time.', rarity: 'COMMON' },
        narratives: {
            low: ['Humidity was oppressive.', 'Hotel was noisy.', 'Lost sunglasses in a cenote.'],
            mid: ['Swam in a crystal clear cenote.', 'Visited Chichen Itza.', ' ate amazing tacos.'],
            high: ['Private tour of unopen ruins.', 'Shamanic cleansing ritual.', 'Luxury villa on the beach.']
        }
    },
    {
        id: 'russia',
        name: 'Moscow',
        country: 'Russia',
        type: 'CULTURE',
        baseCost: 36000,
        emoji: '🇷🇺',
        color: '#1C3578',
        transportIcon: '🚂',
        souvenir: { id: 'ru_egg', name: 'Fabergé Egg', emoji: '🥚', description: 'Jeweled egg of royalty.', rarity: 'LEGENDARY' },
        narratives: {
            low: ['It was incredibly cold.', 'Visas were a hassle.', 'Traffic in the city center.'],
            mid: ['Red Square was impressive.', 'Saw the beautiful metro stations.', 'Ballet at the Bolshoi.'],
            high: ['Private tour of the Kremlin.', 'Vodka tasting with an oligarch.', 'Ride on the Trans-Siberian luxury car.']
        }
    },
    {
        id: 'australia',
        name: 'Sydney',
        country: 'Australia',
        type: 'BEACH',
        baseCost: 43500,
        emoji: '🇦🇺',
        color: '#FFD100',
        transportIcon: '✈️',
        souvenir: { id: 'au_opal', name: 'Black Opal', emoji: '💎', description: 'Shimmering dark gemstone.', rarity: 'RARE' },
        narratives: {
            low: ['Jet lag was brutal.', 'Scary spider in the room.', 'Sun was too harsh.'],
            mid: ['Surfed at Bondi Beach.', 'Climbed the Harbour Bridge.', 'Saw kangaroos in the wild.'],
            high: ['Private yacht in the harbour.', 'VIP opera house tickets.', 'Diving the Great Barrier Reef.']
        }
    },
    {
        id: 'india',
        name: 'Jaipur',
        country: 'India',
        type: 'CULTURE',
        baseCost: 21000,
        emoji: '🇮🇳',
        color: '#FF9933',
        transportIcon: '🛺',
        souvenir: { id: 'in_shawl', name: 'Cashmere Shawl', emoji: '🧣', description: 'Softest wool in the world.', rarity: 'COMMON' },
        narratives: {
            low: ['Traffic chaos was overwhelming.', 'Stomach bug for two days.', 'Rickshaw broke down.'],
            mid: ['Visited the Pink City palaces.', 'Rode an elephant safely.', 'Ate delicious curry.'],
            high: ['Stayed in a royal palace.', 'Private audience with a Maharaja.', 'Owned the cricket box seats.']
        }
    },
    {
        id: 'spain',
        name: 'Barcelona',
        country: 'Spain',
        type: 'BEACH',
        baseCost: 31500,
        emoji: '🇪🇸',
        color: '#AA151B',
        transportIcon: '✈️',
        souvenir: { id: 'es_cape', name: 'Matador Cape', emoji: '💃', description: 'Red silk ceremonial cape.', rarity: 'RARE' },
        narratives: {
            low: ['Pickpockets on La Rambla.', 'Siesta closed everything.', 'Too noisy at night.'],
            mid: ['Admired Gaudi\'s architecture.', 'Tapas tour was fantastic.', 'Beach day was relaxing.'],
            high: ['Private tour of Sagrada Familia.', 'Flamenco show front row.', 'Yacht party on the coast.']
        }
    },
    {
        id: 'peru',
        name: 'Cusco',
        country: 'Peru',
        type: 'NATURE',
        baseCost: 28500,
        emoji: '🇵🇪',
        color: '#D91023',
        transportIcon: '🦙',
        souvenir: { id: 'pe_poncho', name: 'Alpaca Poncho', emoji: '🧥', description: 'Warm and colorful wool.', rarity: 'COMMON' },
        narratives: {
            low: ['Altitude sickness hit hard.', 'Llama spit on your shoe.', 'Rain on the trail.'],
            mid: ['The view of Machu Picchu was iconic.', 'Pet a baby alpaca.', 'Tried local cuisine.'],
            high: ['Luxury train to Machu Picchu.', 'Private shaman ceremony.', 'Found a lost Incan relic.']
        }
    },
    {
        id: 'maldives',
        name: 'Male Atoll',
        country: 'Maldives',
        type: 'BEACH',
        baseCost: 60000,
        emoji: '🇲🇻',
        color: '#00CED1',
        transportIcon: '🚤',
        souvenir: { id: 'mv_shell', name: 'Giant Conch Shell', emoji: '🐚', description: 'Echoes of the ocean.', rarity: 'RARE' },
        narratives: {
            low: ['Sunburn on day one.', 'Rainstorm trapped you inside.', 'WiFi was down.'],
            mid: ['Snorkeled with sea turtles.', 'Dinner on a sandbank.', 'Spa day over the water.'],
            high: ['Rented an entire private island.', 'Submarine tour of the reef.', 'Midnight swim with bioluminescence.']
        }
    }
];
