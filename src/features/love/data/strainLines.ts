// src/features/love/data/strainLines.ts
//
// ============================================================================
//  WHAT THEY SAY, AND WHY IT NAMES THE THING
// ============================================================================
//
//  Every line here mentions the specific thing the player did this quarter -
//  the overtime, the tables, the unanswered message. That is not decoration.
//  It is the whole reason `strain` is built on conduct rather than on a die:
//  the player can read the message, remember throwing the switch, and connect
//  the two without being told.
//
//  A message that said "your partner is unhappy" would put the mechanic back
//  behind a curtain and we would be where we started.
//
//  ---------------------------------------------------------------------------
//  THREE VOICES, NOT TEN
//  ---------------------------------------------------------------------------
//  Ten personalities and three reasons is thirty lines, and thirty lines
//  written in one sitting are thirty bad lines. So they are grouped by how
//  somebody handles being let down, which is a smaller and more honest axis
//  than personality:
//
//    MEASURED   - says it once, plainly, and does not repeat it.
//    COUNTING   - does not complain. Records.
//    SHARP      - says it now, at length, and means it.
//
//  A partner with no group falls back to MEASURED rather than saying nothing,
//  because silence would make the strain invisible and invisible is the fault
//  this whole file is fixing.
// ============================================================================

import type { Strain } from '../logic/strain';

export type StrainVoice = 'measured' | 'counting' | 'sharp';

/**
 * Which voice each personality uses when it is hurt.
 *
 * Not the same as their fingerprint. A Corporate Shark and a Tech Visionary
 * have very different psychometrics and both go quiet and keep score.
 */
export const VOICE_FOR_PERSONALITY: Record<string, StrainVoice> = {
    supportive: 'measured',
    frugal: 'measured',
    philanthropist: 'measured',
    visionary: 'counting',
    corporate_shark: 'counting',
    power_broker: 'counting',
    sophisticated: 'counting',
    ambitious: 'sharp',
    hedonist: 'sharp',
    gold_digger: 'sharp',
};

type Reason = NonNullable<Strain['reason']>;

export const STRAIN_LINES: Record<StrainVoice, Record<Reason, string>> = {
    // Says it once, plainly, and does not repeat it. The hardest to write and
    // the easiest to ignore, which is the point of them.
    measured: {
        overtime: 'The plant ran late again this quarter, so you did.\n\nI am not asking you to stop. I am telling you that I noticed, once, and then I will not mention it again.',
        casino: 'You have been at the tables two quarters running now.\n\nI have no speech about it. I would just rather hear about it from you than work it out from the evenings.',
        ignored: 'I wrote to you and you have not answered, which is fine on its own.\n\nIt is the third time it has been fine on its own.',
    },

    // Does not complain. Records. The version that lands hardest a year later.
    counting: {
        overtime: 'Overtime again.\n\nI am not going to make it a thing. I will say that I know exactly how many quarters this makes, and that you probably do not.',
        casino: 'The casino, twice in a row.\n\nI am not your accountant and I have not added it up. I could, is all.',
        ignored: 'No reply.\n\nThat is now a pattern rather than a busy week, and I have stopped assuming it is the week.',
    },

    // Says it now, at length, and means it.
    sharp: {
        overtime: 'You were at that plant every night this quarter and I know because I was here.\n\nI did not sign up to be the thing you get to after the line stops. Fix it or tell me you are not going to.',
        casino: 'Two quarters at the tables.\n\nDo not tell me it is business. I have met the people you do business with and none of them are at that table at four in the morning.',
        ignored: 'You have not answered me. Not once.\n\nI am going to keep writing for a while, because that is who I am, and then one day I am going to stop and you will not notice for a month.',
    },
};

/**
 * What they say when they go.
 *
 * TWO ENDINGS, and `crazy` picks which - see LOUD_DEPARTURE_CRAZY. The quiet
 * one is worse to read and costs nothing; the loud one costs public standing,
 * because somebody who has nothing left to lose talks to people who ask.
 */
export const DEPARTURE_LINES: Record<'quiet' | 'loud', string> = {
    quiet: 'I am going to go.\n\nThere is no scene in this and there is nothing you did in the last week. It has been a year of quarters and I have watched every one of them win.\n\nI hope the company is worth it. I think it might be, for you, and that is most of what I am going on.',
    loud: 'I am done, and I am not going to be quiet about it.\n\nSomebody rang me last month asking what you are like and I said something kind. They are going to ring again and I have decided what I am saying this time.\n\nYou had a year of chances and you spent them all on a factory.',
};

// ============================================================================
//  AND WHAT THEY SAY WHEN THEY SAY NO
// ============================================================================
//
//  A refusal ARRIVES AS A MESSAGE rather than as a card that quietly does not
//  come back, and that was the player's call. It costs a thread on the phone
//  for somebody they have not met properly, and it buys the thing the silent
//  version cannot: the player finds out they were turned down, from the person
//  who turned them down, in the app where everything else in this game
//  happens.
//
//  Same three voices as the strain lines, for the same reason: how somebody
//  handles an awkward moment is a smaller and more honest axis than
//  personality, and thirty lines written in one sitting are thirty bad lines.
//
//  NONE OF THEM MENTIONS MONEY OR REPUTATION. The player can work out why. A
//  line that said "your public standing is too low" would put the mechanic
//  back behind a curtain and undo the whole point of sending a message at all.
// ============================================================================
//  ---------------------------------------------------------------------------
//  AND THERE ARE FOUR OF EACH, NOT ONE
//  ---------------------------------------------------------------------------
//  There was one line per voice, so a player who was turned down twice read
//  the same paragraph twice, word for word, from two different people. Which
//  is worse than a generic line: a generic line is a system speaking, and a
//  repeated specific one is a person who turns out to be a system.
//
//  Four is enough that a run does not repeat and few enough that all twelve
//  can be written properly. See `refusalLine` for the picking.
// ============================================================================
export const REFUSAL_LINES: Record<StrainVoice, string[]> = {
    measured: [
        'It was good to meet you, and I mean that.\n\nI have thought about it and I do not think so. There is nothing you did. I would rather say it now than be vague at you for a month.',
        'I have been trying to word this since Tuesday and there is no good version, so: no.\n\nYou were easy to talk to and I am not going to pretend that settles it. I hope the rest of your week is better than this message.',
        'Thank you for asking. It is not nothing, being asked.\n\nI am going to say no, and I want to be clear that it is about my life rather than about you. That is true even though it is also what people say when it is not.',
        'No, and I am sorry to put it that plainly.\n\nI thought about softening it and decided you would rather have the sentence than the paragraph around it.',
    ],
    counting: [
        'Thank you for the evening.\n\nI am going to be direct, because I think you would prefer it: no. I hope that is easier to hear once than to work out slowly.',
        'Answering properly rather than leaving it.\n\nIt is a no. I have thought about what the next six months would look like and I did not like my own answer.',
        'You will want this quickly so here it is: no.\n\nI have made a habit of saying so on the day I decide. It costs me the awkward message and it saves us both a fortnight.',
        'I have given this the time it deserved and the answer is still no.\n\nThere is nothing to argue with and I would rather you did not try, because you would be good at it and I would still be right.',
    ],
    sharp: [
        'Look, you seem fine.\n\nI asked about you afterwards, which is a thing people do, and I have decided against it. I am not going to explain that and you would not enjoy it if I did.',
        'No.\n\nI could dress that up. You are a grown man and I have watched you take worse news than this before lunch.',
        'I thought about it for slightly less time than you are going to spend reading this. No.\n\nDo not send flowers. I mean that as advice rather than as a rule.',
        'Somebody at that table told me something about you afterwards and I have not stopped thinking about it, which is not the compliment it sounds like.\n\nSo, no.',
    ],
};

/**
 * One of them, at random.
 *
 * The index rather than the array is exported to the caller so the picking
 * lives here with the writing. A caller choosing its own index would end up
 * with two places that both know how many lines there are.
 */
export const refusalLine = (
    voice: StrainVoice,
    roll: () => number = Math.random,
): string => {
    const lines = REFUSAL_LINES[voice] ?? REFUSAL_LINES.measured;
    return lines[Math.min(lines.length - 1, Math.floor(roll() * lines.length))];
};
