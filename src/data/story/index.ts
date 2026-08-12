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
