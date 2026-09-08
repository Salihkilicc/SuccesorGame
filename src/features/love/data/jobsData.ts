import { JobDefinition } from '../types';

export const JOBS_DATABASE: JobDefinition[] = [
    // ========================================================================
    // 0. GLOBAL ELITE (a quarter of a trillion to be in the room at all)
    // ========================================================================
    //
    //  HIGH_SOCIETY opened at five billion and was the ceiling, so a player
    //  worth five billion and a player worth two trillion were introduced to
    //  the same ten people for the rest of the dynasty. This is the room above
    //  it: not the heir to a house, the head of one.
    //
    //  The difference from HIGH_SOCIETY is meant to be legible on the card
    //  without a number. An Heiress is somebody's daughter. A reigning
    //  sovereign, a central bank governor and the owner of a sovereign wealth
    //  fund are not anybody's anything.
    //
    { id: 'sovereign_monarch', title: 'Reigning Sovereign', titleFor: { male: 'Reigning King', female: 'Reigning Queen' }, tier: 'GLOBAL_ELITE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 25 },
    { id: 'swf_owner', title: 'Sovereign Wealth Fund Chair', tier: 'GLOBAL_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 24 },
    { id: 'central_bank_governor', title: 'Central Bank Governor', tier: 'GLOBAL_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 22 },
    { id: 'oil_dynasty_head', title: 'Head of an Oil Dynasty', tier: 'GLOBAL_ELITE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 24 },
    { id: 'orbital_founder', title: 'Orbital Launch Company Founder', tier: 'GLOBAL_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 23 },
    { id: 'media_empire_owner', title: 'Owner of a Global Media Empire', tier: 'GLOBAL_ELITE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 23 },
    { id: 'shipping_dynasty', title: 'Shipping Dynasty Chair', tier: 'GLOBAL_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 21 },
    { id: 'nobel_laureate', title: 'Nobel Laureate in Physics', tier: 'GLOBAL_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 25 },
    { id: 'grand_prix_owner', title: 'Grand Prix Constructor Owner', tier: 'GLOBAL_ELITE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 21 },
    { id: 'private_island_state', title: 'Sovereign of a Private State', tier: 'GLOBAL_ELITE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 22 },

    // ========================================================================
    // 1. CORPORATE ELITE (High Finance, Tech Titans, Boardrooms, Global Power)
    // ========================================================================
    { id: 'tech_ceo', title: 'Silicon Valley Tech CEO', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 16 },
    { id: 'hedge_fund_md', title: 'Hedge Fund Managing Director', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 18 },
    { id: 'vc_partner', title: 'Venture Capital General Partner', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 15 },
    { id: 'pe_principal', title: 'Private Equity Principal', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 16 },
    { id: 'ma_lawyer', title: 'Elite M&A Partner (Wall Street)', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 15 },
    { id: 'semiconductor_vp', title: 'Semiconductor Foundry VP', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 14 },
    { id: 'ai_director', title: 'AI Research Institute Director', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 16 },
    { id: 'aerospace_exec', title: 'Aerospace & Defense Executive', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 15 },
    { id: 'family_office_cio', title: 'Chief Investment Officer (Family Office)', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 17 },
    { id: 'biotech_founder', title: 'Biotech Syndicate Founder', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 15 },
    { id: 'central_bank_advisor', title: 'Central Bank Monetary Advisor', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 14 },
    { id: 'commodities_trader', title: 'Global Energy & Oil Trader', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 13 },
    { id: 'surgeon', title: 'Elite Neurosurgeon', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 14 },

    // ========================================================================
    // 2. HIGH SOCIETY (Dynasties, Old Money, Royalty, Ultra-Luxury & Diplomacy)
    // ========================================================================
    // Two of the thirty-seven titles have a gender in the word itself, and a
    // man kept being introduced as an Heiress. `title` is unchanged, so every
    // reader that does not know the gender sees exactly what it saw before.
    { id: 'dynasty_heiress', title: 'Old-Money Dynasty Heiress', titleFor: { male: 'Old-Money Dynasty Heir' }, tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 20 },
    { id: 'billionaire_heir', title: 'Billionaire Industrial Heir', titleFor: { female: 'Billionaire Industrial Heiress' }, tier: 'HIGH_SOCIETY', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 18 },
    { id: 'royal_envoy', title: 'Royal Philanthropy Ambassador', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 19 },
    { id: 'couture_director', title: 'Haute Couture Creative Director', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 15 },
    { id: 'sothebys_auctioneer', title: "Sotheby's Fine Art Auctioneer", tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 14 },
    { id: 'superyacht_owner', title: 'Superyacht Charter Fleet Owner', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 16 },
    { id: 'f1_principal', title: 'Formula 1 Team Principal', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 17 },
    { id: 'diplomat_ambassador', title: 'UN Ambassador & Envoy', tier: 'HIGH_SOCIETY', buffType: 'INTELLECT_GAIN', buffValue: 14 },
    { id: 'diamond_syndicate', title: 'Diamond Syndicate Director', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 18 },
    { id: 'michelin_restaurateur', title: '3-Star Michelin Empire Owner', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 14 },
    { id: 'supermodel', title: 'Vogue Global Supermodel', tier: 'HIGH_SOCIETY', buffType: 'CHARM_BOOST', buffValue: 15 },

    // ========================================================================
    // 3. ARTISTIC (Culture, Celebrity, Cinema & Vision)
    // ========================================================================
    { id: 'actress', title: 'A-List Movie Star', tier: 'ARTISTIC', buffType: 'CHARM_BOOST', buffValue: 15 },
    { id: 'musician', title: 'Grammy-Winning Producer', tier: 'ARTISTIC', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 12 },
    { id: 'contemporary_artist', title: 'Blue-Chip Contemporary Artist', tier: 'ARTISTIC', buffType: 'STRESS_RELIEF', buffValue: 10 },
    { id: 'architect', title: 'Pritzker-Winning Architect', tier: 'ARTISTIC', buffType: 'INTELLECT_GAIN', buffValue: 12 },

    // ========================================================================
    // 4. UNDERGROUND (Security, Private Intelligence, Casino Whales)
    // ========================================================================
    { id: 'private_intel_chief', title: 'Private Intelligence Contractor', tier: 'UNDERGROUND', buffType: 'INTELLECT_GAIN', buffValue: 14 },
    { id: 'hacker', title: 'Elite Cyber Security Architect', tier: 'UNDERGROUND', buffType: 'INTELLECT_GAIN', buffValue: 13 },
    { id: 'casino_whale', title: 'High-Stakes VIP Syndicate Whale', tier: 'UNDERGROUND', buffType: 'CASINO_VIP_BOOST', buffValue: 15 },
    { id: 'crypto_arbitrageur', title: 'Offshore Crypto Arbitrageur', tier: 'UNDERGROUND', buffType: 'LUCK_BOOST', buffValue: 8 },

    // ========================================================================
    // 5. BLUE COLLAR & DEDICATED PROFESSIONALS
    // ========================================================================
    { id: 'private_aviator', title: 'Private Jet Captain', tier: 'BLUE_COLLAR', buffType: 'STRESS_RELIEF', buffValue: 10 },
    { id: 'personal_trainer', title: 'Elite Celebrity Trainer', tier: 'BLUE_COLLAR', buffType: 'STRENGTH_BOOST', buffValue: 12 },
    { id: 'sommelier', title: 'Master Sommelier', tier: 'BLUE_COLLAR', buffType: 'STRESS_RELIEF', buffValue: 10 },

    // ========================================================================
    // 6. STUDENT & PROMISING PRODIGIES
    // ========================================================================
    { id: 'ivy_mba_student', title: 'Stanford MBA Candidate', tier: 'STUDENT_LIFE', buffType: 'INTELLECT_GAIN', buffValue: 10 },
    { id: 'quant_phd', title: 'MIT Quantum Physics Fellow', tier: 'STUDENT_LIFE', buffType: 'INTELLECT_GAIN', buffValue: 12 },
];
