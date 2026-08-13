// src/data/story/fatherDeath.ts
//
// ============================================================================
//  END OF THE FIRST YEAR — HE DOES NOT GET A SPEECH
// ============================================================================
//
//  The instinct here is a deathbed scene: the old man, lucid at last, saying
//  the thing he could never say. Every version of that is worse than this one,
//  for a reason that is structural rather than a matter of taste.
//
//  The entire first year has been built on a question - is he right or is he
//  obsessed - and the player is supposed to carry that question for the rest
//  of the game. A last conversation ANSWERS it. If he is warm at the end, he
//  was a good man being difficult; if he is paranoid at the end, he was ill.
//  Either way the ambiguity dies with him and the next fifty years lose it.
//
//  So the last thing he says is an instruction about inventory, sent at
//  06:41, and then nothing. The CFO reports it, because that is who would.
//
//  ---------------------------------------------------------------------------
//  THE LOCKS COME OFF HERE
//  ---------------------------------------------------------------------------
//  Every tutorial lock carries `noFlag: fatherDead` in its canEngage, so
//  raising the flag lifts all of them at once - the teaching layer does not
//  fade out, it stops, because the man doing the teaching stopped. That was
//  designed three prompts ago and this is the scene that uses it.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const fatherDeath: Conversation = {
    id: 'father-death',
    channel: 'message',
    from: 'cfo',
    // The end of the fourth quarter, once. `currentQuarter` counts from one,
    // so the tick in which the first year closes is the fifth.
    when: [
        // ------------------------------------------------------------------
        //  THE SIXTH QUARTER, BECAUSE THE FIFTH WAS ALREADY HIS
        // ------------------------------------------------------------------
        //  It was five, and five is where the father's own queue was still
        //  draining. A message thread carries ONE conversation at a time and
        //  he has six for the first year, so a player who took a quarter or
        //  two to read them was getting the morale lesson and the phone call
        //  in the same tick: a man teaching you about your workforce, and the
        //  news that he is dead, in one sitting.
        //
        //  Everything behind it moved with it - Pear to seven, the condolence
        //  wave to eight. The act keeps its shape; it starts a quarter later.
        // ------------------------------------------------------------------
        { kind: 'quarterAtLeast', quarter: 6 },
        { kind: 'noFlag', flag: 'fatherDead' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            // The CFO of thirty years, being professional at the worst
            // possible moment because it is the only tool he has.
            text: 'I am very sorry. Your father died this morning, at home. It was quick, they think — he was found at his desk and the coffee was still warm.\n\nI have not told the floor yet. I wanted you to decide how.',
            choices: [
                { text: 'When did he last write to me?', next: 'lastWrote' },
                { text: 'Tell them yourself. I cannot do it today.', next: 'tellThem' },
            ],
        },

        {
            id: 'lastWrote',
            speaker: 'cfo',
            // The gut-punch, and it is a logistics note. Nothing is
            // underlined. The timestamp does the work.
            text: 'Six forty-one this morning. To both of us.\n\n"The Q4 inventory line does not match the floor count. Somebody has counted the returns twice. Do not sign it until this is sorted."\n\nThat is the last thing he wrote.',
            choices: [
                { text: 'Was he right?', next: 'wasHeRight' },
                { text: 'Tell the floor. I cannot do it today.', next: 'tellThem' },
            ],
        },

        {
            id: 'wasHeRight',
            speaker: 'cfo',
            // AND THE ANSWER IS YES. The last time the question is asked
            // while he is alive to have been right, he was - about something
            // small, which is the only scale he was ever reliably right on.
            // The player now cannot dismiss him, and cannot check him again.
            text: 'I went and counted them myself at eleven. Four hundred and six units, counted twice, in the returns column.\n\nHe was right. He was almost always right about the small things and I have never known what to do with that.',
            choices: [
                { text: 'Neither have I.', next: 'tellThem' },
            ],
        },

        {
            id: 'tellThem',
            speaker: 'cfo',
            text: 'I will do it at four, when the line stops. They will want to hear it from you eventually, but not today.\n\nThere is one other thing and I would rather it waited. It will not wait — it came in an hour ago and it is addressed to you.',
            choices: [
                {
                    text: 'Send it.',
                    effects: [
                        { kind: 'flag', flag: 'fatherDead' },
                        { kind: 'news', headline: 'Gerald Hale, founder, has died. He was seventy-one.' },
                        // ------------------------------------------------
                        //  AND HIS THREAD CLOSES
                        // ------------------------------------------------
                        //  It used to stay exactly as it was - his name at
                        //  the top of the messages screen, his last line
                        //  about a filing cabinet, sitting above the message
                        //  saying he is dead, openable for the next twenty
                        //  years. That is not the phone being tender, it is
                        //  the phone not having noticed.
                        //
                        //  On BOTH answers, like the flag, for the same
                        //  reason: asking for a day does not buy one.
                        // ------------------------------------------------
                        { kind: 'closeThread', who: 'father' },
                        // ------------------------------------------------
                        //  SHELVED: PEAR IS NOT SCHEDULED FROM HERE
                        // ------------------------------------------------
                        //  He wrote in the sixth quarter because the story
                        //  says he does, not because of anything that
                        //  happens in this scene. Scheduling him from an
                        //  effect made a fixed beat depend on this
                        //  conversation being reached, delivered, opened and
                        //  answered - four ways for the second act not to
                        //  start, all of which happened.
                        //
                        //  It is a beat with a quarter number on it now. See
                        //  the note at the top of data/story/pearOffer.ts.
                        //
                        //  {
                        //      kind: 'schedule',
                        //      conversation: 'pear-offer',
                        //      afterQuarters: 1,
                        //      urgent: true,
                        //  },
                    ],
                },
                {
                    text: 'It can wait until tomorrow.',
                    effects: [
                        { kind: 'flag', flag: 'fatherDead' },
                        { kind: 'news', headline: 'Gerald Hale, founder, has died. He was seventy-one.' },
                        // ------------------------------------------------
                        //  AND HIS THREAD CLOSES
                        // ------------------------------------------------
                        //  It used to stay exactly as it was - his name at
                        //  the top of the messages screen, his last line
                        //  about a filing cabinet, sitting above the message
                        //  saying he is dead, openable for the next twenty
                        //  years. That is not the phone being tender, it is
                        //  the phone not having noticed.
                        //
                        //  On BOTH answers, like the flag, for the same
                        //  reason: asking for a day does not buy one.
                        // ------------------------------------------------
                        { kind: 'closeThread', who: 'father' },
                        // Same schedule on both answers. Asking for a day does
                        // not buy one - which is the first thing the new job
                        // teaches, and it teaches it without a line of
                        // dialogue saying so.
                        //  Shelved with the other answer's copy - see above.
                        //  {
                        //      kind: 'schedule',
                        //      conversation: 'pear-offer',
                        //      afterQuarters: 1,
                        //      urgent: true,
                        //  },
                        { kind: 'dial', dial: 'cfoTrust', delta: 2 },
                    ],
                },
            ],
        },
    ],
};
