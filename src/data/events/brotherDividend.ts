// src/data/events/brotherDividend.ts
//
// ============================================================================
//  THE BROTHER — the same demand, three temperatures
// ============================================================================
//
//  He wants cash out. He will always want cash out; fifteen percent of a
//  company that pays nothing is a number on a page. That does not change with
//  the relationship. What changes is what it sounds like, and the whole point
//  of this file is that the player can hear the dial.
//
//  Three events, one subject, mutually exclusive band gates:
//
//      COLD   (brotherTrust < 50)   through a lawyer, and the word "minute"
//      WARM   (50-74)               to your face, badly, and he knows it
//      CLOSE  (75+)                 like a brother, and it is worse
//
//  ---------------------------------------------------------------------------
//  WHY THREE EVENTS RATHER THAN ONE WITH BRANCHES
//  ---------------------------------------------------------------------------
//  A conversation has one opening card, and the opening card is the tone. A
//  single event with gated choices could change what the PLAYER may say and
//  not what he sounds like when he says the first thing, which is the entire
//  effect being aimed at. The duplication is five lines of trigger; the
//  content is supposed to differ, and that is the prompt.
//
//  The bands are exclusive, so exactly one is eligible in any quarter. If
//  trust moves between quarters the player gets a differently-tempered version
//  of a demand they already recognise, which is the cheapest possible way to
//  make a number legible without printing it.
//
//  ---------------------------------------------------------------------------
//  HE IS NEVER SAFE, AND THE WARM ONE IS THE DANGEROUS ONE
//  ---------------------------------------------------------------------------
//  The instinct is that high trust makes him harmless. That would make the
//  dial a difficulty slider and the character a puzzle to be solved once.
//
//  He is not lying at 80. He means it. He is sincere in the moment and
//  unreliable across time, and he does not experience those as contradictory -
//  so at CLOSE he tells you, warmly and unprompted, that he has been talking
//  to people he should not be talking to, because he genuinely cannot see why
//  that would bother you. The player gets better information and a worse
//  problem, and cannot even be angry about it without punishing honesty.
//
//  MECHANICALLY THIS IS NOT DECORATION. He is on the cap table as a Snake, so
//  brotherTrust IS his board vote, inverted (core/story/brother.ts). Warming
//  him up is not flavour; it is votes.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** He has to have something to be aggrieved about, and a company to bleed. */
const BASE = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'quarterAtLeast' as const, quarter: 8 },
];

const DIVIDEND = 2_000_000;

// ============================================================================
//  CALIBRATED AGAINST THE DRIFT, NOT BY FEEL
// ============================================================================
//  He is on the board, so his number already moves every quarter without the
//  player saying a word: a board demand met moves the others +3, one failed
//  moves them -5 (core/market/governance.ts). Over six quarters that is
//  thirty-odd points of ambient movement - measured, by playing it.
//
//  The first draft of this file used deltas of 4 to 8, which meant a scene
//  about whether to pay your own brother was worth about one quarter of
//  somebody else's board demand failing. The conversations would have been
//  seasoning on a number the player could not see moving.
//
//  So the decisions that are ABOUT HIM are worth two to three quarters of
//  drift, and the ordering carries meaning: paying willingly beats paying
//  under a requisition, and refusing to be told beats being told and
//  objecting to it.
// ============================================================================


// ============================================================================
//  COLD — he has stopped talking to you and started talking about you
// ============================================================================
export const brotherDividendCold: Conversation = {
    id: 'event-brother-dividend-cold',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            // Not shouting. Worse: procedural. He has learned the words and
            // he is using them at his brother.
            text: 'I have asked Farrow to write to the company, so you will get this properly on Monday, but I would rather you heard it from me.\n\nI am requisitioning an item for the next meeting. A distribution to shareholders. I have the fifteen percent to do it and I have checked that I do.',
            choices: [
                { text: 'You could have just asked me.', next: 'couldHaveAsked' },
                { text: 'Then I will see it on the agenda.', next: 'agenda' },
            ],
        },

        {
            id: 'couldHaveAsked',
            speaker: 'brother',
            // The line that tells you how far it has gone, and it is a
            // reasonable complaint delivered as an ultimatum.
            text: 'I asked you in March. I asked you in June. In September you sent me a link to the quarterly report.\n\nThis is what asking looks like when the asking stops working. It is not a threat, it is a procedure, and I would like the difference on the record.',
            choices: [
                { text: 'Two million. Fine.', next: 'paid' },
                { text: 'Then use the procedure.', next: 'agenda' },
            ],
        },

        {
            id: 'agenda',
            speaker: 'brother',
            text: 'I will.\n\nAnd when it fails — because it will fail, you have thirty-five and the room likes you this quarter — it will be in the minutes that I raised it and you refused it. Minutes last a very long time.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        // Two quarters of drift. A legal requisition against
                        // your own brother is not a -6 moment.
                        { kind: 'dial', dial: 'brotherTrust', delta: -12 },
                        { kind: 'flag', flag: 'brotherPlottedOpenly' },
                        {
                            kind: 'news',
                            headline: 'A shareholder requisition at Hale. Family sources describe the request as "routine".',
                        },
                    ],
                },
                { text: 'Two million. Take it.', next: 'paid' },
            ],
        },

        {
            id: 'paid',
            speaker: 'brother',
            // Paying him does not warm him up much. He got it by force and
            // both of them know what that means for next time.
            text: 'Thank you.\n\nI would like it noted that I had to do it this way, and that I did not enjoy it, and that I will do it this way again because it worked.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'capital', amount: -DIVIDEND },
                        // Below the warm branch's +12 on purpose: he got it
                        // by force and they both know what that means.
                        { kind: 'dial', dial: 'brotherTrust', delta: 10 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendColdEvent: GameEvent = {
    id: 'brother-dividend-cold',
    when: [...BASE, { kind: 'dialAtMost', dial: 'brotherTrust', band: 'low' }],
    chance: 0.45,
    cooldown: 6,
    conversation: brotherDividendCold,
    headline: 'A minority shareholder at Hale is understood to be pressing for a distribution.',
    priority: 2,
};

// ============================================================================
//  WARM — to your face, badly
// ============================================================================
//  The middle, and the most human of the three: he is asking, he is bad at
//  asking, and he keeps undercutting himself. This is the version where the
//  needle comes out, because a needle only works from someone close enough.
// ============================================================================
export const brotherDividendWarm: Conversation = {
    id: 'event-brother-dividend-warm',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Are you around this week? Nothing dramatic. I want to talk about a distribution and I would rather do it over a table than in a room with Farrow in it.\n\nDad used to do these things over lunch. He was better at it than either of us.',
            choices: [
                { text: 'How much?', next: 'howMuch' },
                { text: 'You can ask me on a phone, Julian.', next: 'onAPhone' },
            ],
        },

        {
            id: 'onAPhone',
            speaker: 'brother',
            text: 'I can. I just find it easier when I can see whether you have already decided.\n\nTwo million. Across all of us, so three hundred to me, which is not the point and I know it will sound like the point.',
            choices: [
                { text: 'It does sound like the point.', next: 'soundsLike' },
                { text: 'What is the point?', next: 'thePoint' },
            ],
        },

        {
            id: 'howMuch',
            speaker: 'brother',
            text: 'Two million across the register. Three hundred thousand of that is mine, which is a number small enough that you are about to tell me it is not worth the conversation.',
            choices: [
                { text: 'It is not worth the conversation.', next: 'soundsLike' },
                { text: 'What is the point, then?', next: 'thePoint' },
            ],
        },

        {
            id: 'thePoint',
            speaker: 'brother',
            // The real grievance, and it is legitimate. He is not asking for
            // money. He is asking to be a shareholder rather than a relative.
            text: 'That I own a piece of something and it has never once behaved like I own a piece of it.\n\nA dividend is the only thing a company does that says out loud "some of this is yours". Everything else it does says "some of this is his and you are related to him".',
            choices: [
                { text: 'Then we declare one.', next: 'paid' },
                { text: 'Not this year. I need the cash in the business.', next: 'notThisYear' },
            ],
        },

        {
            id: 'soundsLike',
            speaker: 'brother',
            // THE NEEDLE. Delivered gently, with a smile, and it is the
            // single cruellest line he has - because it is true, and because
            // it is dressed as a compliment to the dead man.
            text: 'I know.\n\nDad trusted you with all of it, you know. Every share of it. He must have thought very hard about that and decided I would be fine.\n\nAnd I am. I am fine. I just did not get a vote on being fine.',
            choices: [
                { text: 'That is not fair.', next: 'notFair' },
                { text: 'Then we declare one.', next: 'paid' },
            ],
        },

        {
            id: 'notFair',
            speaker: 'brother',
            text: 'No. It is not.\n\nI have been carrying that sentence around for a year looking for somewhere to put it and I am sorry it was you. There was only ever going to be you.',
            choices: [
                { text: 'We declare one.', next: 'paid' },
                { text: 'Not this year.', next: 'notThisYear' },
            ],
        },

        {
            id: 'notThisYear',
            speaker: 'brother',
            // He takes it well. He is not pretending to take it well - he
            // does take it well, and that is what makes the next quarter's
            // version of him confusing rather than predictable.
            text: 'All right.\n\nI mean that. I would rather be told no on a phone by my brother than yes on paper by a company. Ask me again in a year whether I still mean it.',
            choices: [
                {
                    text: 'I will.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 4 }],
                },
                {
                    text: 'You will not have to ask.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 7 }],
                },
            ],
        },

        {
            id: 'paid',
            speaker: 'brother',
            text: 'Thank you. Genuinely.\n\nI will spend some of it on something stupid so that you can be annoyed about it, which is the closest thing we have to a tradition.',
            choices: [
                {
                    text: 'Buy the boat.',
                    effects: [
                        { kind: 'capital', amount: -DIVIDEND },
                        { kind: 'dial', dial: 'brotherTrust', delta: 12 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendWarmEvent: GameEvent = {
    id: 'brother-dividend-warm',
    when: [
        ...BASE,
        { kind: 'dialAtLeast', dial: 'brotherTrust', band: 'high' },
        { kind: 'dialAtMost', dial: 'brotherTrust', band: 'high' },
    ],
    chance: 0.40,
    cooldown: 6,
    conversation: brotherDividendWarm,
    headline: 'Hale is understood to be reviewing its distribution policy.',
    priority: 2,
};

// ============================================================================
//  CLOSE — like a brother, and it is worse
// ============================================================================
//  He is warm, he is useful, he gives you something you could not get
//  anywhere else - and then mentions, in the same breath and without any
//  sense that it is a confession, that he has been having dinner with the
//  people who want to take the company off you.
//
//  He is not lying. He has not betrayed anybody. He simply does not
//  experience "I like my brother" and "I keep my options open" as being in
//  tension, and the player has to decide what to do with a person like that
//  while he is being nicer to them than anyone else in the game.
// ============================================================================
export const brotherDividendClose: Conversation = {
    id: 'event-brother-dividend-close',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Two things, one boring and one that I have been putting off.\n\nBoring first: I am not going to push on the dividend this year. The cash is doing more inside than it would in my account, and I can read a balance sheet now, which is entirely your fault.',
            choices: [
                { text: 'And the second thing?', next: 'second' },
                { text: 'You could have kept pushing.', next: 'keptPushing' },
            ],
        },

        {
            id: 'keptPushing',
            speaker: 'brother',
            text: 'I could. Farrow thinks I should. Farrow thinks I should do a lot of things and I have started noticing that all of them end with Farrow billing me.\n\nSecond thing.',
            choices: [
                { text: 'Go on.', next: 'second' },
            ],
        },

        {
            id: 'second',
            speaker: 'brother',
            // Delivered as a favour, and it IS a favour, and it is also the
            // sentence that should make the player's stomach drop.
            text: 'I have had dinner with Halberd twice this year.\n\nBefore you say anything — I am telling you, which is the whole reason I am telling you. They approach me about every eight months and I would rather you heard the number from me than wondered.',
            choices: [
                { text: 'What do they want?', next: 'whatWant' },
                { text: 'Twice.', next: 'twice' },
            ],
        },

        {
            id: 'twice',
            speaker: 'brother',
            // He is genuinely puzzled by the objection. This is the character
            // in one exchange: no guilt, because in his own account he has
            // done nothing.
            text: 'Twice. It was dinner, not a transaction.\n\nI am allowed to have dinner. I would be a strange sort of shareholder if I refused to hear what my own stake is worth to somebody else.',
            choices: [
                { text: 'You would be a normal sort of brother.', next: 'normalBrother' },
                { text: 'What do they want?', next: 'whatWant' },
            ],
        },

        {
            id: 'normalBrother',
            speaker: 'brother',
            // The one moment he almost sees it. He does not, and it is not
            // played as villainy - it is played as a blind spot he has had
            // his whole life and nobody has ever made him look at.
            text: 'That is not fair.\n\nI have never once done anything with it. Not once. I have sat in restaurants and let men tell me things and then I have come and told you, and you are looking at the restaurants.',
            choices: [
                { text: 'What did they tell you?', next: 'whatWant' },
            ],
        },

        {
            id: 'whatWant',
            speaker: 'brother',
            // The information is real and valuable, which is exactly the
            // problem: refusing him costs the player something concrete.
            text: 'They are not buying. They are lending — to somebody else who wants to buy, and they were fishing for whether the family would split if it came to a vote.\n\nI told them the family is one vote. Which is true, and which I am now aware I said without asking you.',
            choices: [
                {
                    text: 'Thank you for telling me.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: 11 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'flag', flag: 'moleUnlocked' },
                        {
                            kind: 'news',
                            headline: 'Halberd Partners is said to be sounding out shareholders in the sector.',
                        },
                    ],
                },
                {
                    text: 'Do not have dinner with them again.',
                    next: 'doNotAgain',
                },
            ],
        },

        {
            id: 'doNotAgain',
            speaker: 'brother',
            // He agrees. He means it. He will do it again, and he will tell
            // you again, and he will not understand why that is not enough.
            text: 'All right.\n\nI will say yes to that and we both know I will pick up the phone if it rings, because it is my fifteen percent and nobody has ever pretended otherwise.\n\nBut I will tell you. That is the bit I can actually promise.',
            choices: [
                {
                    text: 'Then tell me.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: 5 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'flag', flag: 'moleUnlocked' },
                    ],
                },
                {
                    text: 'That is not a promise.',
                    effects: [
                        // Refusing him here is entirely reasonable and it
                        // costs the player the channel. He does not get angry;
                        // he just stops volunteering.
                        { kind: 'dial', dial: 'brotherTrust', delta: -13 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendCloseEvent: GameEvent = {
    id: 'brother-dividend-close',
    when: [...BASE, { kind: 'dialAtLeast', dial: 'brotherTrust', band: 'extreme' }],
    chance: 0.40,
    cooldown: 8,
    conversation: brotherDividendClose,
    headline: 'Family shareholders at Hale are described as aligned.',
    priority: 2,
};
