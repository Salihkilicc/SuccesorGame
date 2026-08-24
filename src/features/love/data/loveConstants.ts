// Static data constants for the Love/Contacts feature

export const GIFTS = [
    { name: 'Flowers', price: 50, loveParams: 2 },
    { name: 'Chocolates', price: 100, loveParams: 3 },
    { name: 'Jewelry', price: 5000, loveParams: 15 },
    { name: 'Sports Car', price: 150000, loveParams: 40 },
];

export const TEXT_MESSAGES = [
    "I miss you", "Nightclub tonight?", "You up?", "Thinking of you",
    "Hey...", "Remember us?", "Happy Birthday (Late)", "wyd"
];

// ============================================================================
//  WHERE YOU ASK
// ============================================================================
//
//  Each venue carries its own icon rather than the view holding a lookup table
//  keyed by id. A table in the component is a second list to keep in step with
//  this one, and the day somebody adds a thirteenth venue is the day the two
//  stop agreeing. Names are MaterialCommunityIcons, which is the set the rest
//  of the app draws from.
//
//  The order is the price order and that is load bearing: the list is read top
//  to bottom and the whole point of showing them together is that the yacht at
//  fifteen thousand and the billboard at a hundred thousand can be compared.
// ============================================================================
export const PROPOSAL_LOCATIONS = [
    { id: 'public_park', name: 'Public Park', cost: 0, bonus: 0, icon: 'tree-outline' },
    { id: 'coffee_shop', name: 'Local Coffee Shop', cost: 50, bonus: 1, icon: 'coffee-outline' },
    { id: 'beach_sunset', name: 'Sunset Beach', cost: 200, bonus: 3, icon: 'beach' },
    { id: 'fancy_dinner', name: 'Luxury Restaurant', cost: 1000, bonus: 5, icon: 'silverware-fork-knife' },
    { id: 'hot_air_balloon', name: 'Hot Air Balloon', cost: 2500, bonus: 8, icon: 'airballoon-outline' },
    { id: 'disney_castle', name: 'Fairytale Castle', cost: 5000, bonus: 10, icon: 'castle' },
    { id: 'private_yacht', name: 'Private Yacht', cost: 15000, bonus: 15, icon: 'sail-boat' },
    { id: 'paris_eiffel', name: 'Eiffel Tower Top', cost: 25000, bonus: 20, icon: 'tower-fire' },
    { id: 'maldives_villa', name: 'Maldives Overwater Villa', cost: 50000, bonus: 25, icon: 'home-city-outline' },
    { id: 'times_square', name: 'Times Square Billboard', cost: 100000, bonus: 30, icon: 'billboard' },
    { id: 'private_island', name: 'Rented Private Island', cost: 500000, bonus: 40, icon: 'island' },
    { id: 'space_station', name: 'Orbit (Space Station)', cost: 5000000, bonus: 100, icon: 'rocket-launch-outline' }
];
