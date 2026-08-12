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
import {
    brotherVoteEvent, cfoWarnsAboutBrotherEvent, brotherMeetsPearQuietlyEvent,
} from './brotherPlot';
import {
    friendGossipSmallEvent, friendGossipRealEvent,
    friendPearWeaknessEvent, friendOffersPlanoraEvent,
} from './friendGossip';
import {
    moleNumberEvent, moleFirstContactEvent, moleOfferEvent,
    fbiFirstContactEvent, fbiFirstContactRepeatEvent,
} from './mole';
import {
    pearPatentEvent, pearSuppliersEvent, pearPriceWarEvent, pearMidnightEvent,
} from './pearEscalation';
import { cooLineShortEvent, cooWalkoutEvent } from './plantFloor';
import {
    territoryRoboticsEvent, territoryDeepTechEvent,
    territoryBioTechEvent, territoryConsumerEvent,
} from './territory';
import {
    rippleVoltmotorsEvent, rippleStreamifyEvent, rippleNovidiaEvent,
    rippleBiogenEvent, rippleSkynetEvent, ripplePlanoraEvent,
} from './ripple';
import {
    portfolioPearEvent, portfolioVultureEvent, portfolioFriendEvent,
} from './portfolio';
import {
    ctoDarkLabEvent, ctoAlarmEvent, ctoTooLateEvent, ctoStillEmptyEvent,
} from './labPressure';

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
    // What he does once he has stopped asking. The warning and the silence
    // are mirrors: one needs the CFO, the other fires when there is no CFO
    // left to bring it.
    brotherVoteEvent,
    cfoWarnsAboutBrotherEvent,
    brotherMeetsPearQuietlyEvent,
    // The channel. Every one of these requires that the player did not refuse
    // him - and a player who did will never see any of them, or be told why.
    friendGossipSmallEvent,
    friendGossipRealEvent,
    friendPearWeaknessEvent,
    friendOffersPlanoraEvent,
    // The hidden arc, and the only one a whole campaign can miss entirely.
    // The two FBI entries are the same letter at two probabilities - see the
    // note in mole.ts about why the escalation is a chance rather than a gate.
    moleNumberEvent,
    moleFirstContactEvent,
    moleOfferEvent,
    fbiFirstContactEvent,
    fbiFirstContactRepeatEvent,
    // Pear, getting louder - and then the one time he is not.
    pearPatentEvent,
    pearSuppliersEvent,
    pearPriceWarEvent,
    pearMidnightEvent,
    // The floor. Neither of these is about a relationship - both read numbers
    // the player is already managing on a screen, which is why the COO and
    // the CTO have flags and no dial.
    cooLineShortEvent,
    cooWalkoutEvent,
    // The lab. `cto-alarm` and `cto-too-late` are the same morning at two
    // companies and their gates are exclusive: one needs a lab, the other
    // needs the absence of one.
    ctoDarkLabEvent,
    ctoAlarmEvent,
    ctoTooLateEvent,
    ctoStillEmptyEvent,
    // Walking into somebody else's market. Three fire on entry; Pear's fires
    // on share, because the player has been in his category since Q1.
    //
    // LISTED RATHER THAN SPREAD, and the first version did spread a
    // TERRITORY_EVENTS array from the scene file. The audit reads this module
    // statically and reported `TERRITORY_EVENTS is not iterable`, which means
    // it stopped checking data/events ENTIRELY - four unvalidated scenes and a
    // whole category of check silently switched off. Four repeated names is a
    // smaller cost than an audit that cannot see them.
    territoryRoboticsEvent,
    territoryDeepTechEvent,
    territoryBioTechEvent,
    territoryConsumerEvent,
    // Buying a company is not a private transaction. Four rivals who wanted
    // the same business and one fund that wanted two of them cheap.
    rippleVoltmotorsEvent,
    rippleStreamifyEvent,
    rippleNovidiaEvent,
    rippleBiogenEvent,
    rippleSkynetEvent,
    ripplePlanoraEvent,
    // Selling, and the three prices. Halberd's is the only one in the pool
    // gated on the player being SHORT - he cannot reach a comfortable
    // company, which is what makes 55% a decision instead of an insult.
    portfolioPearEvent,
    portfolioVultureEvent,
    portfolioFriendEvent,
];

export const eventById = (id: string): GameEvent | undefined =>
    EVENTS.find(e => e.id === id);
