export type EncounterScenario = {
    id: string;
    text: string;
    flirt: string;
};

export const ENCOUNTER_DATA: Record<string, EncounterScenario[]> = {
    VIP_LOUNGE: [
        {
            id: 'vip_davos',
            text: 'In the private delegates lounge at the World Economic Forum in Davos, a brilliant managing director challenges your market thesis over an espresso by the snowbound fireplace.',
            flirt: 'Smile and propose settling the debate over an intimate dinner in Klosters.',
        },
        {
            id: 'vip_ma_war_room',
            text: 'Following grueling 14-hour boardroom acquisition negotiations, the lead M&A partner for the opposing syndicate lingers in the executive hallway with a knowing smirk.',
            flirt: 'Admit that their ruthless cross-examination was captivating, and invite them for a midnight drink.',
        },
        {
            id: 'vip_silicon_summit',
            text: 'At an invite-only Silicon Valley founders dinner in Woodside, a venture capital general partner across the table discreetly slides a sleek black card toward your glass.',
            flirt: 'Whisper that your personal portfolio is open for private due diligence.',
        },
        {
            id: 'vip_private_hangar',
            text: 'During a tarmac delay at Teterboro private airport, a striking aerospace executive invites you to wait out the storm inside their Gulfstream G700 cabin.',
            flirt: 'Accept with a smile and toast to spontaneous first-class detours and instant chemistry.',
        },
        {
            id: 'vip_monaco_yacht',
            text: 'Overlooking Monaco harbor from a 90-meter superyacht during Grand Prix qualifying, an old-money dynasty heiress raises her crystal flute to Hale’s surging valuation.',
            flirt: 'Step beside her to the railing and toast to building sovereign empires together.',
        },
        {
            id: 'vip_art_auction',
            text: 'At an eight-figure Sotheby’s contemporary art auction in Mayfair, you both exchange subtle paddle raises for the same museum-grade masterpiece.',
            flirt: 'Concede the winning bid in exchange for an exclusive private celebration dinner.',
        },
        {
            id: 'vip_wallst_cigar',
            text: 'Inside an elite private members club overlooking Wall Street, a hedge fund partner observes your market moves while savoring a rare single-malt scotch.',
            flirt: 'Pull up a leather chair and propose an alliance of capital, influence, and chemistry.',
        },
        {
            id: 'vip_geneva_vault',
            text: 'Exiting a Swiss private wealth symposium on the shores of Lake Geneva, an aristocratic family office director strikes up a conversation about multi-generational dynasties.',
            flirt: 'Remark that the most enduring dynasties are always ignited by an undeniable spark.',
        },
        {
            id: 'vip_f1_paddock',
            text: 'Inside the roaring VIP paddock club at Silverstone, a glamorous Formula 1 executive playfully bets that your next quarter will outpace their pole lap time.',
            flirt: 'Take the wager with a confident grin and seal it over vintage champagne.',
        },
        {
            id: 'vip_stbarts',
            text: 'Anchored off St. Barts on New Year’s Eve, a tech founder and venture heiress pulls their speedboat up to your superyacht with a bottle of rare vintage Krug.',
            flirt: 'Extend a hand to welcome them aboard for midnight fireworks under the stars.',
        },
        {
            id: 'vip_taipei_foundry',
            text: 'At an ultra-exclusive semiconductor symposium in Taipei, a leading chip foundry executive praises your aggressive silicon roadmap over dinner.',
            flirt: 'Invite them to discuss secret architectural synergies over a private view of the city.',
        },
        {
            id: 'vip_paris_fashion',
            text: 'Front row at Paris Haute Couture Fashion Week, a luxury fashion house creative director leans over to whisper their admiration for your commanding executive presence.',
            flirt: 'Offer to escort them to the private afterparty in Saint-Germain.',
        },
        {
            id: 'vip_aspen_chalet',
            text: 'Fireside at a private Aspen mountain retreat after a day on exclusive powder slopes, a biotech pioneer discusses market dominance and desire.',
            flirt: 'Pour another glass of grand cru and lean in close to challenge their focus.',
        },
        {
            id: 'vip_gala_charity',
            text: 'At the Metropolitan Museum Gala, a royal philanthropy ambassador compliments your leadership influence while classical strings play under the arches.',
            flirt: 'Offer a witty toast to high-stakes philanthropy and irresistible connections.',
        },
    ],
    gym: [
        {
            id: 'gym_1',
            text: 'You spot someone pushing their limits on the treadmill next to you. They catch you looking and smile through the sweat.',
            flirt: 'Ask about their routine.',
        },
        {
            id: 'gym_2',
            text: 'Near the weights, a fit person struggles slightly with a heavy bar. They need a spotter.',
            flirt: 'Offer a helping hand.',
        },
        {
            id: 'gym_3',
            text: 'In the yoga studio, you accidentally bump mats with a graceful stranger.',
            flirt: 'Apologize and compliment their form.',
        },
        {
            id: 'gym_4',
            text: 'You are refilling your water bottle when someone comments on your workout intensity.',
            flirt: 'Share a hydration tip and introduce yourself.',
        },
        {
            id: 'gym_5',
            text: 'Leaving the locker room, you notice someone looking exhausted but satisfied with their session.',
            flirt: 'Suggest a post-workout protein shake together.',
        },
    ],
    club: [
        {
            id: 'club_1',
            text: 'The bass is thumping. In the VIP section, someone alone with a bottle of champagne catches your eye.',
            flirt: 'Ask to join their celebration.',
        },
        {
            id: 'club_2',
            text: 'On the dance floor, the crowd parts and you find yourself face-to-face with a stunning dancer.',
            flirt: 'Dance closer and match their rhythm.',
        },
        {
            id: 'club_3',
            text: 'Waiting at the bar, someone orders a ridiculously expensive cocktail and looks bored.',
            flirt: 'Comment on their drink choice.',
        },
        {
            id: 'club_4',
            text: 'You are taking a breather on the balcony when someone steps out for fresh air next to you.',
            flirt: 'Comment on the view or the noise inside.',
        },
        {
            id: 'club_5',
            text: 'A photographer snaps a picture of the crowd, and you end up framed perfectly with a stranger.',
            flirt: 'Joke about being the new power couple.',
        },
    ],
    travel_japan: [
        {
            id: 'jp_1',
            text: 'Under the blooming cherry blossoms in Ueno Park, a local is taking photos of the petals.',
            flirt: 'Ask them to take a photo of you, then compliment their eye.',
        },
        {
            id: 'jp_2',
            text: 'In a bustling Akihabara electronics store, you both reach for the same retro game console.',
            flirt: 'Challenge them to a game to decide who buys it.',
        },
        {
            id: 'jp_3',
            text: 'At a quiet tea house in Kyoto, someone explains the ceremony details to a friend nearby.',
            flirt: 'Admit your ignorance and ask for a quick lesson.',
        },
        {
            id: 'jp_4',
            text: 'Navigating the Shibuya crossing, you briefly lock eyes with a stylish stranger in the chaos.',
            flirt: 'Catch up to them on the other side.',
        },
        {
            id: 'jp_5',
            text: 'Soaking in an onsen town footbath, a relaxed traveler strikes up a conversation about the heat.',
            flirt: 'Suggest cooling off with some matcha ice cream.',
        },
    ],
    travel_france: [
        {
            id: 'fr_1',
            text: 'Browsing a boutique in Le Marais, someone asks your opinion on a silk scarf.',
            flirt: 'Give a charming, honest opinion.',
        },
        {
            id: 'fr_2',
            text: 'Sitting by the Seine at sunset, an artist is sketching the river nearby.',
            flirt: 'Ask if you are in the sketch.',
        },
        {
            id: 'fr_3',
            text: 'In a vineyard in Bordeaux, a connoisseur is tasting a vintage red with intense focus.',
            flirt: 'Ask for a tasting tip.',
        },
        {
            id: 'fr_4',
            text: 'Waiting in line at the Louvre, you share a laugh with a tired art lover.',
            flirt: 'Propose a quick escape to a nearby café.',
        },
        {
            id: 'fr_5',
            text: 'Walking through a lavender field in Provence, you meet someone lost in the scent.',
            flirt: 'Offer to take a photo of them among the flowers.',
        },
    ],
    travel_usa: [
        {
            id: 'us_1',
            text: 'At a rooftop party in Hollywood, an aspiring actor is practicing their lines in a corner.',
            flirt: 'Offer to run lines with them.',
        },
        {
            id: 'us_2',
            text: 'In a coffee shop in Palo Alto, a founder is furiously coding but spills their coffee.',
            flirt: 'Offer napkins and ask about their startup.',
        },
        {
            id: 'us_3',
            text: 'On South Beach, Miami, a sunbather asks you to watch their things while they swim.',
            flirt: 'Agree, but ask for a drink as payment.',
        },
        {
            id: 'us_4',
            text: 'Cycling across the Golden Gate Bridge, you stop at the same viewpoint as a local.',
            flirt: 'Ask for the best dinner spot in the city.',
        },
        {
            id: 'us_5',
            text: 'At a jazz club in New Orleans, someone invites you to dance to the brass band.',
            flirt: 'Accept enthusiastically.',
        },
    ],
    travel_dubai: [
        {
            id: 'ae_1',
            text: 'In the lobby of the Burj Al Arab, a luxury car enthusiast is admiring a gold-plated supercar.',
            flirt: 'Debate the merits of the engine vs. the gold.',
        },
        {
            id: 'ae_2',
            text: 'During a desert safari at sunset, you share a camel ride with a thrill-seeker.',
            flirt: 'Joke about being desert royalty.',
        },
        {
            id: 'ae_3',
            text: 'Shopping at the Dubai Mall, someone is struggling with too many designer bags.',
            flirt: 'Offer to carry the heaviest one.',
        },
        {
            id: 'ae_4',
            text: 'At a high-end auction, a collector outbids you for a rare item.',
            flirt: 'Congratulate them and ask to see the collection.',
        },
        {
            id: 'ae_5',
            text: 'Dining underwater at Atlantis, you catch the eye of someone mesmerized by the fish.',
            flirt: 'Make a pun about plenty of fish in the sea.',
        },
    ],
    generic: [
        {
            id: 'gen_1',
            text: 'At a rooftop executive lounge, someone notices your wristwatch and strikes up a conversation about rare complications.',
            flirt: 'Share the history of the piece and offer to buy the next round of cocktails.',
        },
        {
            id: 'gen_2',
            text: 'Browsing a private financial publication at an airport lounge, you both comment on the latest market volatility.',
            flirt: 'Propose predicting the market together over coffee.',
        },
        {
            id: 'gen_3',
            text: 'At an exclusive tech conference cocktail hour, you exchange sharp perspectives on next-generation computing.',
            flirt: 'Suggest continuing the debate in a quieter setting.',
        },
        {
            id: 'gen_4',
            text: 'Stuck in an executive suite elevator for a few minutes, you share an amused laugh about high-rise corporate drama.',
            flirt: 'Joke that power outages always create the most unexpected connections.',
        },
    ],
};
