// src/data/events/territory.ts
//
// ============================================================================
//  FOUR LETTERS FROM PEOPLE WHO WERE THERE FIRST
// ============================================================================
//
//  A note on provenance, because it matters for what this is. The plan file
//  says "the VoltManagement scene from your notes", and that scene is not in
//  the repository - the only surviving trace of it is that one line. So the
//  Robotics letter below is a reconstruction rather than a transcription, and
//  it is the archetype the other three are cut from: an incumbent who is
//  polite, specific, entirely reasonable, and threatening a thing he has not
//  named.
//
//  ---------------------------------------------------------------------------
//  ONE DECISION, TWO ANSWERS, AND THEY COST DIFFERENT KINDS OF THING
//  ---------------------------------------------------------------------------
//  See core/market/territory.ts for the arithmetic. In short:
//
//      DEFER   four points of that category's revenue, forever. Costs nothing
//              on the day and grows with every quarter you succeed.
//      FIGHT   they spend against you for six quarters - about a third of your
//              position in that category while it lasts - and then it stops.
//
//  Deferring is cheap now and compounds; fighting is expensive now and ends.
//  Neither is correct twice, which is the only test of a dilemma worth
//  writing: a player about to win the category should fight, and one passing
//  through should not, and the letter arrives before they know which they are.
//
//  ---------------------------------------------------------------------------
//  THE FOUR ARE NOT ONE LETTER WITH THE NAMES SWAPPED
//  ---------------------------------------------------------------------------
//  Each incumbent threatens with the thing their own industry actually has.
//  The car man talks about dealers and warranties. The chip company talks
//  about allocation, which is the only weapon in that business and the whole
//  reason it is frightening. The medical group talks about trial sites and
//  regulators, and never once threatens anything - they describe a process.
//  And Pear does not write about entry at all, because you have been in his
//  market since your first quarter; he writes about the moment you started
//  to matter, which is a different and much later letter.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';
// ---------------------------------------------------------------------------
//  THE NUMBERS LIVE HERE, NOT IN THE ENGINE
// ---------------------------------------------------------------------------
//  These three were imported from core/market/territory.ts on the first pass
//  and that broke the audit - not loudly, which is the point. Story data may
//  not import the engine (scripts/reachability.js, `loadTs`), and reaching
//  outside made the loader throw, which made it skip data/events ENTIRELY:
//  four unvalidated scenes, one confusing line of output.
//
//  Declaring them here is also the more honest arrangement. A scene is the
//  CONTRACT - it is where the terms are actually agreed - and the engine's job
//  is arithmetic on whatever it is handed through the effect. The two copies
//  are held together by a test in core/market/territory.test.ts rather than by
//  an import, and that test fails if either side moves.
// ---------------------------------------------------------------------------

/** Six points of the category's revenue, quarterly, forever. */
export const ROYALTY_RATE = 0.06;
/** How long an incumbent spends against you before it stops. */
export const SIEGE_QUARTERS = 6;
/** How much heavier the field gets while they do. */
export const SIEGE_PRESSURE = 1.45;

/**
 * The two effects every one of these four scenes ends in.
 *
 * Written once and shared, so that four scenes cannot quietly disagree about
 * what deferring costs. If the Bio-Tech letter charged five points and the
 * others charged four, nothing would fail and the player would never know.
 */
const defer = (category: string) => [
    { kind: 'royalty' as const, category, rate: ROYALTY_RATE },
    { kind: 'flag' as const, flag: 'kneltToAGiant' as const },
];

const fight = (category: string) => [
    {
        kind: 'siege' as const,
        category,
        quarters: SIEGE_QUARTERS,
        pressure: SIEGE_PRESSURE,
    },
    { kind: 'flag' as const, flag: 'declaredWarOnAGiant' as const },
];

// ============================================================================
//  1. ROBOTICS — Edison Motors
// ============================================================================
//  The archetype. He never threatens: he describes an arrangement that already
//  exists and lets the player work out that they are outside it.
//
//  His weapon is distribution, which is the correct weapon for that industry -
//  you can build a better machine than his and still not be able to get it
//  serviced in Ohio.
// ============================================================================
const ROBOTICS: Condition[] = [
    { kind: 'flag', flag: 'enteredRobotics' },
];

export const territoryRobotics: Conversation = {
    id: 'event-territory-robotics',
    channel: 'mail',
    from: 'edison',
    subject: 'A note on the drivetrain category',
    when: ROBOTICS,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'edison',
            text: 'I saw the unit at the Cleveland show. It is better than I expected and I want to say that first, because the rest of this letter is going to sound like it was written by a lawyer, and it was.\n\nWe have supplied this category for thirty-one years. Four hundred and twelve service centres carry our parts. The warranty network is ours, the training programme is ours, and every one of those relationships is a contract with a term in it.\n\nNone of that is a threat. It is simply the shape of the room you have walked into.',
            choices: [
                { text: 'Say what you want.', next: 'want' },
                { text: 'You are describing a monopoly.', next: 'monopoly' },
            ],
        },

        {
            id: 'monopoly',
            speaker: 'edison',
            // He agrees, cheerfully and without embarrassment, which is more
            // frightening than a denial, and it is the whole man.
            text: 'I am, and I would not use the word in writing, but yes.\n\nIt was not built to keep anybody out. It was built because somebody had to answer the phone at two in the morning when a line goes down in Toledo, and for thirty-one years that has been us. That it also keeps people out is a consequence I have never once complained about.',
            choices: [
                { text: 'Say what you want.', next: 'want' },
                { text: 'Then we build our own network.', next: 'fight' },
            ],
        },

        {
            id: 'want',
            speaker: 'edison',
            text: 'A referral fee. Six points of what you sell in the category, paid quarterly, and in exchange your unit is serviceable at every one of those four hundred and twelve centres from the first of next month.\n\nIt is not a small thing I am offering and it is not a large thing I am asking. Six points of nothing is nothing, which I imagine is how it will look to you this year.',
            choices: [
                {
                    text: 'Four points. Done.',
                    effects: defer('Robotics'),
                },
                { text: 'And if I say no?', next: 'fight' },
            ],
        },

        {
            id: 'fight',
            speaker: 'edison',
            // The cost of fighting is stated plainly and without malice. He is
            // not warning the player; he is telling them what a Tuesday looks
            // like from his side.
            text: 'Then nothing happens to you. I want to be precise about that because people expect drama and there is not going to be any.\n\nWe will simply advertise. A great deal, for about eighteen months, in every place you were going to advertise. Our dealers will be given a reason to lead with our unit, and they will take it, because they always do. You will not lose a customer to anything except a better-funded advertisement.\n\nIt is dull and it works and it ends when we stop.',
            choices: [
                {
                    text: 'Then advertise.',
                    effects: fight('Robotics'),
                },
                {
                    text: '...six points.',
                    effects: defer('Robotics'),
                },
            ],
        },
    ],
};

export const territoryRoboticsEvent: GameEvent = {
    id: 'territory-robotics',
    when: ROBOTICS,
    chance: 0.9,
    conversation: territoryRobotics,
    headline: 'Edison Motors is understood to have written to Hale over the drivetrain category.',
    priority: 4,
};

// ============================================================================
//  2. DEEP TECH — OpenAI-ish
// ============================================================================
//  THE FIRST DRAFT OF THIS LETTER WAS FROM THE WRONG COMPANY. It came from
//  Novidia and threatened chip allocation, which reads well and is the correct
//  weapon for a chip business - and Novidia is not the giant of this category.
//  OpenAI-ish holds 29 to their 26. The test that checks the four letters
//  against PRODUCT_MARKETS caught it; nothing else would have.
//
//  So her weapon is the one a frontier lab actually has, and it is not
//  allocation: it is PEOPLE. What she is selling is a promise not to recruit
//  from you, which is a real arrangement, quietly unlawful in several
//  jurisdictions, and something she would never call by its name.
//
//  It is also deliberately not the poach event (data/events/poach.ts). That
//  one is somebody taking your engineer. This is somebody offering to stop.
// ============================================================================
const DEEP_TECH: Condition[] = [
    { kind: 'flag', flag: 'enteredDeepTech' },
];

export const territoryDeepTech: Conversation = {
    id: 'event-territory-deeptech',
    channel: 'mail',
    from: 'openai',
    subject: 'Research hiring, an arrangement',
    when: DEEP_TECH,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'openai',
            // An HR email about an existential threat, and she does not appear
            // to notice the difference.
            text: 'Congratulations on the launch. I mean that; there are four groups in the world who could have shipped it and until this quarter we did not count yours.\n\nMy team maintains a list of people we would hire on sight. Eleven of yours are on it. Two have been contacted this year, both before your launch, and neither is aware I am writing to you.\n\nI would like to propose an arrangement.',
            choices: [
                { text: 'Go on.', next: 'terms' },
                { text: 'You are threatening to hire my staff.', next: 'threat' },
            ],
        },

        {
            id: 'threat',
            speaker: 'openai',
            // She corrects him on a technicality, accurately, and the
            // correction is worse than the accusation.
            text: 'No. I am telling you that we hire from a list and that your people are on it, which was true last year and will be true whatever either of us decides.\n\nThe threat would be if I stopped hiring from everywhere else.',
            choices: [
                { text: 'Go on.', next: 'terms' },
                { text: 'Then we will pay them more.', next: 'payThem' },
            ],
        },

        {
            id: 'terms',
            speaker: 'openai',
            text: 'A research access agreement. Six points of category revenue, quarterly. You get early sight of published work and a standing invitation to the summer programme.\n\nAnd for the term of the agreement, neither party recruits from the other. That clause is the third paragraph and it is the reason for all the others.',
            choices: [
                {
                    text: 'Six points. Send it.',
                    effects: defer('Deep Tech'),
                },
                { text: 'Then we will pay them more.', next: 'payThem' },
            ],
        },

        {
            id: 'payThem',
            speaker: 'openai',
            // The cost of fighting, stated without any pleasure in it. Every
            // clause is a real thing that happens to a small lab.
            text: 'You can, and some of them will stay, and I would like to be honest about which ones.\n\nThe people who leave for us are not leaving for money. They leave because we have eleven thousand accelerators sitting idle at three in the morning and you have a purchase order. You would be bidding against a building.\n\nYou will keep the ones who are loyal to you personally. That is not nothing and it is not a research programme.',
            choices: [
                {
                    text: 'Then we will bid against the building.',
                    effects: fight('Deep Tech'),
                },
                {
                    text: 'Send the agreement.',
                    effects: defer('Deep Tech'),
                },
            ],
        },
    ],
};

export const territoryDeepTechEvent: GameEvent = {
    id: 'territory-deeptech',
    when: DEEP_TECH,
    chance: 0.9,
    conversation: territoryDeepTech,
    headline: 'OpenAI-ish has opened a research access programme. Two rivals have already signed.',
    priority: 4,
};

// ============================================================================
//  3. BIO-TECH — Johnson & Swanson
// ============================================================================
//  The only one of the four that never threatens anything at all. They
//  describe a process - trial sites, a regulator's queue, a standards
//  committee - and every sentence is true, procedural and completely outside
//  the player's control. Nobody in this letter is the villain and there is
//  nobody to argue with, which is the point.
// ============================================================================
const BIO_TECH: Condition[] = [
    { kind: 'flag', flag: 'enteredBioTech' },
];

export const territoryBioTech: Conversation = {
    id: 'event-territory-biotech',
    channel: 'mail',
    from: 'swanson',
    subject: 'Standards participation, invitation',
    when: BIO_TECH,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'swanson',
            text: 'We would like to invite your company to join the category standards committee. This is a genuine invitation and I hope you will read it as one.\n\nThe committee sets the interface specifications your device must meet, agrees the trial protocols, and holds the slot allocation at the eleven centres that run them. We chair it. We have chaired it since it was founded, at our expense, and nobody else has ever wanted to.\n\nMembership is six points of category revenue. It funds the secretariat.',
            choices: [
                { text: 'And if we do not join?', next: 'notJoin' },
                { text: 'Who else is on it?', next: 'whoElse' },
            ],
        },

        {
            id: 'whoElse',
            speaker: 'swanson',
            text: 'Everyone. That is not a boast, it is the difficulty, a standards body that some of the industry belongs to is not a standard, it is an opinion, so over twenty years everyone has joined.\n\nIt does mean that when your specification and the committee\'s specification disagree, there is a room where that gets resolved, and you are not currently in it.',
            choices: [
                { text: 'And if we do not join?', next: 'notJoin' },
                {
                    text: 'Then we will join.',
                    effects: defer('Bio-Tech'),
                },
            ],
        },

        {
            id: 'notJoin',
            speaker: 'swanson',
            // Nothing punitive, nothing deniable, nothing anybody decided.
            text: 'Then nothing is withheld from you. I want to be careful here because I am aware how this reads.\n\nYou will apply for trial slots through the public queue, which is first come and honestly run. You will meet the published specification, which is revised twice a year, and you will read the revisions when they are published rather than when they are drafted. Your submissions will be assessed on their merits by people who have never heard of either of us.\n\nAll of that is fair. It is also about four quarters slower, every time, forever, and there is nobody you could complain to about it.',
            choices: [
                {
                    text: 'We will use the public queue.',
                    effects: fight('Bio-Tech'),
                },
                {
                    text: 'Send the membership papers.',
                    effects: defer('Bio-Tech'),
                },
            ],
        },
    ],
};

export const territoryBioTechEvent: GameEvent = {
    id: 'territory-biotech',
    when: BIO_TECH,
    chance: 0.9,
    conversation: territoryBioTech,
    headline: 'Hale has been invited to the medical device standards committee.',
    priority: 4,
};

// ============================================================================
//  4. CONSUMER — Pear
// ============================================================================
//  NOT AN ENTRY LETTER, and it cannot be one: the starter product is a phone,
//  so the player has been in Consumer since the first quarter of the game. An
//  entry trigger here would fire before the father is even dead.
//
//  So Pear's version is about SHARE. He does not mind that you are in his
//  market - he has never minded, and he says so, which is the insult. He minds
//  that you have started to matter in it.
//
//  IT MUST NOT STEP ON HIS ESCALATION ARC. The letters in pearEscalation.ts
//  are gated on `refusedPear` and hostility and are what he does once you are
//  enemies. This one requires that none of that has happened yet: it is the
//  first time he writes to you about competition rather than about buying you,
//  and it is the foundation those letters were missing.
// ============================================================================
const CONSUMER: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    // The share at which he stops being able to ignore you. Below this he
    // genuinely does not care, and the letter would be a lie.
    { kind: 'marketShareAtLeast', percent: 8 },
    // Before the war, and only before it. Once he is escalating, he has
    // louder things to send - see pearEscalation.ts.
    { kind: 'dialAtMost', dial: 'pearHostility', band: 'low' },
];

export const territoryConsumer: Conversation = {
    id: 'event-territory-consumer',
    channel: 'mail',
    from: 'pear',
    subject: 'Category review, no action required',
    when: CONSUMER,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            // The subject line does the work: "no action required" on a letter
            // that exists only because action is being considered.
            text: 'Ref: CORP/CAT/0071-2\n\nYour company appears in our quarterly category review for the first time in eleven years. It appeared in the review your father received in the year he entered, and then it did not appear again, and I want to be clear that this was not a decision anybody made.\n\nWe have no objection to your presence in this category and have never had one. I am writing because a threshold has been crossed in a spreadsheet.',
            choices: [
                { text: 'What threshold?', next: 'threshold' },
                { text: 'You have never written to me about anything but buying me.', next: 'buying' },
            ],
        },

        {
            id: 'buying',
            speaker: 'pear',
            text: 'That is correct, and I would not have described it as a change of subject.\n\nWe have historically found the two conversations to be the same conversation held at different volumes.',
            choices: [
                { text: 'What threshold?', next: 'threshold' },
                { text: 'Then we can skip to the end.', next: 'terms' },
            ],
        },

        {
            id: 'threshold',
            speaker: 'pear',
            // The most quietly brutal thing in the four letters: he tells the
            // player exactly how little he has thought about them until now.
            text: 'The one at which a competitor stops being described in our planning documents as "other".\n\nYou were in "other" for eleven years. It is not a small number and there is no contempt in it, most of the category is "other" and always has been. But the line item is there, it is annual, and somebody in a room this month said your name out loud in order to move you out of it.\n\nI thought you would rather hear that from us.',
            choices: [
                { text: 'And now?', next: 'terms' },
                { text: 'My father would have found that funny.', next: 'father' },
            ],
        },

        {
            id: 'father',
            speaker: 'pear',
            // One sentence of warmth, withdrawn inside the same paragraph. The
            // Lisbon-postscript register - see pearEscalation's midnight
            // message for where this eventually goes.
            text: 'He would have had it framed. He told me once, at a dinner neither of us wanted to be at, that he intended to be a rounding error in my accounts for as long as it took.\n\nI assumed he was making a joke about his size. I have since read it the other way.\n\nRef CORP/CAT/0071-2 remains open.',
            choices: [
                { text: 'And now?', next: 'terms' },
                {
                    text: '(close it)',
                    effects: fight('Consumer'),
                },
            ],
        },

        {
            id: 'terms',
            speaker: 'pear',
            text: 'A category participation arrangement. Six points of your consumer revenue, quarterly, against which we license the interface patents you are currently working around and will not have to work around any longer.\n\nIt is a real licence for real property and the price is the price we charge everybody. It is also, and I would not write this if I thought you did not already know it, the fee for remaining "other".',
            choices: [
                {
                    text: 'Four points. We stay small and quiet.',
                    effects: defer('Consumer'),
                },
                {
                    text: 'Move me out of "other", then.',
                    effects: [
                        ...fight('Consumer'),
                        // The only one of the four that moves a dial, because
                        // he is the only incumbent the story already tracks a
                        // relationship with. This is where his escalation arc
                        // actually starts.
                        { kind: 'dial', dial: 'pearHostility', delta: 12 },
                    ],
                },
            ],
        },
    ],
};

export const territoryConsumerEvent: GameEvent = {
    id: 'territory-consumer',
    when: CONSUMER,
    chance: 0.85,
    conversation: territoryConsumer,
    headline: 'Pear\'s category review names a domestic rival for the first time in a decade.',
    priority: 4,
};

export const TERRITORY_CONVERSATIONS = [
    territoryRobotics, territoryDeepTech, territoryBioTech, territoryConsumer,
];

export const TERRITORY_EVENTS = [
    territoryRoboticsEvent, territoryDeepTechEvent,
    territoryBioTechEvent, territoryConsumerEvent,
];
