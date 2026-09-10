// src/data/events/payoffs.ts
//
// ============================================================================
//  A YEAR LATER, THE THING YOU PAID FOR
// ============================================================================
//
//  WHAT WAS MISSING. Across the whole conversation system there were forty one
//  money effects and exactly one of them went the player's way. Every
//  opportunity in corporateOps.ts was a purchase: you paid three per cent of
//  the company for an automation line, you got reputation, and the money never
//  came back. So the pack the game calls its opportunities was a drain with
//  better manners than the crises.
//
//  Reported as "sohbetlerde ceza ve kazanclari dengeleyelim, kazanc da lazim,
//  hep ceza".
//
//  ---------------------------------------------------------------------------
//  IT ARRIVES AS A PERSON, NOT AS A NUMBER
//  ---------------------------------------------------------------------------
//  The cheap version is to make the original choice pay more brand, or to hand
//  the money back on the spot. Both are worse than nothing: paying you
//  immediately makes the decision free, and paying you in reputation means the
//  answer to "where did my money go" is still nowhere.
//
//  So the payoff is a LETTER, four quarters later, from whoever you gave the
//  money to. The COO tells you what the line did. The CTO tells you who
//  licensed it. That is the same argument neglect.ts makes about penalties -
//  a consequence that arrives from a human being is a consequence, and one
//  that arrives from a hidden counter is a mood swing.
//
//  ---------------------------------------------------------------------------
//  AND IT IS SCHEDULED, WHICH MAKES IT A REAL DECISION
//  ---------------------------------------------------------------------------
//  A year is a long time in a game where a bad quarter can end you. Early on,
//  three per cent of a small company is money you may need before the letter
//  comes; late on it is obviously worth taking, and by then you have other
//  problems. The waiting is the cost, exactly as it is with capital
//  expenditure in the world.
//
//  The figures live in core/story/prices.ts alongside the costs they answer,
//  because a return that quietly drifted below its own price would turn this
//  pack back into a drain and nothing on screen would say so.
//
//  NO CHOICES WITH EFFECTS BEHIND THEM. Each of these is one node, one
//  acknowledgement, and the money. There is nothing to decide - the deciding
//  happened a year ago, which is the point being made.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

// ============================================================================
//  1. THE LINE, RUNNING
// ============================================================================
export const opsAutomationPayoff: Conversation = {
    id: 'event-payoff-automation',
    channel: 'mail',
    from: 'coo',
    subject: 'A year of the new line',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Twelve months on the new tooling. I said I would send you the numbers when I had a year of them.\n\nScrap is down by a bit under a third and we have stopped paying the weekend shift to make up for Tuesdays. Netted off against what it cost to put in, the line has returned {opsAutomationReturn}.\n\nI am not going to pretend I would have signed it myself at the time.',
            choices: [
                {
                    text: 'Noted. Send me the same note next year.',
                    effects: [
                        { kind: 'quoted', item: 'opsAutomationReturn' },
                        { kind: 'morale', amount: 2 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2. THE RATE YOU LOCKED, AGAINST A MARKET THAT DID NOT
// ============================================================================
export const opsLogisticsPayoff: Conversation = {
    id: 'event-payoff-logistics',
    channel: 'mail',
    from: 'coo',
    subject: 'The carrier contract, a year on',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Spot freight went up forty per cent in March and has not come back down. Everyone in the category is paying it.\n\nWe are not, because we signed a two year rate before any of that. The variance against what we would otherwise have paid is {opsLogisticsReturn}, and I have booked it as a saving rather than a windfall because that is what it is.\n\nOur competitors are having a considerably more interesting year than we are.',
            choices: [
                {
                    text: 'Good. Boring is the objective.',
                    effects: [
                        { kind: 'quoted', item: 'opsLogisticsReturn' },
                        { kind: 'brand', amount: 9 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  3. SOMEBODY WANTS TO USE IT
// ============================================================================
export const techPatentPayoff: Conversation = {
    id: 'event-payoff-patent',
    channel: 'mail',
    from: 'cto',
    subject: 'the filing',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Two of them came to us rather than round us, which is the entire reason to file rather than publish and I am aware I argued for publishing.\n\nFirst year of licence income is {techPatentReturn}. It is not a business, it is a rounding error with a nice shape, but it recurs and it means nobody in the category can build the obvious version without asking.\n\nI would like the same budget again, for the obvious reasons.',
            choices: [
                {
                    text: 'Ask me again when you have the next one.',
                    effects: [
                        { kind: 'quoted', item: 'techPatentReturn' },
                        { kind: 'brand', amount: 9 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  4. ONE OF THEM CAME BACK
// ============================================================================
export const cfoInvestorPayoff: Conversation = {
    id: 'event-payoff-investor',
    channel: 'mail',
    from: 'cfo',
    subject: 'Follow-on subscription',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'One of the funds from the dinner has subscribed. {cfoInvestorReturn}, at a valuation I did not have to argue for.\n\nThe board position is that this vindicates the spend. My own position is that we bought a year of their attention and they used it to do their own work, which arrived at the same place. Either way the money is in.\n\nThey will want a meeting in the autumn.',
            choices: [
                {
                    text: 'Put it in the diary.',
                    effects: [
                        { kind: 'quoted', item: 'cfoInvestorReturn' },
                        { kind: 'dial', dial: 'cfoTrust', delta: 2 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  EXPORT PACK
// ============================================================================
//  No GameEvents. Nothing here fires on a chance roll - each one is scheduled
//  by the choice that paid for it, which is what makes it a payoff rather than
//  a coincidence.
// ============================================================================
export const PAYOFF_CONVERSATIONS = [
    opsAutomationPayoff,
    opsLogisticsPayoff,
    techPatentPayoff,
    cfoInvestorPayoff,
];
