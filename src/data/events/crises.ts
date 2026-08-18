// src/data/events/crises.ts
//
// ============================================================================
//  TWELVE THINGS YOU GET OUT OF, RATHER THAN THINGS YOU BEAT
// ============================================================================
//
//  THE ONE RULE THIS PACK IS BUILT ON: no answer anywhere in it is free.
//
//  That is what "low chance of success" has to mean here, because there are no
//  dice in a choice - effects are deterministic, and a percentage would be a
//  slot machine with prose on it. A crisis is difficult in this game because
//  every door out of the room takes something, and the decision is only ever
//  WHICH CURRENCY: money now, brand, standing, the people on the floor, or a
//  fact about you that a later scene can find.
//
//  It is enforced rather than remembered. crises.test.ts walks every terminal
//  choice in all twelve and fails on any that costs nothing.
//
//  ---------------------------------------------------------------------------
//  MOST OF THEM ARE CONVERSATIONS WITH YOUR OWN PEOPLE
//  ---------------------------------------------------------------------------
//  Which is the pack's identity, and the thing that separates it from the
//  market letters. Those all arrive from outside - an incumbent, a fund, a
//  rival. A crisis is somebody who works for you standing in your doorway,
//  usually having already started fixing it, telling you a thing you did not
//  want to know. Only two of the twelve come from strangers: the people who
//  encrypted your servers, and the regulator.
//
//  ---------------------------------------------------------------------------
//  AND MOST OF THEM COST BRAND
//  ---------------------------------------------------------------------------
//  Deliberately. `brand` runs through applyCorporateShock, which spreads a hit
//  across every category weighted by how much your name counted for in each -
//  so a crisis costs you most where you were strongest. That is the correct
//  shape for reputational damage and it is the reason brand rather than cash
//  is the pack's default currency.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

// ---------------------------------------------------------------------------
//  WHEN A CRISIS CAN FIND YOU AT ALL
// ---------------------------------------------------------------------------
//  Every one of the twelve carries this. A supplier collapse before you have
//  a supplier is the characteristic bug of a random event system, and the
//  father is alive for the whole first year - a crisis arriving while he is
//  still sending instructions would be answered by him, not by the player.
// ---------------------------------------------------------------------------
const GROWN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'quarterAtLeast', quarter: 16 },
];

/** Ordinary difficulty for this pack: often enough to be the weather of running a company. */
const USUAL = { chance: 0.15, cooldown: 10, priority: 3 } as const;

// ============================================================================
//  1. RANSOMWARE
// ============================================================================
//  One of the two outside voices. ORACLE is already in the cast - "bored
//  professionalism, like a courier reading out a delivery slot" - and this is
//  what that file was written for.
//
//  Both doors cost. Paying is money and a fact about you that does not go
//  away; refusing is a quarter of the plant and the brand hit of saying out
//  loud that you were breached.
// ============================================================================
export const crisisRansomware: Conversation = {
    id: 'event-crisis-ransomware',
    channel: 'message',
    from: 'hacker',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'hacker',
            text: 'Good morning. Your production scheduling, your supplier contracts and four years of design files are encrypted. Nothing has been taken off site and nothing will be if this is concluded today.\n\nThe figure is at the end of this message. The window is seventy-two hours, after which it doubles once and then we stop answering.\n\nWe do this eleven or twelve times a year. It is usually straightforward.',
            choices: [
                { text: 'How do I know you can undo it?', next: 'proof' },
                { text: 'We are not paying you.', next: 'refuse' },
            ],
        },
        {
            id: 'proof',
            speaker: 'hacker',
            // The flash of something almost friendly, which the cast file
            // calls the most frightening part.
            text: 'We have released your payroll directory as a gesture. Check it before you decide anything.\n\nAnd for what it is worth, which is nothing: your backups are on the same domain as the machines. Somebody told you that was fine. It was fine until this morning.',
            choices: [
                {
                    text: 'Pay it.',
                    effects: [
                        { kind: 'capital', amount: -3_200_000 },
                        { kind: 'flag', flag: 'paidTheRansom' },
                        // Smaller than refusing, because nobody hears about it
                        // - which is exactly why it is the tempting one.
                        { kind: 'brand', amount: -2 },
                    ],
                },
                { text: 'We are not paying you.', next: 'refuse' },
            ],
        },
        {
            id: 'refuse',
            speaker: 'hacker',
            text: 'Understood, and it is a defensible position. Roughly a third of people take it.\n\nYou will be down for six to nine weeks and you will have to tell somebody why. We will not contact you again.',
            choices: [
                {
                    text: 'Rebuild from whatever we have.',
                    effects: [
                        { kind: 'capital', amount: -1_100_000 },
                        { kind: 'brand', amount: -6 },
                        { kind: 'morale', amount: -5 },
                        {
                            kind: 'news',
                            headline: 'Hale confirms a systems incident. The company says no customer data was taken.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2. THE LEAK
// ============================================================================
//  Priya, and the decision is the oldest one in the field: tell them, or find
//  out later that somebody else did. Concealing is cheaper this quarter and
//  raises a flag that the regulator's letter reads.
// ============================================================================
export const crisisLeak: Conversation = {
    id: 'event-crisis-leak',
    channel: 'message',
    from: 'cto',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'A support database was public for eleven days. Names, addresses, order histories, about four hundred thousand records. No payment data, which is the only good sentence in this message.\n\nIt is closed now. It was open for eleven days and I do not know who looked.',
            choices: [
                { text: 'Do we have to tell anyone?', next: 'haveTo' },
                { text: 'Write to all four hundred thousand.', next: 'notify' },
            ],
        },
        {
            id: 'haveTo',
            speaker: 'cto',
            // Accurate, unhelpful, and she is careful to be both.
            text: 'Legally, arguable. Practically, somebody scraped it or nobody did, and we will find out which in about a year.\n\nI am not going to advise you on this one. I will say that the eleven days are in a log we do not control, and that the log is the thing that decides how this reads later rather than anything either of us says now.',
            choices: [
                {
                    text: 'Nobody hears about this.',
                    effects: [
                        { kind: 'flag', flag: 'concealedTheLeak' },
                        // Cheap now. The regulator's letter is what it costs.
                        { kind: 'brand', amount: -1 },
                    ],
                },
                { text: 'Write to all four hundred thousand.', next: 'notify' },
            ],
        },
        {
            id: 'notify',
            speaker: 'cto',
            text: 'Then it goes out Monday and the first two weeks will be unpleasant.\n\nFor what it is worth, the companies that do this are the ones you have never heard a second story about.',
            choices: [
                {
                    text: 'Send it.',
                    effects: [
                        { kind: 'capital', amount: -800_000 },
                        { kind: 'brand', amount: -5 },
                        { kind: 'dial', dial: 'publicReputation', delta: 5 },
                        {
                            kind: 'news',
                            headline: 'Hale notifies 400,000 customers of an exposure. Regulators note the speed.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  3. THE REGULATOR FINDS THE BATCH YOU BURIED
// ============================================================================
//  The only one of the twelve that is not a surprise, and the only one with
//  no decision in it at all - which is the point. The COO said, two months
//  ago in data/events/recall.ts, that burying it was the expensive option and
//  that you would not find out why for about two months.
//
//  This is finding out why. It is gated on `buriedTheRecall`, a flag that
//  exists because that branch previously carried no effects whatsoever.
// ============================================================================
const BURIED: Condition[] = [
    ...GROWN,
    { kind: 'flag', flag: 'buriedTheRecall' },
];

export const crisisForcedRecall: Conversation = {
    id: 'event-crisis-forced-recall',
    channel: 'mail',
    from: 'regulator',
    subject: 'Notice under s.14(2), mandatory corrective action',
    when: BURIED,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'regulator',
            text: 'Following an investigation opened on the receipt of third-party complaints, the Directorate is satisfied that the undertaking placed on the market a product presenting a serious risk, and continued to do so after the defect was known internally.\n\nCorrective action is mandatory and is to be completed within ninety days. The undertaking is directed to publish the notice at s.14(2)(c) in the form attached.\n\nThe internal correspondence relied upon is listed at Annex B.',
            choices: [
                { text: 'Annex B.', next: 'annexB' },
                {
                    text: '(comply)',
                    effects: [
                        { kind: 'capital', amount: -4_500_000 },
                        { kind: 'brand', amount: -12 },
                        { kind: 'dial', dial: 'publicReputation', delta: -10 },
                        {
                            kind: 'news',
                            headline: 'Regulator orders Hale recall and finds the defect was known internally.',
                        },
                    ],
                },
            ],
        },
        {
            id: 'annexB',
            speaker: 'regulator',
            // The COO's own note, quoted back. She asked for it in writing and
            // did not get it; she wrote it anyway.
            text: 'Annex B comprises four documents. The Directorate draws attention to the second, an internal operations note dated the quarter in which the defect was identified, which records that the matter was raised with the chief executive and that no decision was communicated.\n\nThe undertaking may make representations. The Directorate notes that representations do not suspend the ninety-day period.',
            choices: [
                {
                    text: '(comply)',
                    effects: [
                        { kind: 'capital', amount: -4_500_000 },
                        { kind: 'brand', amount: -12 },
                        { kind: 'dial', dial: 'publicReputation', delta: -10 },
                        {
                            kind: 'news',
                            headline: 'Regulator orders Hale recall and finds the defect was known internally.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  4. THE SUPPLIER GOES UNDER
// ============================================================================
//  Reuses `siege`: your line is not damaged, and everything beside it on the
//  shelf has become more attractive because yours is not there. That is what
//  a supply failure actually does to share and it needed no new machinery.
// ============================================================================
export const crisisSupplier: Conversation = {
    id: 'event-crisis-supplier',
    channel: 'message',
    from: 'coo',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Our second-tier connector supplier filed this morning. Not a warning, not a restructuring, filed.\n\nThey are in about a third of what we ship. There is one alternative source, they know exactly what has happened, and their price reflects it.',
            choices: [
                { text: 'What is the price?', next: 'price' },
                { text: 'Can we design around it?', next: 'redesign' },
            ],
        },
        {
            id: 'price',
            speaker: 'coo',
            text: 'Four times, for eighteen months, on a take-or-pay contract. It is not gouging exactly, they have to build a line for us and they know we cannot walk.\n\nI can also just build fewer things. That is a real option and I will not pretend otherwise.',
            choices: [
                {
                    text: 'Sign it. We keep shipping.',
                    effects: [{ kind: 'capital', amount: -5_000_000 }],
                },
                {
                    text: 'Build fewer things.',
                    effects: [
                        { kind: 'siege', category: 'Consumer', quarters: 4, pressure: 1.3 },
                        { kind: 'brand', amount: -4 },
                    ],
                },
            ],
        },
        {
            id: 'redesign',
            speaker: 'coo',
            text: 'Priya says four months and she is usually right about the engineering and wrong about the calendar. Call it six.\n\nSix months of building at two thirds, and then we never have this conversation again.',
            choices: [
                {
                    text: 'Redesign it. Take the six months.',
                    effects: [
                        { kind: 'siege', category: 'Consumer', quarters: 2, pressure: 1.35 },
                        { kind: 'capital', amount: -1_500_000 },
                    ],
                },
                {
                    text: 'No. Sign the contract.',
                    effects: [{ kind: 'capital', amount: -5_000_000 }],
                },
            ],
        },
    ],
};

// ============================================================================
//  5. THE UNION
// ============================================================================
//  Distinct from the COO's walkout, which is a spontaneous stoppage over pay
//  and reads morale. This is organised, external, and about something other
//  than money - which is why paying does not end it.
// ============================================================================
export const crisisUnion: Conversation = {
    id: 'event-crisis-union',
    channel: 'message',
    from: 'coo',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'They have voted. Eighty-one per cent on a seventy per cent turnout, which is not a protest vote, it is a mandate.\n\nAnd it is not about pay. It is about the shift pattern we introduced in the spring, which I recommended and which you approved, and which I have since been told by four separate people is unliveable.',
            choices: [
                { text: 'Was it unliveable?', next: 'wasIt' },
                { text: 'What do they want?', next: 'want' },
            ],
        },
        {
            id: 'wasIt',
            speaker: 'coo',
            // She takes it herself, and does not let the player off.
            text: 'Yes. I modelled it on a plant that runs four crews and we run three, and I did not check.\n\nThat is mine. You approved a recommendation I should not have made. I would rather say that now than have it come out of an arbitration.',
            choices: [
                { text: 'What do they want?', next: 'want' },
                {
                    text: 'Reverse the shift pattern.',
                    effects: [
                        { kind: 'capital', amount: -2_400_000 },
                        { kind: 'morale', amount: 6 },
                    ],
                },
            ],
        },
        {
            id: 'want',
            speaker: 'coo',
            text: 'The old pattern back, which costs us a crew, or a stoppage. There is no third thing and they have been advised well.\n\nIf we sit it out they will fold in about five weeks. So will the quarter, and so will a number of people I would like to keep.',
            choices: [
                {
                    text: 'Give them the pattern back.',
                    effects: [
                        { kind: 'capital', amount: -2_400_000 },
                        { kind: 'morale', amount: 6 },
                    ],
                },
                {
                    text: 'Sit it out.',
                    effects: [
                        { kind: 'morale', amount: -14 },
                        { kind: 'brand', amount: -5 },
                        { kind: 'dial', dial: 'publicReputation', delta: -6 },
                        {
                            kind: 'news',
                            headline: 'Hale plant stops for a fifth week. The dispute is about hours, not pay.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  6. THE EXECUTIVE
// ============================================================================
//  Arthur, being dry about something that is not dry. Both doors cost, and
//  the difference is who pays: the company's standing, or the floor's belief
//  that the rules are the same for everybody.
// ============================================================================
export const crisisExecutive: Conversation = {
    id: 'event-crisis-executive',
    channel: 'mail',
    from: 'cfo',
    subject: 'A matter I would rather have raised in person',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'A trade paper has a story about one of our vice presidents, two suppliers and a boat. They are running it on Friday whatever we say.\n\nI have read the documents. The story is correct in every particular that matters and wrong about the boat, which was chartered.',
            choices: [
                { text: 'How bad is it, legally?', next: 'legally' },
                { text: 'He goes today.', next: 'goes' },
            ],
        },
        {
            id: 'legally',
            speaker: 'cfo',
            text: 'Survivable. He has cost us perhaps two hundred thousand over four years and nobody will go to prison.\n\nThe difficulty is not legal. It is that eleven hundred people on the floor know what happens to them if they take a bottle of wine home at Christmas.',
            choices: [
                { text: 'He goes today.', next: 'goes' },
                {
                    text: 'We keep him and we ride it out.',
                    effects: [
                        { kind: 'flag', flag: 'keptTheScandal' },
                        { kind: 'brand', amount: -6 },
                        { kind: 'morale', amount: -9 },
                        { kind: 'dial', dial: 'publicReputation', delta: -7 },
                    ],
                },
            ],
        },
        {
            id: 'goes',
            speaker: 'cfo',
            text: 'Then it will be expensive, because his contract was written when your father was not paying attention, and it will be public, because a departure on a Thursday before a Friday story is not a mystery to anybody.',
            choices: [
                {
                    text: 'Pay him off. Today.',
                    effects: [
                        { kind: 'capital', amount: -2_800_000 },
                        { kind: 'brand', amount: -3 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 4 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  7. THE PATENT SUIT
// ============================================================================
export const crisisPatent: Conversation = {
    id: 'event-crisis-patent',
    channel: 'mail',
    from: 'cfo',
    subject: 'Served this morning',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'We have been sued over a thermal management patent by an entity that has no employees, no products and eleven hundred patents.\n\nOur counsel puts our chances at better than even. She also puts the cost of finding out at three years and rather more than they are asking for.',
            choices: [
                { text: 'So we settle.', next: 'settle' },
                { text: 'Better than even is better than even.', next: 'fight' },
            ],
        },
        {
            id: 'settle',
            speaker: 'cfo',
            // The reason settling is not simply the cheap answer.
            text: 'We settle, and it is the right decision, and I want to note the other half of it: everyone who does this to companies for a living will know by Tuesday that we settled.\n\nThere will be a second letter within two years. There always is.',
            choices: [
                {
                    text: 'Settle it.',
                    effects: [
                        // Money and nothing else. A quiet settlement does not
                        // move what the public thinks - it moves what the
                        // people who do this for a living think, which is what
                        // Arthur has just told you, and which arrives as a
                        // second letter rather than as a number today.
                        { kind: 'capital', amount: -3_400_000 },
                    ],
                },
            ],
        },
        {
            id: 'fight',
            speaker: 'cfo',
            text: 'It is. Three years of it, with our engineers in depositions instead of in the building, and a disclosure line in every set of accounts we publish until it ends.\n\nAnd if we win, we have won nothing. We simply keep what we already had.',
            choices: [
                {
                    text: 'Then we fight it.',
                    effects: [
                        { kind: 'capital', amount: -1_800_000 },
                        { kind: 'dial', dial: 'publicReputation', delta: -3 },
                    ],
                },
                {
                    text: '...no. Settle it.',
                    effects: [{ kind: 'capital', amount: -3_400_000 }],
                },
            ],
        },
    ],
};

// ============================================================================
//  8. THE ACCIDENT
// ============================================================================
//  The one with no cheap door and no clever answer, and the only one in the
//  pack where the money option is the one that reads worst.
// ============================================================================
export const crisisAccident: Conversation = {
    id: 'event-crisis-accident',
    channel: 'message',
    from: 'coo',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'A press guard failed on line two at ten past six. One of ours, twenty-six, four years with us. He is in surgery and they think he keeps the hand.\n\nI have stopped the line. I am not asking.',
            choices: [
                { text: 'Was the guard maintained?', next: 'maintained' },
                { text: 'What do you need?', next: 'need' },
            ],
        },
        {
            id: 'maintained',
            speaker: 'coo',
            // No hedging and no comfort. She answers the question.
            text: 'On schedule and signed off in March. The schedule is the manufacturer\'s and the manufacturer\'s schedule assumes two shifts.\n\nWe run three. That is in the file, it has been in the file since before either of us was here, and it is going to be the whole inquiry.',
            choices: [
                { text: 'What do you need?', next: 'need' },
                {
                    text: 'Keep it internal until we know more.',
                    effects: [
                        { kind: 'flag', flag: 'plantAccident' },
                        { kind: 'brand', amount: -8 },
                        { kind: 'morale', amount: -16 },
                        { kind: 'dial', dial: 'publicReputation', delta: -9 },
                    ],
                },
            ],
        },
        {
            id: 'need',
            speaker: 'coo',
            text: 'Every guard on every press replaced this month, not next. His wages and his family\'s costs for as long as it takes, decided today and not by a committee. And me in front of the inspector on Monday saying all of that out loud.\n\nIt is expensive. I would like you to say yes before you know how expensive.',
            choices: [
                {
                    text: 'Yes. All of it.',
                    effects: [
                        { kind: 'flag', flag: 'plantAccident' },
                        { kind: 'capital', amount: -4_200_000 },
                        { kind: 'brand', amount: -4 },
                        // The only place in the pack where morale goes UP on
                        // the expensive door. They were watching.
                        { kind: 'morale', amount: 4 },
                    ],
                },
                {
                    text: 'Do the guards. The rest goes to legal.',
                    effects: [
                        { kind: 'flag', flag: 'plantAccident' },
                        { kind: 'capital', amount: -900_000 },
                        { kind: 'brand', amount: -7 },
                        { kind: 'morale', amount: -12 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  9. COUNTERFEITS
// ============================================================================
export const crisisCounterfeit: Conversation = {
    id: 'event-crisis-counterfeit',
    channel: 'message',
    from: 'coo',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'There is a copy of our product in the channel. Good copy, same housing, same box, our name on it, about forty per cent of the price and it fails at nine months.\n\nOur returns desk has been repairing them under warranty since March because they could not tell either.',
            choices: [
                { text: 'Stop honouring the warranty.', next: 'stopWarranty' },
                { text: 'How do we get them out of the channel?', next: 'channel' },
            ],
        },
        {
            id: 'stopWarranty',
            speaker: 'coo',
            text: 'We can. It means telling a few thousand people who bought something in good faith that the thing in their hand is not ours and they are on their own.\n\nThey will not blame the factory in a country they cannot name. They will blame the name on the box, which is ours.',
            choices: [
                {
                    text: 'Stop it anyway.',
                    effects: [
                        { kind: 'brand', amount: -7 },
                        { kind: 'dial', dial: 'publicReputation', delta: -4 },
                    ],
                },
                { text: 'How do we get them out of the channel?', next: 'channel' },
            ],
        },
        {
            id: 'channel',
            speaker: 'coo',
            text: 'Buy them. Seriously, we go into the market and buy the fakes at retail, publicly, and we keep honouring the warranty while we do it.\n\nIt is an absurd amount of money for a pile of broken plastic. It is also the only version where our name comes out of this meaning what it meant.',
            choices: [
                {
                    text: 'Buy them off the shelves.',
                    effects: [
                        { kind: 'capital', amount: -3_100_000 },
                        { kind: 'brand', amount: -2 },
                        { kind: 'dial', dial: 'publicReputation', delta: 4 },
                    ],
                },
                {
                    text: 'No. Stop the warranty.',
                    effects: [
                        { kind: 'brand', amount: -7 },
                        { kind: 'dial', dial: 'publicReputation', delta: -4 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  10. THE INQUIRY
// ============================================================================
//  Arthur again, and this one is about the thing he has been right about for
//  four hundred lines of his own arc: paperwork.
// ============================================================================
export const crisisInquiry: Conversation = {
    id: 'event-crisis-inquiry',
    channel: 'mail',
    from: 'cfo',
    subject: 'Correspondence from the Directorate',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'We have a request for information covering four years of supplier payments. It is a request rather than a demand, which is the only thing about it that is good news.\n\nComplying properly will occupy my department for a quarter and turn up things neither of us has thought about since before your father died.',
            choices: [
                { text: 'Give them exactly what they asked for.', next: 'exactly' },
                { text: 'Give them everything.', next: 'everything' },
            ],
        },
        {
            id: 'exactly',
            speaker: 'cfo',
            text: 'The narrow answer. It is cheaper, it is entirely proper, and it produces a second request in about five months that is a demand rather than a request.\n\nI have watched this go both ways. I have never seen the narrow answer end it.',
            choices: [
                {
                    text: 'Narrow. Nothing they did not ask for.',
                    effects: [
                        { kind: 'capital', amount: -600_000 },
                        { kind: 'brand', amount: -3 },
                        { kind: 'dial', dial: 'cfoTrust', delta: -5 },
                    ],
                },
                { text: 'Then give them everything.', next: 'everything' },
            ],
        },
        {
            id: 'everything',
            speaker: 'cfo',
            text: 'Four years, unredacted, with a covering letter I will write myself.\n\nIt will cost us a quarter of my department and it will find at least two things I would rather it did not. I would still do it, and I am aware that is easy for me to say.',
            choices: [
                {
                    text: 'Everything. Write the letter.',
                    effects: [
                        { kind: 'capital', amount: -2_200_000 },
                        { kind: 'brand', amount: -1 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 8 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  11. THE OUTAGE
// ============================================================================
export const crisisOutage: Conversation = {
    id: 'event-crisis-outage',
    channel: 'message',
    from: 'cto',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Every unit we have shipped in two years stopped working at 04:12 this morning. A certificate expired. Ours.\n\nThe fix is twenty minutes of work and about nine hours of it reaching people, because they have to be connected to get it and a lot of them are not.',
            choices: [
                { text: 'Twenty minutes?', next: 'twentyMinutes' },
                { text: 'Just get it out.', next: 'getItOut' },
            ],
        },
        {
            id: 'twentyMinutes',
            speaker: 'cto',
            text: 'Twenty minutes to write. Two years to have noticed, which nobody did, including me, and the calendar reminder was set by somebody who left in 2019.\n\nI would rather you had that from me now than from a post-mortem in three weeks.',
            choices: [
                { text: 'Just get it out.', next: 'getItOut' },
                {
                    text: 'Ship it quietly. No announcement.',
                    effects: [
                        { kind: 'brand', amount: -6 },
                        { kind: 'dial', dial: 'publicReputation', delta: -3 },
                    ],
                },
            ],
        },
        {
            id: 'getItOut',
            speaker: 'cto',
            text: 'It is going out now. The question is what we say while it does, nine hours of silence, or nine hours of us explaining a certificate to people who do not want to know what one is.',
            choices: [
                {
                    text: 'Say what happened, in plain words.',
                    effects: [
                        { kind: 'brand', amount: -4 },
                        { kind: 'capital', amount: -300_000 },
                        { kind: 'dial', dial: 'publicReputation', delta: 3 },
                        {
                            kind: 'news',
                            headline: 'Hale devices offline for nine hours. The company blames an expired certificate.',
                        },
                    ],
                },
                {
                    text: 'Ship it quietly.',
                    effects: [
                        { kind: 'brand', amount: -6 },
                        { kind: 'dial', dial: 'publicReputation', delta: -3 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  12. ALLOCATION CUT
// ============================================================================
//  The quiet one. Nothing is on fire, nobody is hurt, no journalist is
//  calling - and it costs a quarter of production either way. Worth having in
//  a pack of twelve so that "crisis" does not come to mean "sirens".
// ============================================================================
export const crisisAllocation: Conversation = {
    id: 'event-crisis-allocation',
    channel: 'message',
    from: 'coo',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Our controller allocation has been cut by forty per cent for the next three quarters. No explanation and none is owed, we are on a standard contract and standard contracts say they can.\n\nSomebody bigger than us asked for more. That is the whole story.',
            choices: [
                { text: 'Buy on the spot market.', next: 'spot' },
                { text: 'Then we build forty per cent fewer.', next: 'fewer' },
            ],
        },
        {
            id: 'spot',
            speaker: 'coo',
            text: 'Available and roughly triple, and the brokers know exactly why we are calling.\n\nIt keeps every commitment we have made. It also puts a number in this year that will look insane in the accounts and perfectly sensible to anybody who was here.',
            choices: [
                {
                    text: 'Buy it. We keep our commitments.',
                    effects: [{ kind: 'capital', amount: -6_400_000 }],
                },
                { text: 'No. Build fewer.', next: 'fewer' },
            ],
        },
        {
            id: 'fewer',
            speaker: 'coo',
            text: 'Then I will decide which customers get theirs and which get a letter, and I will do it by contract size, because that is the only way to do it that I can defend afterwards.\n\nThe ones who get the letter will remember. They always do.',
            choices: [
                {
                    text: 'Do it by contract size.',
                    effects: [
                        // NO BRAND HIT, and that is the point of having this
                        // one in a pack of twelve. Nothing is on fire and no
                        // journalist is calling; what it costs is the shelf,
                        // for three quarters, because customers who were sent
                        // a letter bought something else. Two of the twelve
                        // charge in a currency other than the name on the box,
                        // or the pack is a slider with weather on it.
                        { kind: 'siege', category: 'Consumer', quarters: 3, pressure: 1.4 },
                    ],
                },
                {
                    text: '...buy on the spot market.',
                    effects: [{ kind: 'capital', amount: -6_400_000 }],
                },
            ],
        },
    ],
};

// ============================================================================
//  THE POOL
// ============================================================================
const crisis = (
    id: string,
    conversation: Conversation,
    headline: string,
    over: Partial<GameEvent> = {},
): GameEvent => ({
    id,
    when: conversation.when!,
    conversation,
    headline,
    ...USUAL,
    ...over,
});

export const crisisRansomwareEvent = crisis('crisis-ransomware', crisisRansomware,
    'Sector chatter about an intrusion at a mid-cap manufacturer.',
    { cooldown: undefined, priority: 5 });
export const crisisLeakEvent = crisis('crisis-leak', crisisLeak,
    'A security researcher posts about an exposed database. No company is named yet.',
    { cooldown: undefined });
export const crisisForcedRecallEvent = crisis('crisis-forced-recall', crisisForcedRecall,
    'The Directorate has opened a file on a consumer product defect.',
    // Not weather and not optional: it is the consequence of a decision the
    // player made, and it arrives once.
    { chance: 0.9, cooldown: undefined, priority: 5 });
export const crisisSupplierEvent = crisis('crisis-supplier', crisisSupplier,
    'A component supplier files. Three of its customers are understood to be exposed.',
    { cooldown: 8 });
export const crisisUnionEvent = crisis('crisis-union', crisisUnion,
    'A strike ballot passes at the Hale plant.', { priority: 4, cooldown: 16 });
export const crisisExecutiveEvent = crisis('crisis-executive', crisisExecutive,
    'A trade paper is understood to be preparing a story about a Hale executive.',
    { cooldown: undefined });
export const crisisPatentEvent = crisis('crisis-patent', crisisPatent,
    'Hale is named in a patent action brought by a non-practising entity.',
    { cooldown: 16 });
export const crisisAccidentEvent = crisis('crisis-accident', crisisAccident,
    'A serious injury is reported at the Hale plant. The line is stopped.',
    { priority: 5, cooldown: undefined });
export const crisisCounterfeitEvent = crisis('crisis-counterfeit', crisisCounterfeit,
    'Counterfeit units bearing the Hale name are circulating in the channel.',
    { cooldown: 20 });
export const crisisInquiryEvent = crisis('crisis-inquiry', crisisInquiry,
    'Regulators have requested four years of supplier records from Hale.',
    { cooldown: undefined });
export const crisisOutageEvent = crisis('crisis-outage', crisisOutage,
    'Hale devices stopped responding overnight. The cause is not yet public.',
    { priority: 4, cooldown: 10 });
export const crisisAllocationEvent = crisis('crisis-allocation', crisisAllocation,
    'Controller allocations tighten across the sector. Smaller buyers are cut first.',
    { cooldown: 8 });

export const CRISIS_CONVERSATIONS = [
    crisisRansomware, crisisLeak, crisisForcedRecall, crisisSupplier,
    crisisUnion, crisisExecutive, crisisPatent, crisisAccident,
    crisisCounterfeit, crisisInquiry, crisisOutage, crisisAllocation,
];

export const CRISIS_EVENTS = [
    crisisRansomwareEvent, crisisLeakEvent, crisisForcedRecallEvent,
    crisisSupplierEvent, crisisUnionEvent, crisisExecutiveEvent,
    crisisPatentEvent, crisisAccidentEvent, crisisCounterfeitEvent,
    crisisInquiryEvent, crisisOutageEvent, crisisAllocationEvent,
];
