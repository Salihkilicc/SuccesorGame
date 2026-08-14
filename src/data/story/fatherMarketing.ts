// src/data/story/fatherMarketing.ts
//
// ============================================================================
//  QUARTER THREE — THE FIRST TIME HE IS OUT OF DATE
// ============================================================================
//
//  Up to here every mechanic he has cited has been exactly right, which is
//  what made the paranoia hard to dismiss. This is the scene where that stops
//  being uniformly true, and the crack has to be a REAL seam in the engine
//  rather than a decorative senior moment.
//
//  Three seams, and he falls into all three the same way a competent man from
//  an earlier market would:
//
//  1. HE THINKS A BUDGET IS AN ABSOLUTE NUMBER. It is not. The benchmark you
//     are measured against is the LARGER of the category floor and a quarter
//     of your own last-quarter revenue (attraction.ts, BENCHMARK_OF_REVENUE).
//     So the same spend gets quieter every quarter you grow. "Four hundred
//     thousand held the line for nine years" was true of a company that was
//     not growing. Told to a company that is, it is a slow leak.
//
//  2. HE THINKS ADVERTISING BUILDS THE BRAND. It does not - it moves you off
//     the line temporarily. Brand walks towards share x 43.3 and share pulls
//     it back (brand.ts, brandEquilibrium). What HOLDS brand is serving the
//     demand you created: servedRatio speeds the climb and, when it is poor,
//     accelerates the fall. He never mentions delivery, because in his market
//     demand was the scarce thing and capacity was not.
//
//  3. HE IS WATCHING THE WRONG COMPANY. He is fixed on Microhard - 24% share,
//     strength 85, genuinely large, and the incumbent who beat him once. Pear
//     is at 31% and rising and is the antagonist of the entire story. He
//     dismisses them as a shop that sells telephones to people who like the
//     shop. That is a good line and it is wrong, and the player has no way to
//     know that yet either.
//
//  ---------------------------------------------------------------------------
//  HE IS NOT WRONG. HE IS BEHIND.
//  ---------------------------------------------------------------------------
//  This distinction is the whole scene and it is easy to lose. Marketing does
//  matter - it is one of the five attraction factors and a product nobody has
//  heard of does not sell. A player who follows him spends real money and gets
//  a real, temporary effect. They are not punished; they are made slightly
//  less efficient than a player who also thinks about delivery.
//
//  If following him were a mistake, the year would resolve into "the old man
//  was wrong" and the question closes. It has to stay open.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';

// ---------------------------------------------------------------------------
//  IT HAD NO TIMING OF ITS OWN, AND NOW IT NEEDS SOME
// ---------------------------------------------------------------------------
//  This scene was delivered entirely by the q3-marketing lock, so the only
//  statement of when it arrives lived on the lock. That lock is shelved - its
//  lesson moved to the first quarter, where the hole it names is visible -
//  and the scene became an ordinary beat.
//
//  Without this it would have fired in the first quarter: a man telling the
//  player that competitors have been quietly taking share, three days into a
//  job, before a single quarter has been reported. The old lock's own gate is
//  what it says here, minus the money - reading a message costs nothing, and
//  the capital condition existed because CLEARING the lock meant spending.
// ---------------------------------------------------------------------------
const WHEN: Condition[] = [
    { kind: 'quarterAtLeast', quarter: 3 },
    { kind: 'noFlag', flag: 'fatherDead' },
];

export const fatherMarketing: Conversation = {
    id: 'father-marketing',
    channel: 'message',
    from: 'father',
    when: WHEN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            text: 'They are taking share off you. Not dramatically, half a point here, half a point there, the way it always goes, which is why nobody notices until it is four points.\n\nYou are not being beaten on the product. You are being beaten on being heard.',
            choices: [
                { text: 'Who is taking it?', next: 'who' },
                { text: 'Then we spend on marketing.', next: 'spend' },
            ],
        },

        {
            id: 'who',
            speaker: 'father',
            // THE WRONG RIVAL. Microhard is real, large and strong - 24% and
            // 85 strength - so this is not a foolish answer. It is simply the
            // answer of a man who stopped updating in about 2012.
            text: 'Microhard. It is always Microhard. They have been the wall in this market since before you could read, and every man who ever thought he had got past them found out he had been let past.\n\nWe were in three of their catalogues once. Then a purchasing director none of us had met retired, and the man who replaced him had his own people, and that was the end of eleven years of work. No meeting. No letter. The orders simply stopped arriving and we found out from the numbers.',
            choices: [
                { text: 'Pear is bigger than Microhard now.', next: 'pear' },
                { text: 'So what do we do about them?', next: 'spend' },
            ],
        },

        {
            id: 'pear',
            speaker: 'father',
            // He is fluent, confident, and wrong. Nothing in the scene
            // contradicts him - the player will find out from the share
            // numbers, or from the next eight years.
            text: 'Pear is a shop. A very good shop, that sells telephones to people who enjoy being in the shop, and one day those people will want a telephone instead.\n\nMicrohard sells to companies. Companies do not change their minds because a window display is nice. Watch the wall, not the weather.',
            choices: [
                { text: 'What do we do?', next: 'spend' },
                { text: 'The weather has thirty-one percent.', next: 'thirtyOne' },
            ],
        },

        {
            id: 'thirtyOne',
            speaker: 'father',
            // He does not argue with the number. He reinterprets it, which is
            // exactly what he did with the dates in the invoice scene - the
            // same move, and the player has now seen it twice.
            text: 'For now. I have watched three companies have thirty-one percent and I could not tell you the name of two of them without looking.\n\nShare is a photograph. It tells you where somebody was standing.',
            choices: [
                { text: 'What do we do?', next: 'spend' },
            ],
        },

        {
            id: 'spend',
            speaker: 'father',
            // SEAM 1. The number is his and it is fixed, and that is the
            // point: he is quoting an absolute from a company that was not
            // growing, to a company that is.
            text: 'You put money behind it and you leave it there. Not one quarter, every quarter. That part somebody will show you.\n\nFour hundred thousand held our line for nine years. I never once raised it and I never once had to.',
            choices: [
                { text: 'Nine years at the same number?', next: 'nineYears' },
                { text: 'And that builds the brand?', next: 'brand' },
            ],
        },

        {
            id: 'nineYears',
            speaker: 'father',
            // He hears the question as a compliment about his discipline. The
            // player has just handed him the exact fact that undoes his
            // advice - his company was flat - and he presents it as the moral.
            text: 'The same number. That is what discipline looks like, everyone else raised theirs in the good years and cut it in the bad ones, and their name went up and down with it.\n\nWe were the same size in 2014 as in 2005 and we were still there. Half of them were not.',
            choices: [
                { text: 'And that builds the brand?', next: 'brand' },
                { text: 'The same size for nine years.', next: 'sameSize' },
            ],
        },

        {
            id: 'sameSize',
            speaker: 'father',
            // The one moment he almost sees it. He does not, and it is not
            // played for pathos - he genuinely believes survival was the
            // achievement, and in his market it may well have been.
            text: 'Yes.\n\nYou say that like it is the criticism. Ask the men who grew.',
            choices: [
                { text: 'And the brand?', next: 'brand' },
            ],
        },

        {
            id: 'brand',
            speaker: 'father',
            // SEAM 2. Everything he says here is true of an era in which
            // demand was scarce and capacity was not. In this engine brand is
            // anchored to REALISED share - marketing lifts you off the line
            // and share pulls you back.
            text: 'It is the brand. A name is a promise people have heard often enough to believe, and you buy the hearing.\n\nGet loud enough for long enough and the name does the selling, and then you can charge what the name is worth rather than what the thing cost you.',
            choices: [
                { text: 'And if the orders come and we cannot build them?', next: 'cannotBuild' },
                { text: 'Setting a budget now.', next: 'close' },
            ],
        },

        {
            id: 'cannotBuild',
            speaker: 'father',
            // THE CRACK, and it is a shrug rather than an error. In a market
            // where demand was the scarce thing this was the correct
            // instinct. In this one it is how brand falls fastest - see
            // BRAND_FAILURE_PENALTY in core/market/brand.ts.
            text: 'Then you will have the best problem in business and you will complain about it like everyone else does.\n\nDemand first. Always demand first. The factory is a thing you can fix with money in a quarter; wanting is not.',
            choices: [
                { text: 'A customer who cannot buy goes elsewhere.', next: 'elsewhere' },
                { text: 'Setting a budget now.', next: 'close' },
            ],
        },

        {
            id: 'elsewhere',
            speaker: 'father',
            // He concedes the fact and keeps the conclusion. Not stupidity -
            // the ordering of the two costs really did reverse, and nobody
            // announces that to you.
            text: 'He does. And he comes back, because the name is still the name.\n\n...That was truer than it is. I will give you that one. It was still true enough for long enough that I would not build a factory on the strength of it being false.',
            choices: [
                { text: 'Setting a budget now.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'father',
            // Terminal. The last line is him being right again, immediately
            // after being out of date, which is the whole difficulty of him.
            text: 'Good.\n\nAnd watch what it buys you. Not the share next quarter, the share the quarter after, when the money has stopped and you find out whether anybody remembered.',
        },
    ],
};
