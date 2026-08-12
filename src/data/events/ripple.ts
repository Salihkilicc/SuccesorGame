// src/data/events/ripple.ts
//
// ============================================================================
//  SIX PEOPLE WHO WANTED THE THING YOU JUST BOUGHT
// ============================================================================
//
//  See core/market/ripple.ts for the arithmetic. In short: an acquisition in
//  this game has always been a private transaction between the player and a
//  board, and that is the one thing about buying a company that is never true.
//
//  ---------------------------------------------------------------------------
//  ONE DECISION AND IT IS NOT THE TERRITORY ONE
//  ---------------------------------------------------------------------------
//      PAY     a retention package now, priced off the target's own annual
//              earnings. Cash, immediately, and nothing afterwards.
//      ABSORB  they take the people. That deal's synergy is permanently cut -
//              to a half by a rival, to seven tenths by a fund's note.
//
//  Cash-now against permanent-degradation, which is a different trade from the
//  incumbent letters (recurring against temporary). And the defence is
//  DELIBERATELY NOT WORTH IT ON A SPREADSHEET - it pays back in about ten
//  years. It is worth it only if you intend to still be holding this company
//  in a decade, and the player has to decide whether they are that person
//  while the letter is still open.
//
//  ---------------------------------------------------------------------------
//  NOBODY NEW IS INVENTED
//  ---------------------------------------------------------------------------
//  All six writers are people the game already has: the four market incumbents
//  from the territory letters, and Halberd twice. That is the whole reason for
//  choosing these six companies - a ripple is only interesting if the person
//  on the other end is somebody the player already has an opinion about.
//
//  The four rivals write like rivals: they have somewhere to put the engineers
//  on Monday. The two vulture letters are about companies that were VISIBLY
//  dying, because a fund circling a healthy business is not a vulture, it is
//  just a buyer.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

// ---------------------------------------------------------------------------
//  THESE SCENES CARRY NO NUMBERS AT ALL
// ---------------------------------------------------------------------------
//  The first draft did. Each letter stated its own retention cost in dollars
//  and its own damage as a fraction, and the audit caught it sideways - it
//  reported two unused helpers in core/market/ripple.ts, which was the correct
//  diagnosis: if the scenes are naming the numbers then the functions that
//  compute them properly have nothing to do.
//
//  And the hardcoded figures were wrong in the way a hardcoded figure always
//  is here. Retention is priced off the TARGET'S ANNUAL EARNINGS, which a
//  scene cannot possibly know - it varies with what was bought, at what price,
//  in which quarter. Six letters each guessing a plausible-looking six-figure
//  sum is six wrong numbers.
//
//  So both effects name a company and stop. The engine looks up who is angry,
//  what that costs and what it damages.
// ---------------------------------------------------------------------------

const absorb = (company: string) => [
    { kind: 'raid' as const, company },
];

const pay = (company: string) => [
    { kind: 'retention' as const, company },
    { kind: 'flag' as const, flag: 'paidToKeepThem' as const },
];

// ============================================================================
//  1. VOLTMOTORS — Edison Motors wanted the batteries
// ============================================================================
const VOLT: Condition[] = [{ kind: 'flag', flag: 'boughtVoltmotors' }];

export const rippleVoltmotors: Conversation = {
    id: 'event-ripple-voltmotors',
    channel: 'mail',
    from: 'edison',
    subject: 'Congratulations',
    when: VOLT,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'edison',
            // He is not angry. He is doing arithmetic out loud, and the
            // arithmetic is about your people.
            text: 'Congratulations. I mean it — I had a folder on that company for six years and you closed it in a quarter, which is faster than my board has ever moved on anything.\n\nAnders and I have had dinner twice a year since 1998. He rang me the night it was signed, before he rang his own people, which tells you something about both of us.\n\nI am going to hire his cell engineers. I wanted you to hear it from me rather than from an exit interview.',
            choices: [
                { text: 'They are under contract.', next: 'contract' },
                { text: 'What would stop you?', next: 'stop' },
            ],
        },
        {
            id: 'contract',
            speaker: 'edison',
            text: 'Nine of them are. The other thirty-one signed the standard form, which our lawyers wrote in 1994 and which has never once survived a courtroom in this state.\n\nAnd the nine will go anyway and pay the penalty, because I will pay it for them. That is not clever. It is just a line in a budget I already have.',
            choices: [
                { text: 'What would stop you?', next: 'stop' },
                {
                    text: 'Then take them.',
                    effects: absorb('ind_voltmotors'),
                },
            ],
        },
        {
            id: 'stop',
            speaker: 'edison',
            // The honest answer, given plainly, including the part where it is
            // a bad deal on paper.
            text: 'Money, in their hands, this quarter. Not a raise — a retention package with a number on it that makes leaving embarrassing.\n\nIt will cost you more than the synergy is worth for about a decade. I am telling you that because you will work it out anyway and I would rather you heard the real version: you are not buying a return, you are buying the thing you thought you had bought in the first place.',
            choices: [
                {
                    text: 'Pay them.',
                    effects: pay('ind_voltmotors'),
                },
                {
                    text: 'Then take them.',
                    effects: absorb('ind_voltmotors'),
                },
            ],
        },
    ],
};

export const rippleVoltmotorsEvent: GameEvent = {
    id: 'ripple-voltmotors',
    when: VOLT,
    chance: 0.85,
    conversation: rippleVoltmotors,
    headline: 'Edison Motors is recruiting battery engineers. The timing is being noticed.',
    priority: 3,
};

// ============================================================================
//  2. STREAMIFY — Pear had been buying that shelf for a decade
// ============================================================================
const STREAMIFY: Condition[] = [{ kind: 'flag', flag: 'boughtStreamify' }];

export const rippleStreamify: Conversation = {
    id: 'event-ripple-streamify',
    channel: 'mail',
    from: 'pear',
    subject: 'Ref: CORP/HR/1180-9',
    when: STREAMIFY,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            // A form. The insult is the format, as always with him - and this
            // time the form is an HR notification about your own staff.
            text: 'This is a courtesy notification issued under our standard hiring protocol.\n\nBetween the fourteenth and the twenty-second, offers were extended to eleven individuals presently employed by an entity in which you hold a controlling interest. Seven have been accepted. The remaining four are under consideration.\n\nNo further correspondence is required.',
            choices: [
                { text: 'You did this within a week of the deal closing.', next: 'week' },
                { text: 'What stops the other four?', next: 'stop' },
            ],
        },
        {
            id: 'week',
            speaker: 'pear',
            // Two sentences, and the second one is the whole man.
            text: 'The offers were drafted in March.\n\nWe have been recruiting from that company for four years and it did not seem worth interrupting the process because the letterhead had changed.',
            choices: [
                { text: 'What stops the other four?', next: 'stop' },
                {
                    text: '(close the file)',
                    effects: absorb('tech_streamify'),
                },
            ],
        },
        {
            id: 'stop',
            speaker: 'pear',
            text: 'Money. We are not offering an unusual amount and you would not have to either.\n\nI would add, without any expectation that it will be received as intended, that Mr Okonjo has been forwarding our recruiters his own team\'s details since about 2019. Whatever you paid him, part of it was for a list he had already given away.',
            choices: [
                {
                    text: 'Match it. All four.',
                    effects: pay('tech_streamify'),
                },
                {
                    text: '(close the file)',
                    effects: absorb('tech_streamify'),
                },
            ],
        },
    ],
};

export const rippleStreamifyEvent: GameEvent = {
    id: 'ripple-streamify',
    when: STREAMIFY,
    chance: 0.85,
    conversation: rippleStreamify,
    headline: 'Seven senior hires move from Streamify to Pear in a fortnight.',
    priority: 3,
};

// ============================================================================
//  3. NOVIDIA — the lab that depends on the chips watches somebody else buy them
// ============================================================================
const NOVIDIA: Condition[] = [{ kind: 'flag', flag: 'boughtNovidia' }];

export const rippleNovidia: Conversation = {
    id: 'event-ripple-novidia',
    channel: 'mail',
    from: 'openai',
    subject: 'Following the announcement',
    when: NOVIDIA,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'openai',
            // Scheduling language about a catastrophe, which is her register.
            text: 'We were at four hundred and ten million and moving. You were at whatever you paid and you had it signed on a Thursday.\n\nI am not going to pretend to be gracious about it. Sixty per cent of what we run is fabricated in that building and it now belongs to somebody whose interests are not ours, which is a sentence I have spent two years making sure I would never have to write.\n\nThe process design team is forty-one people. I am going to take as many of them as will come.',
            choices: [
                { text: 'You need that plant running.', next: 'needIt' },
                { text: 'Name your price for leaving them alone.', next: 'price' },
            ],
        },
        {
            id: 'needIt',
            speaker: 'openai',
            // She agrees, and then explains why that does not save you.
            text: 'I do. The plant will keep running — you will keep selling to us because the alternative is a very expensive empty fab, and I will keep buying because the alternative is stopping.\n\nThat is why I am taking the design team rather than the line. You will have the building and the orders. The next generation will be designed in my building instead, and in four years the one in yours will be a place where old chips are made well.',
            choices: [
                { text: 'Name your price for leaving them alone.', next: 'price' },
                {
                    text: 'Then take them.',
                    effects: absorb('tech_chip'),
                },
            ],
        },
        {
            id: 'price',
            speaker: 'openai',
            text: 'There is no price payable to me. There is a price payable to them, and it is large, and I am the reason it is large.\n\nPay it if you intend to own a chip company. Do not pay it if you intend to own a chip factory. They are different assets and only one of them was worth what you paid.',
            choices: [
                {
                    text: 'We are keeping the design team.',
                    effects: pay('tech_chip'),
                },
                {
                    text: 'A factory is a fine thing to own.',
                    effects: absorb('tech_chip'),
                },
            ],
        },
    ],
};

export const rippleNovidiaEvent: GameEvent = {
    id: 'ripple-novidia',
    when: NOVIDIA,
    chance: 0.85,
    conversation: rippleNovidia,
    headline: 'OpenAI-ish opens a process design centre. Recruiters are working one address.',
    priority: 3,
};

// ============================================================================
//  4. BIOGEN START — the committee chair, being scrupulously fair
// ============================================================================
//  Her ripple is the same shape as her territory letter: nothing punitive,
//  nothing deniable, nobody to be angry at. She simply mentions that the
//  people in question have somewhere better to be.
// ============================================================================
const BIOGEN: Condition[] = [{ kind: 'flag', flag: 'boughtBiogen' }];

export const rippleBiogen: Conversation = {
    id: 'event-ripple-biogen',
    channel: 'mail',
    from: 'swanson',
    subject: 'A courtesy, and an apology in advance',
    when: BIOGEN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'swanson',
            text: 'I had a term sheet with that company. It was worse than yours and it was going to be signed in November, and I am not writing to complain about being outbid — that is the process working.\n\nI am writing because their four principal investigators hold their trial slots personally rather than institutionally. That is normal in this field and it is about to be inconvenient for you.\n\nTwo have already asked me whether the slots travel. They do.',
            choices: [
                { text: 'You are taking my trials.', next: 'takingTrials' },
                { text: 'Can they be persuaded to stay?', next: 'stay' },
            ],
        },
        {
            id: 'takingTrials',
            speaker: 'swanson',
            // The most infuriating paragraph she has, because it is accurate.
            text: 'I am not taking anything. I have answered a question two people asked me, truthfully, and I would have given you the same answer.\n\nIf they leave, they will leave with the queue positions they earned by being who they are. You did not buy those. There was no line for them on the schedule and there could not have been.',
            choices: [
                { text: 'Can they be persuaded to stay?', next: 'stay' },
                {
                    text: 'Then there is nothing to discuss.',
                    effects: absorb('health_bio'),
                },
            ],
        },
        {
            id: 'stay',
            speaker: 'swanson',
            text: 'Yes, and not by me. Give them budget, and equipment, and a decade — investigators do not move for money, they move because somebody senior stopped answering their emails.\n\nIt will cost more than it looks like it should. What you would be buying is the eighteen months of trust their last employer had already paid for and did not get to keep.',
            choices: [
                {
                    text: 'Fund all four. Properly.',
                    effects: pay('health_bio'),
                },
                {
                    text: 'They can go.',
                    effects: absorb('health_bio'),
                },
            ],
        },
    ],
};

export const rippleBiogenEvent: GameEvent = {
    id: 'ripple-biogen',
    when: BIOGEN,
    chance: 0.85,
    conversation: rippleBiogen,
    headline: 'Two BioGen investigators are in discussions with Johnson & Swanson.',
    priority: 3,
};

// ============================================================================
//  5. SKYNET AI — the fund that was waiting for her runway to end
// ============================================================================
//  The first of the two vultures, and the difference is audible: Halberd is
//  not hurt and is not competing. They lost a trade, they are cheerful about
//  it, and they are going to publish the arithmetic.
// ============================================================================
const SKYNET: Condition[] = [{ kind: 'flag', flag: 'boughtSkynet' }];

export const rippleSkynet: Conversation = {
    id: 'event-ripple-skynet',
    channel: 'mail',
    from: 'vulture',
    subject: 'Note to clients — enclosed for your information',
    when: SKYNET,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'vulture',
            // Genuinely warm about your disaster, which is the whole character.
            text: 'Well played, and I am not being sarcastic — we had that company down for the first quarter of next year at roughly a third of what you paid, and you have cost us a very enjoyable eighteen months.\n\nWe circulate a note to clients when a situation we were tracking resolves. Yours is attached. It is eleven pages and the phrase "strategic premium" appears in it four times, each time in quotation marks.\n\nI am sending it to you first as a courtesy. It goes out Thursday either way.',
            choices: [
                { text: 'Publish it. Nobody reads your notes.', next: 'nobodyReads' },
                { text: 'What is in it?', next: 'whatsInIt' },
            ],
        },
        {
            id: 'whatsInIt',
            speaker: 'vulture',
            // The note is not a threat to the player. It is a threat to the
            // acquired company's staff, which is the mechanic.
            text: 'Nothing untrue, which is the difficulty. Her burn rate, her cash on the day you signed, the two funding conversations that had already failed, and what those two facts together say about the price.\n\nOur clients will find it interesting. Her researchers will find it devastating — most of them accepted equity in a company they believed had eighteen months, and the note explains that it had four. People do not stay somewhere they have just read about.',
            choices: [
                { text: 'What stops it?', next: 'stops' },
                {
                    text: 'Send it, then.',
                    effects: absorb('tech_skynet'),
                },
            ],
        },
        {
            id: 'nobodyReads',
            speaker: 'vulture',
            text: 'Four thousand people read them and about nine hundred of those work in your industry. But you are right that it is not the readers who matter.\n\nIt is that her people will read it, and it will be the first honest description of their own company any of them has seen.',
            choices: [
                { text: 'What stops it?', next: 'stops' },
                {
                    text: 'Send it, then.',
                    effects: absorb('tech_skynet'),
                },
            ],
        },
        {
            id: 'stops',
            speaker: 'vulture',
            // He does not want to be bought off, and says so - which is the
            // only door he will not open, and it makes him more frightening
            // than the four rivals.
            text: 'Nothing you can pay me. I am not extorting you and I would like that on the record, because it is the sort of thing that gets misremembered.\n\nWhat I would do, in your position, is get to them before Thursday with something that makes the note read like history rather than like news. Money and a plan, in that order. It will be expensive and it will work, and I will lose nothing by telling you so.',
            choices: [
                {
                    text: 'Then we get there first.',
                    effects: pay('tech_skynet'),
                },
                {
                    text: 'Let them read it.',
                    effects: absorb('tech_skynet'),
                },
            ],
        },
    ],
};

export const rippleSkynetEvent: GameEvent = {
    id: 'ripple-skynet',
    when: SKYNET,
    chance: 0.85,
    conversation: rippleSkynet,
    headline: 'Halberd Partners circulates a client note on the SkyNet transaction.',
    priority: 3,
};

// ============================================================================
//  6. PLANORA — the same letter, about your friend
// ============================================================================
//  Identical machinery to SkyNet and it should not read identically at all.
//  Halberd is exactly as cheerful, exactly as accurate, and this time the
//  numbers are about a man whose company only survived because the player
//  wrote him a cheque in the bad quarter.
//
//  It does not mention the friendship and must not. The player supplies that.
// ============================================================================
const PLANORA: Condition[] = [{ kind: 'flag', flag: 'boughtPlanora' }];

export const ripplePlanora: Conversation = {
    id: 'event-ripple-planora',
    channel: 'mail',
    from: 'vulture',
    subject: 'Note to clients — enclosed for your information',
    when: PLANORA,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'vulture',
            text: 'A small one, this, but we do the note regardless — the discipline is the product.\n\nWe had been watching Planora since the year they nearly went under. Lovely software, no pricing power, and a founder who is much better at the product than at the rest of it. We expected to buy it in about three years for very little.\n\nThe note goes out Thursday.',
            choices: [
                { text: 'It is a small company. Leave it alone.', next: 'small' },
                { text: 'What is in it?', next: 'whatsInIt' },
            ],
        },
        {
            id: 'small',
            speaker: 'vulture',
            // The line that makes this different from the SkyNet letter,
            // arriving as an aside he does not think is significant.
            text: 'Everything is a small company until it is not, and we have been wrong about that often enough to stop making exceptions.\n\nOne thing I will say, and it is not a negotiating position: the two hundred thousand dollars that kept them open in the bad year came from an account we could not identify at the time. We can now, obviously — it is in the note as a related-party disclosure. Two lines, entirely factual, and it will be the first thing anybody asks him about for a year.',
            choices: [
                { text: 'What stops it?', next: 'stops' },
                {
                    text: 'Send it.',
                    effects: absorb('tech_planora'),
                },
            ],
        },
        {
            id: 'whatsInIt',
            speaker: 'vulture',
            text: 'Their margins, their churn, and the fact that they were nine weeks from closing in the spring of the bad year and were rescued by a single private cheque.\n\nThat last part is a related-party disclosure. It is two lines and it is entirely factual, and his engineers will read it as an explanation of why he sold to you rather than to anybody else.',
            choices: [
                { text: 'What stops it?', next: 'stops' },
                {
                    text: 'Send it.',
                    effects: absorb('tech_planora'),
                },
            ],
        },
        {
            id: 'stops',
            speaker: 'vulture',
            text: 'Same answer as always: nothing I can be paid.\n\nGet to his people first. Tell them what you intend to do with it, put money behind the sentence, and the note becomes a piece of trivia about a company that is obviously fine.\n\nHe will not think to do it himself. That is not a criticism of him.',
            choices: [
                {
                    text: 'We get there first.',
                    effects: pay('tech_planora'),
                },
                {
                    text: 'He can handle it.',
                    effects: absorb('tech_planora'),
                },
            ],
        },
    ],
};

export const ripplePlanoraEvent: GameEvent = {
    id: 'ripple-planora',
    when: PLANORA,
    chance: 0.85,
    conversation: ripplePlanora,
    headline: 'A Halberd client note names Planora, and a private loan made three years ago.',
    priority: 3,
};

export const RIPPLE_CONVERSATIONS = [
    rippleVoltmotors, rippleStreamify, rippleNovidia,
    rippleBiogen, rippleSkynet, ripplePlanora,
];

export const RIPPLE_EVENTS = [
    rippleVoltmotorsEvent, rippleStreamifyEvent, rippleNovidiaEvent,
    rippleBiogenEvent, rippleSkynetEvent, ripplePlanoraEvent,
];
