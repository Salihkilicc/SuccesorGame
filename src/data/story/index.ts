// src/data/story/index.ts
//
// ============================================================================
//  EVERY CONVERSATION IN THE GAME
// ============================================================================
//
//  One list, and the audit validates all of it. A conversation that is written
//  but not registered here is not in the game and is not checked - so the rule
//  is that a new scene lands in this array in the same commit that creates it.
//
//  The list will get long. That is fine: it is a table of contents, not a
//  module. What must not happen is a second list somewhere else.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import { cfoDividend } from './cfoDividend';
import { fatherQ1 } from './fatherQ1';
import { fatherQ1Invoice } from './fatherQ1Invoice';
import { fatherMorale } from './fatherMorale';
import { fatherMarketing } from './fatherMarketing';
import { fatherDeath } from './fatherDeath';
import { pearOffer } from './pearOffer';
import {
    cfoBoardRoom, cfoBragaName, cfoBragaTruth, cfoResignation,
} from './cfoArc';
import {
    friendCondolence, friendCondolencePublic,
    cfoCondolenceMail, cfoCondolenceMessage, cfoCondolencePublic,
    brotherCondolence, brotherCondolencePublic,
    boardCondolence, boardCondolencePublic,
} from './condolences';
// Event scenes live next to their trigger in data/events, because a scene and
// the condition that fires it are one thing and splitting them across two
// folders is how they drift. They register HERE all the same: the inbox
// delivers by id and this is the only list it reads.
import { recallConversation } from '../events/recall';
import { poachConversation } from '../events/poach';
import { shortSellerConversation } from '../events/shortSeller';
import { cashWarningConversation } from '../events/cashWarning';
import {
    brotherDividendCold, brotherDividendWarm, brotherDividendClose,
} from '../events/brotherDividend';
import {
    brotherVote, cfoWarnsAboutBrother, brotherCaught, brotherMeetsPearQuietly,
} from '../events/brotherPlot';
import {
    friendGossipSmall, friendGossipReal, friendPearWeakness, friendOffersPlanora,
} from '../events/friendGossip';
import {
    moleNumber, moleFirstContact, moleOffer, fbiFirstContact,
} from '../events/mole';
import {
    pearPatent, pearSuppliers, pearPriceWar, pearMidnight,
} from '../events/pearEscalation';
import {
    cooLineShort, cooWalkout, cooOpsNote, cooOpsNoteCc,
} from '../events/plantFloor';
import {
    ctoDarkLab, ctoAlarm, ctoTooLate, ctoBudgetMemo, ctoStillEmpty,
} from '../events/labPressure';
import {
    territoryRobotics, territoryDeepTech, territoryBioTech, territoryConsumer,
} from '../events/territory';
import { friendAsks, friendGrows } from './friendArc';

export const CONVERSATIONS: Conversation[] = [
    fatherQ1,
    fatherQ1Invoice,
    fatherMorale,
    fatherMarketing,
    fatherDeath,
    pearOffer,
    friendCondolence, friendCondolencePublic,
    cfoCondolenceMail, cfoCondolenceMessage, cfoCondolencePublic,
    brotherCondolence, brotherCondolencePublic,
    boardCondolence, boardCondolencePublic,
    cfoDividend,
    recallConversation,
    poachConversation,
    shortSellerConversation,
    cashWarningConversation,
    cfoBoardRoom, cfoBragaName, cfoBragaTruth, cfoResignation,
    brotherDividendCold, brotherDividendWarm, brotherDividendClose,
    brotherVote, cfoWarnsAboutBrother, brotherCaught, brotherMeetsPearQuietly,
    friendAsks, friendGrows,
    friendGossipSmall, friendGossipReal, friendPearWeakness, friendOffersPlanora,
    moleNumber, moleFirstContact, moleOffer, fbiFirstContact,
    pearPatent, pearSuppliers, pearPriceWar, pearMidnight,
    // The two people inside the building. Their quarterly letters are here
    // and NOT in the event list, because nothing rolls for them - they are
    // scheduled by the message that came first, which is the whole shape of
    // the pair: the emergency arrives on the phone, the record arrives later.
    cooLineShort, cooWalkout, cooOpsNote, cooOpsNoteCc,
    ctoDarkLab, ctoAlarm, ctoTooLate, ctoBudgetMemo, ctoStillEmpty,
    // The four incumbents. Listed rather than spread for the reason written
    // out in data/events/index.ts: the audit reads these modules statically
    // and a spread of an imported array stops it reading them at all.
    territoryRobotics, territoryDeepTech, territoryBioTech, territoryConsumer,
];

export const conversationById = (id: string): Conversation | undefined =>
    CONVERSATIONS.find(c => c.id === id);

// ============================================================================
//  WHAT IS ALREADY WAITING WHEN THE GAME OPENS
// ============================================================================
//
//  Every other scene arrives because something scheduled it - an effect, an
//  event roll, a reply promised last quarter. The first one has nobody to
//  schedule it, so without this the queue starts empty and the father never
//  speaks. The player would open a company with a cold production line and
//  no indication that anything was expected of them.
//
//  Queued rather than delivered directly, so it goes through the same door
//  as everything else and the inbox's own rules apply to it.
// ============================================================================
export const OPENING_CONVERSATIONS: string[] = [
    fatherQ1.id,
];

// ============================================================================
//  BEATS THAT ARRIVE WHEN THE WORLD IS READY FOR THEM
// ============================================================================
//
//  Three ways a scene can reach the player, and until now only two existed:
//
//    an EFFECT schedules it        - a reply promised by another scene
//    a LOCK carries it             - the teaching layer's explanation
//    ...and nothing covered a beat that simply becomes due.
//
//  The father's death is the first of those and most of the rest of the story
//  is the same shape: it happens at a moment, not because a scene asked for it
//  and not because a die came up. Without this the scene would have had to be
//  scheduled by whichever earlier conversation happened to run last, which
//  makes the spine depend on the player having read the right optional beat.
//
//  Each id is queued once, the first quarter its own `when` holds. The
//  conversation's `when` is the trigger - there is no second place to state
//  it, so the condition that fires a scene and the condition that lets it be
//  delivered cannot disagree.
// ============================================================================
export interface StoryBeat {
    conversation: string;
    /**
     * Bypass the two-a-quarter allowance.
     *
     * True only for the spine. The condolence wave is deliberately NOT urgent:
     * its whole shape is four people arriving over two quarters, and marking
     * them urgent would dump all four in one and turn a sequence into a pile.
     */
    urgent?: boolean;
}

export const STORY_BEATS: StoryBeat[] = [
    { conversation: fatherDeath.id, urgent: true },
];

// ============================================================================
//  THE CONDOLENCE WAVE
// ============================================================================
//
//  Scheduled together the moment the player refuses Pear, and delivered two a
//  quarter in this order by the inbox queue (core/story/inbox.ts). NOT urgent:
//  the whole point is that they arrive over two quarters rather than as a pile
//  of four, and marking them urgent would bypass the allowance that produces
//  the pacing.
//
//  The order is the writing. The friend goes first because he is the only one
//  who wants nothing, and after him nobody in this game writes for free. The
//  board goes last because a demand reads differently once you have already
//  been reminded three times that everyone wants something.
//
//  The `-public` variants are queued alongside and simply do not pass their
//  own `when` on the quiet branch, so the inbox drops them.
// ============================================================================
STORY_BEATS.push(
    { conversation: friendCondolence.id },
    { conversation: friendCondolencePublic.id },
    { conversation: cfoCondolenceMail.id },
    { conversation: brotherCondolence.id },
    { conversation: brotherCondolencePublic.id },
    { conversation: boardCondolence.id },
    { conversation: boardCondolencePublic.id },
    { conversation: cfoCondolencePublic.id },
);

// ----------------------------------------------------------------------------
//  THE CFO'S ARC
// ----------------------------------------------------------------------------
//  Each of these carries its own `when`, and between them they read cfoTrust
//  at both ends: the board-room trade and the Braga thread need him to be
//  being listened to, and the resignation needs him to have given up. None of
//  them is urgent - he is not the spine, he is the person standing next to it.
// ----------------------------------------------------------------------------
STORY_BEATS.push(
    { conversation: cfoBoardRoom.id },
    { conversation: cfoBragaName.id },
    { conversation: cfoResignation.id },
);

// ----------------------------------------------------------------------------
//  THE FRIEND'S ARC
// ----------------------------------------------------------------------------
//  Two beats; the rest of him is events. Neither is urgent - he is the one
//  person in the cast who never needs an answer this quarter, and making him
//  jump the queue would be the wrong note in the only relationship that is not
//  transactional.
// ----------------------------------------------------------------------------
STORY_BEATS.push(
    { conversation: friendAsks.id },
    { conversation: friendGrows.id },
);
