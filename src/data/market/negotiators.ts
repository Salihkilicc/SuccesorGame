// src/data/market/negotiators.ts
//
// ============================================================================
//  FIVE PEOPLE WHO ANSWER A LETTER, AND FIVE WAYS OF SAYING NO
// ============================================================================
//
//  FOUR OF THE FIVE ALREADY EXISTED. That is the point of doing it this way
//  rather than inventing five strangers: Marisol Vane, Anders Køhl and Rui
//  Okonjo have been sitting in data/market/founders.ts since the acquisition
//  prompt, with traits, pet issues and two lines each. Marco Alvarez and
//  Nathan Vogel have had twenty prompts of story built on them. The
//  negotiation system inherits people the game has already spent months on,
//  and the personalities are consistent with how they behave on your board
//  afterwards, because it is the same file describing the same person.
//
//  ---------------------------------------------------------------------------
//  THEY DIFFER IN MECHANICS, NOT IN PROSE
//  ---------------------------------------------------------------------------
//  Five voices over one identical decision is a reskin. Each of these changes
//  what the negotiation IS:
//
//    VANE      asks for a seat and cannot be bought out of it. Refuse and she
//              is gone permanently - the only negotiator with no second
//              approach. She is not trading, she is placing a condition.
//
//    KØHL      asks for money and SPLITS THE DIFFERENCE once. The only one
//              where refusing the first number is the right opening move.
//
//    OKONJO    asks for money and RAISES IT if you agree. Meeting a Shark's
//              number tells him he asked for too little, which is the correct
//              inference and an infuriating one.
//
//    ALVAREZ   asks for nothing and says yes. To any subject, including the
//              one that is not a request.
//
//    VOGEL     does not negotiate. There is no reply that is a conversation.
//
//  Everyone else - forty listed companies - falls through to a generic board
//  chosen by risk. A generic outcome is a perfectly good outcome for a generic
//  purchase, and the same reasoning is already written into founders.ts.
// ============================================================================

import type { Negotiator, Demand, Subject } from '../../core/market/negotiation';
import { REFUSAL_THRESHOLD } from '../../core/market/mergers';
import { FOUNDER_BY_COMPANY } from './founders';

// ============================================================================
//  1. DR. MARISOL VANE — SkyNet AI
// ============================================================================
//  The Visionary. Her company burns money and has no product, so on any
//  ordinary reading she should be desperate to sell; she is not, and that is
//  the character. Her demand is a seat, because what she is protecting is not
//  her position but the lab, and she has watched what happens to research
//  departments after an acquisition.
//
//  SHE CANNOT BE BOUGHT OUT OF IT. Offering money instead is the same as
//  refusing, and refusing ends it forever. She is the one negotiator where
//  "we'll pay more" is not an answer to anything.
// ============================================================================
const vane: Negotiator = {
    id: 'tech_skynet',
    name: FOUNDER_BY_COMPANY.tech_skynet.name,
    trait: 'Visionary',
    // Slightly harder than her balance sheet suggests. She is not selling
    // because she is out of money; she would be selling because she is tired.
    shift: 0.05,
    subjectShift: {
        // Flattery works on her, and she would be annoyed to hear it.
        merger: -0.08,
        // A partnership is what she actually wants and she says so.
        partnership: -0.12,
        // Being told is the one thing that closes her completely.
        notice: 0.25,
    },
    ask: (): Demand => ({ kind: 'seat' }),
    onAnswered: 'withdraw',
    lines: {
        engage: 'I read it twice, which is more than I usually manage.\n\nI am not going to pretend the runway is longer than it is. You know what we spend and you know what we have sold, which is nothing, and I am aware those two facts have a date on them.',
        demandLine: 'One condition, and it is not money.\n\nI take a seat. Not for me, so that there is somebody in the room in three years when a quarter goes badly and the lab is the obvious thing to cut. I have watched this happen from the outside twice. I would like to be inside for it.',
        refuseLine: 'No. Not at that price and not at any other one, I have had this letter from better-funded people than you and the answer has been the same each time.',
        met: 'Then we are agreed, and I will be difficult about research for as long as you keep me.\n\nI did not build it to be owned. I built it to be finished.',
        rebuffed: 'Understood, and I would rather have a clear no than a slow one.\n\nDo not write again. I mean that without any heat, I will not be able to give you a different answer later, so there is no point either of us spending the postage.',
    },
};

// ============================================================================
//  2. ANDERS KØHL — VoltMotors
// ============================================================================
//  The Conservative, and the only negotiator who behaves like a negotiator.
//  He opens above what he will take, and if you say no he comes back once at
//  the midpoint - which makes refusing his first number the correct opening
//  move and makes him the one person here you can actually play.
//
//  He is also the only one who reads "merger of equals" and is insulted by it,
//  because he has done the arithmetic on what that phrase has ever meant.
// ============================================================================
const kohl: Negotiator = {
    id: 'ind_voltmotors',
    name: FOUNDER_BY_COMPANY.ind_voltmotors.name,
    trait: 'Conservative',
    shift: 0.03,
    subjectShift: {
        // There is no such thing and he can name six examples.
        merger: 0.10,
        // Twenty years of supply contracts. This is how he has met everyone.
        partnership: -0.10,
        notice: 0.15,
    },
    // Ten points, flat. He is not opportunistic and the number does not move
    // with how badly you want it - he asked for the same thing last time.
    ask: (): Demand => ({ kind: 'price', extraPremium: 0.10 }),
    onAnswered: 'split',
    lines: {
        engage: 'Thank you for writing plainly. Most of them do not.\n\nForty years without a bad quarter. I am not sentimental about ownership but I am about that record, and I would like to know it survives the paperwork.',
        demandLine: 'Ten points over the market, and I will tell you exactly why so you can argue with the reason rather than the number.\n\nThe business earns steadily and it will earn steadily under you. You are not rescuing anybody. Nobody pays a rescue price for a company that does not need rescuing.',
        refuseLine: 'No, and it is not about the price.\n\nYou are asking me to hand a working thing to somebody who has not yet shown me a quarter I would want to sign.',
        met: 'Good. Then it is done and I will not haggle further, which you may find unusual.',
        rebuffed: 'Then we are not far apart. Five points, and I will not come back a third time.\n\nI would rather close at a number I am slightly unhappy with than spend another quarter on letters.',
    },
};

// ============================================================================
//  3. RUI OKONJO — Streamify
// ============================================================================
//  The Shark, and his mechanic is the cruellest thing in the file: agreeing to
//  his number makes it go up.
//
//  It is not spite. Meeting an opening ask instantly is information, and the
//  information is that the ask was too low; he is doing what a Shark should do
//  with it. The counter is that refusing him works - he takes the original
//  number rather than lose the deal - so the correct play against him is the
//  exact opposite of the correct play against Køhl, and the player has to know
//  which man they are writing to.
// ============================================================================
const okonjo: Negotiator = {
    id: 'tech_streamify',
    name: FOUNDER_BY_COMPANY.tech_streamify.name,
    trait: 'Shark',
    // The easiest of the five to get to the table. He is always at the table.
    shift: -0.10,
    subjectShift: {
        // He enjoys it and does not believe a word of it.
        merger: -0.10,
        partnership: -0.05,
        // The only one of the five who is not offended by being told. It
        // tells him you are serious, which is all he wanted to establish.
        notice: 0.05,
    },
    // Scales with how badly you appear to need it. He reads resistance the
    // same way the engine does and prices himself off it.
    ask: (score: number): Demand => ({
        kind: 'price',
        extraPremium: Math.min(0.25, 0.15 + Math.max(0, score) * 0.15),
    }),
    onAnswered: 'raise',
    lines: {
        engage: 'Well, finally.\n\nI have been waiting for one of these for about two years and I had begun to worry it would be someone boring. Let us not do the part where we pretend either of us is reluctant.',
        demandLine: 'Fifteen over, give or take, and you should know that I picked the number by looking at how much you seem to want it rather than at what the company is worth.\n\nI am telling you that because you were going to work it out and I would rather be the one who said it.',
        refuseLine: 'Not today. Ask me in a bad quarter, mine or yours, either works.',
        met: 'You said yes very quickly.\n\nThat was a mistake and I am going to be honest about making you pay for it: the number has moved. Five more. Same company, same day, different information.',
        rebuffed: 'Fine. The original, then. I would rather have the deal than the argument.\n\nGood price. Congratulations to us both, one of us more than the other.',
    },
};

// ============================================================================
//  4. MARCO ALVAREZ — Planora
// ============================================================================
//  He asks for nothing. He says yes. He says yes to all four subjects,
//  INCLUDING the notice of intent, which is not a request and which he answers
//  as though it were a letter from a friend, because it is one.
//
//  There is no mechanic to beat here and that is the writing. Every other
//  negotiator in this file gives the player something to be clever about, and
//  the absence of it in this one should be the loudest thing on the screen.
//  The friendship dial is where the cost lands - see the store - and nothing
//  in his reply mentions it.
// ============================================================================
const alvarez: Negotiator = {
    id: 'tech_planora',
    name: 'Marco Alvarez',
    trait: 'Visionary',
    // Enough to guarantee he engages from any position, including one where
    // his company is larger than yours and the board maths says refuse.
    shift: -0.9,
    subjectShift: {},
    ask: (): Demand => ({ kind: 'none' }),
    onAnswered: 'none',
    lines: {
        engage: 'ha\n\nok so i read this on the train and had to read it again at the office because i thought i had made it up\n\nyes obviously yes. do you want me to sign something or is this the kind of thing where lawyers do it',
        demandLine: 'i dont want anything. what would i ask for\n\nyou gave me two hundred grand when nobody would take my calls. i am not going to sit here and negotiate points with you like we met at a conference',
        refuseLine: 'no worries at all, seriously. was a nice thing to be asked',
        met: 'ok\n\nim going to go and tell my wife and then i am going to feel strange about it for a while, but ok. thank you for asking me properly. you did not have to do that',
        rebuffed: 'all good! let me know if it comes back around\n\nsee you soon',
    },
};

// ============================================================================
//  5. NATHAN VOGEL — Pear
// ============================================================================
//  He does not negotiate. Every approach comes back as the same form, and it
//  is the same form he has been sending since the offer letter in year one:
//  a reference number, a template, an assistant's sign-off.
//
//  THE ONLY ROUTE TO HIM IS HOSTILE, AT THE CEILING. His shift is set so that
//  resistance always clears the threshold no matter how large the player gets
//  or how well they choose the subject, and the comment in cast.ts is the
//  reason: "the insult is the format". Being answered by a template is the
//  answer.
//
//  This is also the only negotiator whose refusal is not a dead end. Bidding
//  for Pear raises `movedOnPear`, which is what earns the midnight message in
//  data/events/pearEscalation.ts - the one time he ever breaks his own rule.
// ============================================================================
const vogel: Negotiator = {
    id: 'tech_pear',
    name: 'Nathan Vogel',
    trait: 'Shark',
    // Deliberately enormous. There is no company size, subject or run of good
    // quarters that gets Pear's board to the table, and that is a statement
    // about him rather than about the arithmetic.
    shift: 2,
    subjectShift: {},
    ask: (): Demand => ({ kind: 'none' }),
    onAnswered: 'none',
    lines: {
        engage: '',
        demandLine: '',
        refuseLine: 'Ref: CORP/UNSOL/2211-4\n\nWe acknowledge receipt of your correspondence.\n\nPear does not evaluate unsolicited proposals regarding its own share capital and does not maintain a process for doing so. No response beyond this acknowledgement should be expected, and none will follow.\n\nThis matter is now closed on our side.\n\nSent on behalf of Nathan Vogel',
        met: '',
        rebuffed: '',
    },
};

export const NEGOTIATORS: Negotiator[] = [vane, kohl, okonjo, alvarez, vogel];

// ============================================================================
//  EVERYBODY ELSE
// ============================================================================
//  Forty listed companies do not each need a biography. They get a board
//  chosen by risk, which is the same fallback founders.ts uses and for the
//  same stated reason.
//
//  THE REPUTATION FLOOR LIVES HERE, and that placement is the argument for it.
//  A dull, profitable, low-risk board is exactly who declines to be sold to a
//  man who has been in the papers - not out of principle but because their own
//  shareholders will ask. None of the five named people asks for it, because
//  each of them wants something more specific; the anonymous respectable board
//  is the one that wants you to be respectable.
// ============================================================================

const genericAsk = (risk: string) => (score: number): Demand => {
    // A struggling company wants out and does not add conditions.
    if (risk === 'High' || risk === 'Extreme') return { kind: 'none' };
    if (risk === 'Very Low' || risk === 'Low') {
        return { kind: 'reputation', floor: 60 };
    }
    // Medium, and deterministic on the score rather than on a die: a board
    // that barely engaged asks for something, one that was keen does not.
    return score < REFUSAL_THRESHOLD * 0.5
        ? { kind: 'none' }
        : { kind: 'price', extraPremium: 0.08 };
};

export const genericNegotiator = (targetId: string, risk: string): Negotiator => ({
    id: targetId,
    name: 'The Board',
    trait: risk === 'Low' || risk === 'Very Low' ? 'Conservative' : 'Visionary',
    shift: 0,
    subjectShift: {},
    ask: genericAsk(risk),
    onAnswered: 'none',
    lines: {
        engage: 'The board has considered your letter and is willing to continue the conversation.',
        demandLine: 'The board is willing to recommend the offer to shareholders, subject to the condition set out below.',
        refuseLine: 'The board has considered your letter and does not intend to pursue it. We do not expect to revisit this decision.',
        met: 'The condition is acceptable. The board will recommend the offer.',
        rebuffed: 'Then there is nothing further to discuss at this time.',
    },
});

export const negotiatorFor = (targetId: string, risk: string): Negotiator =>
    NEGOTIATORS.find(n => n.id === targetId) ?? genericNegotiator(targetId, risk);

/** Every subject shift for one person, named and generic together. */
export const shiftFor = (n: Negotiator, subject: Subject): number =>
    n.shift + (n.subjectShift[subject] ?? 0);
