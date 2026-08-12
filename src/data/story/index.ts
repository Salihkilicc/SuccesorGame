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
// Event scenes live next to their trigger in data/events, because a scene and
// the condition that fires it are one thing and splitting them across two
// folders is how they drift. They register HERE all the same: the inbox
// delivers by id and this is the only list it reads.
import { recallConversation } from '../events/recall';
import { poachConversation } from '../events/poach';
import { shortSellerConversation } from '../events/shortSeller';

export const CONVERSATIONS: Conversation[] = [
    fatherQ1,
    fatherQ1Invoice,
    fatherMorale,
    fatherMarketing,
    fatherDeath,
    pearOffer,
    cfoDividend,
    recallConversation,
    poachConversation,
    shortSellerConversation,
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
export const STORY_BEATS: string[] = [
    fatherDeath.id,
];
