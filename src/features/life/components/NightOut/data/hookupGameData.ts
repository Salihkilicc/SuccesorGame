// ============================================
// HOOKUP MINI-GAME DATA ARCHITECTURE
// ============================================

export type HookupStrategy = 'CHARISMA' | 'MONEY' | 'FAME';

export interface HookupScenario {
    id: string;
    clue: string;
    correctStrategy: HookupStrategy;
    options: {
        charisma: string;
        money: string;
        fame: string;
    };
}

// ============================================
// CATEGORY A: CHARISMA (The Vibe) - 20 Scenarios
// ============================================

const CHARISMA_SCENARIOS: HookupScenario[] = [
    {
        id: 'char_001',
        clue: "She's rolling her eyes at the guys trying to buy her drinks.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "You look like you need saving from boring conversations.",
            money: "Let me buy you something better than what they're offering.",
            fame: "I usually don't do this, but you caught my attention."
        }
    },
    {
        id: 'char_002',
        clue: "She's dancing comfortably by herself, ignoring the VIP table.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "I bet I can dance worse than you.",
            money: "Want to move this party to the VIP section?",
            fame: "My photographer would love to capture this energy."
        }
    },
    {
        id: 'char_003',
        clue: "She's laughing loudly with her friends, completely carefree.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Whatever joke that was, I need to hear it too.",
            money: "Your group looks fun. Bottle service on me?",
            fame: "You have the best energy in this place. I'm doing a feature on nightlife."
        }
    },
    {
        id: 'char_004',
        clue: "She keeps making eye contact while biting her lip.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Are you going to keep staring or are we going to talk?",
            money: "I know a private lounge upstairs if you want to escape.",
            fame: "I get that look a lot. Want an autograph or a conversation?"
        }
    },
    {
        id: 'char_005',
        clue: "She's reading a book at the bar, completely unbothered by the chaos.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Bold choice. What's worth reading in a place like this?",
            money: "I have a library at my penthouse if you prefer quiet.",
            fame: "I'm actually writing a book. Maybe you'd like a signed copy?"
        }
    },
    {
        id: 'char_006',
        clue: "She's arguing with the bouncer about the music being too mainstream.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Finally, someone with taste. What should they be playing?",
            money: "I know the owner. I can get them to change it.",
            fame: "I DJ sometimes. Want me to take over the booth?"
        }
    },
    {
        id: 'char_007',
        clue: "She's wearing band merch and looks bored by the EDM.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "That shirt tells me you're in the wrong club. Me too.",
            money: "I have backstage passes to their next show if you're interested.",
            fame: "I interviewed them last month. Want the inside scoop?"
        }
    },
    {
        id: 'char_008',
        clue: "She just rejected three guys in a row with the same smirk.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "I'm going for rejection number four. What's your best line?",
            money: "What if I offered something they didn't?",
            fame: "I'm used to rejection. Comes with being in the spotlight."
        }
    },
    {
        id: 'char_009',
        clue: "She's doing shots alone and challenging strangers to pool.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "I'll play, but only if the loser buys breakfast.",
            money: "How about we make this interesting? $500 a game?",
            fame: "I'm actually sponsored by a pool company. Want a lesson?"
        }
    },
    {
        id: 'char_010',
        clue: "She's sketching people on a napkin while sipping her drink.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Am I interesting enough to draw, or too boring?",
            money: "I collect art. How much for an original?",
            fame: "I've been painted before. Think you can capture my good side?"
        }
    },
    {
        id: 'char_011',
        clue: "She's wearing sneakers to a formal club and doesn't care.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Comfort over style. I respect that rebellion.",
            money: "I can get you into the VIP where dress code doesn't matter.",
            fame: "I started a trend wearing sneakers to the Met Gala."
        }
    },
    {
        id: 'char_012',
        clue: "She's teaching her friend how to properly make a cocktail at the bar.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Bartender or just passionate? Either way, I'm impressed.",
            money: "I own a bar. You should come work for me.",
            fame: "I'm filming a cocktail series. Want to be featured?"
        }
    },
    {
        id: 'char_013',
        clue: "She's the only one actually listening to the live band.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Good music deserves attention. What's your favorite song?",
            money: "I'm friends with the band. Want to meet them after?",
            fame: "I used to play in a band. Those were the days."
        }
    },
    {
        id: 'char_014',
        clue: "She just won a dance battle and is catching her breath, grinning.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "That was incredible. Teach me your moves?",
            money: "Victory deserves champagne. What's your poison?",
            fame: "That needs to go viral. Can I film the next one?"
        }
    },
    {
        id: 'char_015',
        clue: "She's debating philosophy with a stranger, completely engaged.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Mind if I join? I have thoughts on that.",
            money: "Intellectual conversation is rare. Let me buy you both a drink.",
            fame: "I did a TED talk on this exact topic."
        }
    },
    {
        id: 'char_016',
        clue: "She's helping a drunk girl find her friends, completely selfless.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "That was kind. The world needs more people like you.",
            money: "Let me get you both a cab. On me.",
            fame: "That's the kind of content my followers love. You're a good person."
        }
    },
    {
        id: 'char_017',
        clue: "She's laughing at her own jokes while her friends groan.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "I love bad jokes. Hit me with your worst.",
            money: "Comedy shows are better in VIP. Want to upgrade?",
            fame: "I know some comedians. You'd fit right in."
        }
    },
    {
        id: 'char_018',
        clue: "She's the designated driver, sipping water and people-watching.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Sober perspective is underrated. What's the weirdest thing you've seen tonight?",
            money: "Hire a driver next time. You deserve to have fun too.",
            fame: "I'm doing a documentary on nightlife. Your perspective would be gold."
        }
    },
    {
        id: 'char_019',
        clue: "She's wearing a vintage band tee and arguing about music history.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Finally, someone who knows real music. What's your take on—",
            money: "I have original vinyl from that era. Want to hear it?",
            fame: "I interviewed the lead singer. Want the story?"
        }
    },
    {
        id: 'char_020',
        clue: "She's confidently singing along to every song, off-key but happy.",
        correctStrategy: 'CHARISMA',
        options: {
            charisma: "Confidence over talent. I like your style.",
            money: "I can get us a private karaoke room if you want.",
            fame: "I judged a singing competition once. You'd be memorable."
        }
    }
];

// ============================================
// CATEGORY B: MONEY (The Lifestyle) - 20 Scenarios
// ============================================

const MONEY_SCENARIOS: HookupScenario[] = [
    {
        id: 'money_001',
        clue: "She creates a scene because her champagne isn't chilled enough.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Champagne drama? You must be fun at parties.",
            money: "Let's order a bottle of the vintage Dom, properly chilled.",
            fame: "I've had champagne with actual royalty. This place is amateur hour."
        }
    },
    {
        id: 'money_002',
        clue: "She's glancing enviously at the yacht owners in the VIP section.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "VIP is overrated. The real fun is down here.",
            money: "My driver is outside, but the helicopter is faster.",
            fame: "I filmed a music video on a yacht last month."
        }
    },
    {
        id: 'money_003',
        clue: "She's complaining to her friend that her Birkin is last season's.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Fashion is temporary. Your personality is what matters.",
            money: "Paris Fashion Week is next month. I have front row seats.",
            fame: "Hermès sent me three this year. I can't keep up."
        }
    },
    {
        id: 'money_004',
        clue: "She's checking her Patek Philippe watch every five minutes.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Waiting for someone or just bored?",
            money: "That's a beautiful piece. I have the same one in rose gold.",
            fame: "They gifted me one for a campaign. Time is money, right?"
        }
    },
    {
        id: 'money_005',
        clue: "She's turning down drinks because 'it's not Grey Goose.'",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Picky drinker or just have standards?",
            money: "Grey Goose? Let me introduce you to Louis XIII.",
            fame: "I did a vodka commercial once. Want the inside scoop on brands?"
        }
    },
    {
        id: 'money_006',
        clue: "She's showing off her new Cartier bracelet to everyone nearby.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "It's beautiful, but I bet your smile is worth more.",
            money: "Cartier is classic. I just picked up a piece from their new collection.",
            fame: "They loaned me jewelry for the red carpet last week."
        }
    },
    {
        id: 'money_007',
        clue: "She's complaining that the club doesn't have a private jet service.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "A private jet to a club? That's a new one.",
            money: "Mine's at the airport. Where do you want to go after this?",
            fame: "I flew private to Cannes last month. It's the only way to travel."
        }
    },
    {
        id: 'money_008',
        clue: "She's discussing her recent trip to the Maldives in a private villa.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Sounds amazing. What was your favorite part?",
            money: "Maldives is beautiful. I prefer my villa in Santorini though.",
            fame: "I shot a campaign there. The sunsets are unreal."
        }
    },
    {
        id: 'money_009',
        clue: "She's refusing to sit anywhere but the VIP section.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "VIP is just a label. The real party is everywhere.",
            money: "I own a table upstairs. Much better view.",
            fame: "They usually reserve the best section for me. Want to join?"
        }
    },
    {
        id: 'money_010',
        clue: "She's on the phone arranging a shopping trip to Milan tomorrow.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Milan? That's spontaneous. I like it.",
            money: "Milan is lovely. My jet can take us if you need a ride.",
            fame: "I'm walking in Milan Fashion Week. Want a backstage pass?"
        }
    },
    {
        id: 'money_011',
        clue: "She's complaining that the club's caviar service is 'pedestrian.'",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Caviar at a club? You have high standards.",
            money: "I have Beluga at my place. Much better quality.",
            fame: "I filmed a luxury food series. This place didn't make the cut."
        }
    },
    {
        id: 'money_012',
        clue: "She's showing her friend photos of her new Lamborghini.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Nice car. But can you actually drive it?",
            money: "Beautiful choice. I went with the Bugatti myself.",
            fame: "They let me test drive one for a commercial. Incredible machine."
        }
    },
    {
        id: 'money_013',
        clue: "She's discussing her interior designer's vision for her penthouse.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Sounds like you have great taste in design.",
            money: "I just finished renovating my place in Monaco. Used the same designer as the royal family.",
            fame: "Architectural Digest featured my home last year."
        }
    },
    {
        id: 'money_014',
        clue: "She's wearing a dress that costs more than most people's cars.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "You look stunning. The dress is just a bonus.",
            money: "Valentino? I was at their private showing last week.",
            fame: "They dressed me for the Oscars. Beautiful piece."
        }
    },
    {
        id: 'money_015',
        clue: "She's complaining that first class to Dubai was 'too crowded.'",
        correctStrategy: 'MONEY',
        options: {
            charisma: "First class problems. Must be tough.",
            money: "That's why I only fly private. No crowds, no hassle.",
            fame: "Emirates upgraded me to their private suite. It's the only way."
        }
    },
    {
        id: 'money_016',
        clue: "She's casually mentioning her family's vineyard in Tuscany.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "A vineyard? That sounds like a dream.",
            money: "Tuscany is beautiful. I'm looking at properties there myself.",
            fame: "I filmed a wine documentary in that region."
        }
    },
    {
        id: 'money_017',
        clue: "She's annoyed that the club doesn't validate valet for Ferraris.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Ferrari problems. Life must be hard.",
            money: "I'll cover it. What's a few hundred between friends?",
            fame: "They gave me one for a campaign. Beautiful car."
        }
    },
    {
        id: 'money_018',
        clue: "She's planning her fourth vacation this month to the French Riviera.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Four vacations? You know how to live.",
            money: "The Riviera is lovely. I have a yacht docked in Monaco if you want to visit.",
            fame: "I'm hosting an event in Cannes next week. You should come."
        }
    },
    {
        id: 'money_019',
        clue: "She's discussing her art collection and recent Sotheby's auction.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "Art collector? That's impressive.",
            money: "I was at that auction. Picked up a Basquiat.",
            fame: "I'm friends with several artists. Want an introduction?"
        }
    },
    {
        id: 'money_020',
        clue: "She's wearing jewelry that requires its own security detail.",
        correctStrategy: 'MONEY',
        options: {
            charisma: "That's stunning. You wear it well.",
            money: "Harry Winston? I have a piece from their vault collection.",
            fame: "They loaned me the Hope Diamond once. Security was intense."
        }
    }
];

// ============================================
// CATEGORY C: FAME (The Clout) - 20 Scenarios
// ============================================

const FAME_SCENARIOS: HookupScenario[] = [
    {
        id: 'fame_001',
        clue: "She's live-streaming and looking for a collab.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Live streaming at a club? That's dedication.",
            money: "I can get you into better venues for content.",
            fame: "Tag me in that story, my 2 million followers will love it."
        }
    },
    {
        id: 'fame_002',
        clue: "She whispers to her friend while pointing at you.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Do I have something on my face or are you just interested?",
            money: "If you're wondering, yes, I can afford to buy you a drink.",
            fame: "Yes, it's me. No photos tonight, please."
        }
    },
    {
        id: 'fame_003',
        clue: "She's checking her follower count every two minutes.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Numbers don't define you. How about we just talk?",
            money: "I can introduce you to people who'll boost those numbers.",
            fame: "I hit 5 million last week. The algorithm is wild."
        }
    },
    {
        id: 'fame_004',
        clue: "She's taking selfies with perfect lighting and angles.",
        correctStrategy: 'FAME',
        options: {
            charisma: "You're a natural. The camera loves you.",
            money: "I know a photographer who could make you look even better.",
            fame: "I have a professional photographer on call. Want some shots?"
        }
    },
    {
        id: 'fame_005',
        clue: "She's asking everyone if they saw her recent viral TikTok.",
        correctStrategy: 'FAME',
        options: {
            charisma: "I don't really do TikTok, but I'd love to hear about it.",
            money: "Viral content is great. I can fund your next big idea.",
            fame: "I saw it! My team wants to collab. Are you interested?"
        }
    },
    {
        id: 'fame_006',
        clue: "She's wearing a press badge and interviewing people for her blog.",
        correctStrategy: 'FAME',
        options: {
            charisma: "A journalist at a club? That's interesting.",
            money: "I can get you exclusive access to better events.",
            fame: "I've been interviewed by Vogue. Want a real story?"
        }
    },
    {
        id: 'fame_007',
        clue: "She's showing her friend screenshots of celebrity DMs.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Celebrity DMs? Sounds like you're doing well.",
            money: "I can introduce you to them in person if you want.",
            fame: "I have a group chat with half of them. Want in?"
        }
    },
    {
        id: 'fame_008',
        clue: "She's complaining that the paparazzi haven't found her yet.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Paparazzi are overrated. Enjoy the privacy while you can.",
            money: "I can hire photographers if you want the attention.",
            fame: "They follow me everywhere. It's exhausting but part of the job."
        }
    },
    {
        id: 'fame_009',
        clue: "She's discussing her upcoming podcast with a major network.",
        correctStrategy: 'FAME',
        options: {
            charisma: "A podcast? What's it about?",
            money: "I can sponsor it if you need funding.",
            fame: "I've been on Joe Rogan. Want some tips?"
        }
    },
    {
        id: 'fame_010',
        clue: "She's wearing merch from her own brand and promoting it.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Entrepreneur? That's impressive.",
            money: "I can invest in your brand if you're looking for partners.",
            fame: "I launched three brands last year. Let's talk strategy."
        }
    },
    {
        id: 'fame_011',
        clue: "She's on FaceTime with someone, saying 'I'm at THE club right now!'",
        correctStrategy: 'FAME',
        options: {
            charisma: "Looks like you're having a good time.",
            money: "This club is nice, but I know better places.",
            fame: "Tell them I said hi. We probably have mutual friends."
        }
    },
    {
        id: 'fame_012',
        clue: "She's asking the DJ to shout out her Instagram handle.",
        correctStrategy: 'FAME',
        options: {
            charisma: "That's one way to get followers.",
            money: "I can pay for better promotion than that.",
            fame: "The DJ is my friend. Want a better shoutout?"
        }
    },
    {
        id: 'fame_013',
        clue: "She's recording everything for her YouTube vlog.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Vlogging at a club? You're committed.",
            money: "I can get you into exclusive events worth filming.",
            fame: "I have 3 million subscribers. Want to collab?"
        }
    },
    {
        id: 'fame_014',
        clue: "She's showing off her verified badge to everyone.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Verified? Cool. But who are you really?",
            money: "Verification is easy when you have the right connections.",
            fame: "I got verified in 2015. Welcome to the club."
        }
    },
    {
        id: 'fame_015',
        clue: "She's name-dropping celebrities she's 'close friends' with.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Sounds like you know a lot of people.",
            money: "I can introduce you to more if you're collecting.",
            fame: "Oh, I know them. We were just at Coachella together."
        }
    },
    {
        id: 'fame_016',
        clue: "She's complaining that her PR team didn't get her on the guest list.",
        correctStrategy: 'FAME',
        options: {
            charisma: "PR team drama? Sounds stressful.",
            money: "I can buy out the VIP section if that helps.",
            fame: "Fire them. My team never misses."
        }
    },
    {
        id: 'fame_017',
        clue: "She's discussing her recent magazine cover shoot.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Magazine cover? That's amazing. Congratulations.",
            money: "I know the editor. I can get you more covers.",
            fame: "Which one? I've done Vogue, Elle, and Harper's this year."
        }
    },
    {
        id: 'fame_018',
        clue: "She's asking strangers if they recognize her from TV.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Sorry, I don't watch much TV. But you seem interesting.",
            money: "I can get you better roles if you're an actress.",
            fame: "I think we were on the same talk show last month."
        }
    },
    {
        id: 'fame_019',
        clue: "She's planning her outfit for the Met Gala next month.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Met Gala? That's incredible. What's the theme?",
            money: "I can connect you with the best designers.",
            fame: "I'm going too. Want to coordinate?"
        }
    },
    {
        id: 'fame_020',
        clue: "She's showing her friend her Wikipedia page on her phone.",
        correctStrategy: 'FAME',
        options: {
            charisma: "Wikipedia page? You've made it.",
            money: "I can hire someone to make yours more impressive.",
            fame: "Mine needs updating. My editor is slacking."
        }
    }
];

// ============================================
// MASTER DATABASE EXPORT
// ============================================

export const HOOKUP_SCENARIOS: HookupScenario[] = [
    ...CHARISMA_SCENARIOS,
    ...MONEY_SCENARIOS,
    ...FAME_SCENARIOS
];

// Helper function to get a random scenario
export const getRandomScenario = (): HookupScenario => {
    const randomIndex = Math.floor(Math.random() * HOOKUP_SCENARIOS.length);
    return HOOKUP_SCENARIOS[randomIndex];
};

// Helper function to get scenarios by strategy
export const getScenariosByStrategy = (strategy: HookupStrategy): HookupScenario[] => {
    return HOOKUP_SCENARIOS.filter(scenario => scenario.correctStrategy === strategy);
};
