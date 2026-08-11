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

export const CONVERSATIONS: Conversation[] = [
    cfoDividend,
];

export const conversationById = (id: string): Conversation | undefined =>
    CONVERSATIONS.find(c => c.id === id);
