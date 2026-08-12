// src/data/events/index.ts
//
// ============================================================================
//  EVERY RANDOM EVENT IN THE GAME
// ============================================================================
//
//  Same bargain as data/story/index.ts: one list, and the audit checks all of
//  it. An event written but not registered here does not happen and is not
//  validated, so it lands in this array in the commit that creates it.
//
//  Their conversations must ALSO be registered in data/story/index.ts - the
//  inbox delivers by id and looks the id up there. The audit reports an event
//  whose scene is missing from that list, because the symptom otherwise is a
//  quarter where the headline appears and the message never does.
// ============================================================================

import type { GameEvent } from '../../core/events/types';
import { recallEvent } from './recall';
import { poachEvent } from './poach';
import { shortSellerEvent } from './shortSeller';
import { cashWarningEvent } from './cashWarning';
import {
    brotherDividendColdEvent, brotherDividendWarmEvent, brotherDividendCloseEvent,
} from './brotherDividend';

export const EVENTS: GameEvent[] = [
    recallEvent,
    poachEvent,
    shortSellerEvent,
    cashWarningEvent,
    // Three temperatures of one demand. The band gates are mutually
    // exclusive, so exactly one of them can be eligible in any quarter.
    brotherDividendColdEvent,
    brotherDividendWarmEvent,
    brotherDividendCloseEvent,
];

export const eventById = (id: string): GameEvent | undefined =>
    EVENTS.find(e => e.id === id);
