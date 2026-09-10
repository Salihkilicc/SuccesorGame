import { useState, useCallback } from 'react';
import { useStatsStore } from '../../../core/store';
import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { t } from '../../../core/i18n';
import {
    PartnerProfile,
    PartnerStats,
    Ethnicity,
    SocialClass
} from '../../../data/relationshipTypes';
import { Partner } from '../types';
import { generatePartner } from '../logic/partnerGenerator';
import { cheatingOutcome } from '../logic/startRelationship';
import { runCourtship } from '../logic/runCourtship';
import { ENCOUNTER_DATA, EncounterScenario } from '../data/encounterData';

// --- Constants ---
const ETHNICITIES: Ethnicity[] = [
    'Caucasian', 'Latina', 'EastAsian', 'SouthAsian', 'MiddleEastern',
    'Slavic', 'Scandinavian', 'Mediterranean', 'AfricanAmerican',
    'Caribbean', 'RoyalEuropean', 'PacificIslander', 'Mixed'
];

const SOCIAL_CLASSES: SocialClass[] = [
    'Underclass', 'WorkingClass', 'MiddleClass', 'HighSociety',
    'OldMoney', 'BillionaireHeir', 'Royalty', 'CriminalElite'
];

// --- Helper: Weighted Random ---
const getRandomWeighted = <T>(items: T[], weights: number[]): T => {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) return items[i];
        random -= weights[i];
    }
    return items[0];
};

// ============================================================================
//  SHELVED: THE ADAPTER BETWEEN THE TWO PARTNER TYPES
// ============================================================================
//
//  `convertToPartnerProfile` existed for one reason: `generatePartner` returned
//  the wrong type. It does not any more, so this translates nothing.
//
//  It is worth reading once before it goes quiet, because it is a catalogue of
//  what happens when a shape has to be guessed at:
//
//    - It invented all fifteen psychometrics with `Math.random()`, ignoring the
//      PERSONALITY entirely. A Loyal Confidante and a High Maintenance came out
//      of the same distribution, so the label on the card predicted nothing.
//    - It hardcoded `ethnicity: 'RoyalEuropean'` for every partner in the game,
//      while the generator had just picked one to build the name from.
//    - It mapped job tier to social class inline, with a nine-branch if-chain
//      that disagreed with nothing because nothing else did it.
//    - And it finished with `...(deepPartner as any)`, spraying `age`, `gender`
//      and `avatar` onto a profile that has none of those fields - which is why
//      the resulting object typechecked and was still wrong.
//
//  The generator now produces a complete PartnerProfile with the psychometrics
//  DERIVED from the personality and the tier. See logic/psychometrics.ts.
//
//  @orphan-ok-symbol convertToPartnerProfile
//  // --- Helper: Convert Deep Persona Partner to PartnerProfile for backward compatibility ---
//  const convertToPartnerProfile = (deepPartner: Partner): PartnerProfile => {
//      // Dynamic SocialClass determination based on job & tier
//      let socialClass: SocialClass = 'HighSociety';
//
//      if (deepPartner.job.id === 'dynasty_heiress' || deepPartner.job.id === 'billionaire_heir') {
//          socialClass = 'BillionaireHeir';
//      } else if (deepPartner.job.id === 'royal_envoy') {
//          socialClass = 'Royalty';
//      } else if (deepPartner.job.tier === 'CORPORATE_ELITE') {
//          socialClass = 'OldMoney';
//      } else if (deepPartner.job.tier === 'HIGH_SOCIETY') {
//          socialClass = 'HighSociety';
//      } else if (deepPartner.job.tier === 'UNDERGROUND') {
//          socialClass = 'CriminalElite';
//      } else if (deepPartner.job.tier === 'ARTISTIC') {
//          socialClass = 'HighSociety';
//      } else if (deepPartner.job.tier === 'BLUE_COLLAR') {
//          socialClass = 'WorkingClass';
//      } else if (deepPartner.job.tier === 'STUDENT_LIFE') {
//          socialClass = 'MiddleClass';
//      }
//
//      const isTopTier = ['BillionaireHeir', 'Royalty', 'HighSociety', 'OldMoney'].includes(socialClass);
//
//      const stats: PartnerStats = {
//          ethnicity: 'RoyalEuropean' as Ethnicity,
//          age: deepPartner.age,
//          occupation: deepPartner.job.title,
//          looks: isTopTier ? 75 + Math.floor(Math.random() * 25) : 60 + Math.floor(Math.random() * 35),
//          style: isTopTier ? 'Luxury' : 'Elegant',
//          socialClass,
//          familyWealth: socialClass === 'BillionaireHeir' ? 95 : socialClass === 'Royalty' ? 98 : isTopTier ? 75 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 60),
//          intelligence: isTopTier ? 82 + Math.floor(Math.random() * 18) : 70 + Math.floor(Math.random() * 30),
//          jealousy: Math.floor(Math.random() * 70),
//          crazy: Math.floor(Math.random() * 60),
//          libido: 60 + Math.floor(Math.random() * 40),
//          reputationBuff: socialClass === 'Royalty' ? 25 : socialClass === 'BillionaireHeir' ? 20 : isTopTier ? 15 : 5,
//          financialAidChance: isTopTier ? 40 + Math.floor(Math.random() * 40) : 15,
//          networkPower: isTopTier ? 80 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 40),
//      };
//
//      return {
//          id: deepPartner.id,
//          name: deepPartner.name,
//          photo: deepPartner.avatar || null,
//          stats,
//          love: deepPartner.stats.relationshipLevel,
//          relationYears: 0,
//          isMarried: deepPartner.isMarried,
//          hasPrenup: deepPartner.hasPrenup,
//          // Store Deep Persona data as well for access
//          ...(deepPartner as any), // Include all Deep Persona fields
//      };
//  };
// ============================================================================

/**
 * What came of asking.
 *
 * A shape rather than `X | null`, because null was being read as "nothing
 * happened" by every caller and a refusal is not nothing - see the note in
 * `triggerEncounter`.
 */
export type EncounterOutcome =
    | { kind: 'candidate'; candidate: PartnerProfile; scenario: EncounterScenario }
    /** They were not interested. The message from them is already sent. */
    | { kind: 'refused'; name: string }
    /** Every room open to this player is cooling off from an earlier no. */
    | { kind: 'nobody' };

export const useEncounterSystem = () => {
    const [currentScenario, setCurrentScenario] = useState<EncounterScenario | null>(null);
    const [candidate, setCandidate] = useState<PartnerProfile | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

    // Was useUserStore. See the note at the top of useFamilyStore.ts: the
    // encounters wrote to one store and everything that reads a partner read
    // the other, so meeting somebody and having somebody were unrelated.
    const { partner, setPartner, breakup: breakUp } = useFamilyStore();

    // --- 1. Smart NPC Generator (Now uses Deep Persona System) ---
    const generateSmartCandidate = useCallback((context: string, countryId?: string): PartnerProfile => {
        // One call. The generator produces the type that gets stored.
        const candidateProfile = generatePartner();
        // NOTE: superseded by runCourtship - see triggerEncounter below.

        if (__DEV__) {
            console.log('[partner] generated:', {
                name: candidateProfile.name,
                job: candidateProfile.job?.title,
                personality: candidateProfile.personality?.label,
                socialClass: candidateProfile.stats.socialClass,
                monthlyCost: candidateProfile.finances?.monthlyCost,
            });
        }

        return candidateProfile;
    }, []);

    // --- 2. Trigger Encounter ---
    const triggerEncounter = useCallback((
        context: string,
        countryId?: string,
        autoShow: boolean = true,
    ): EncounterOutcome => {
        // 0. Probability Check (Internal)
        let chance = 10; // Default 10% (Generic passive background)

        switch (context) {
            case 'VIP_LOUNGE':
            case 'GALA':
            case 'DIRECT':
            case 'profile':
                chance = 100; // 100% Guaranteed - Explicit user action to find a partner
                break;
            case 'gym':
            case 'shopping':
                chance = 5; // Very Rare - Passive gameplay interruptions
                break;
            case 'club':
                chance = 50; // High - Socializing is the point
                break;
            case 'travel':
                chance = 60; // Very High - Vacation romance
                break;
        }

        if (context === 'travel' || countryId) {
            chance = 60; // Very High - Vacation romance
        }

        const roll = Math.random() * 100;
        console.log(`[Encounter] Context: ${context}, Chance: ${chance}%, Roll: ${roll.toFixed(1)}`);

        if (roll > chance) {
            // Nobody was in the room. Distinct from a refusal, and the caller
            // should be able to tell them apart.
            return { kind: 'nobody' };
        }

        // 1. Select Scenario List
        let scenarios = ENCOUNTER_DATA['generic'];

        // Priority: Country -> Context -> Generic
        if (countryId && ENCOUNTER_DATA[`travel_${countryId}`]) {
            scenarios = ENCOUNTER_DATA[`travel_${countryId}`];
        } else if (ENCOUNTER_DATA[context]) {
            scenarios = ENCOUNTER_DATA[context];
        } else if (ENCOUNTER_DATA['VIP_LOUNGE']) {
            scenarios = ENCOUNTER_DATA['VIP_LOUNGE'];
        }

        // 2. Pick Random Scenario
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // ------------------------------------------------------------------
        //  3. WHO IS IN THE ROOM, AND WHETHER THEY ARE INTERESTED
        // ------------------------------------------------------------------
        //  This called `generatePartner()` with no tier, and the generator
        //  takes one. So the tier was uniform random: a bankrupt chief
        //  executive met dynasty heiresses at the same rate as a billionaire,
        //  and this screen was a slot machine with faces on it.
        //
        //  `runCourtship` picks the room from what the COMPANY IS WORTH and
        //  asks whether they are interested using PUBLIC REPUTATION. A refusal
        //  arrives as a message from them and shuts that room for a couple of
        //  quarters, so tapping again is not a re-roll.
        //
        //  See logic/courtship.ts for why those are two numbers rather than
        //  one "prestige".
        // ------------------------------------------------------------------
        // ------------------------------------------------------------------
        //  A TAP THAT DOES NOTHING IS NOT A REFUSAL, IT IS A BROKEN BUTTON
        // ------------------------------------------------------------------
        //  This returned `null` on a refusal and every caller treated null as
        //  "no encounter this time". So the player pressed the button to go
        //  and meet somebody, watched nothing happen, and a message arrived
        //  some seconds later from a person they had never seen a card for.
        //
        //  Nothing connected the two. Reported as the refusal not appearing
        //  to do anything, which is exactly what it looked like.
        //
        //  The outcome is named now and handed back, so the screen can say
        //  what happened at the moment the player asked. The message still
        //  goes - being told twice is not the problem, being told by neither
        //  is.
        // ------------------------------------------------------------------
        const result = runCourtship();
        if (result.kind === 'refused') {
            return { kind: 'refused', name: result.candidate.name };
        }
        if (result.kind !== 'candidate') {
            // Every room the player can reach is still cooling off from an
            // earlier no. Also worth saying out loud rather than swallowing.
            return { kind: 'nobody' };
        }
        const newCandidate = result.candidate;

        // 4. Update State
        if (autoShow) {
            setCurrentScenario(scenario);
            setCandidate(newCandidate);
            setIsVisible(true);
        }

        return { kind: 'candidate', candidate: newCandidate, scenario };
    }, [generateSmartCandidate]);

    // --- 3. Handle Date Action ---
    const handleDate = useCallback(() => {
        if (!candidate) return { success: false, wasCaught: false, settlement: 0 };

        let wasCaught = false;
        let settlement = 0;

        // A. Cheating Logic
        if (partner) {
            const oldPartnerName = partner.name;
            const statsStore = useStatsStore.getState();
            const currentMoney = statsStore.money;

            // ------------------------------------------------------------
            //  THE ARITHMETIC MOVED TO logic/startRelationship.ts
            // ------------------------------------------------------------
            //  Unchanged in behaviour, and moved for one reason: the swipe
            //  app starts relationships now too, and it needs the same rules.
            //  Two copies of a settlement calculation become two rules the
            //  moment either one is edited.
            //
            //  The roll is drawn HERE and passed in, so the decision itself
            //  is pure and a test can ask what happens on either side of the
            //  line instead of running it a thousand times and hoping.
            // ------------------------------------------------------------
            const outcome = cheatingOutcome(partner, currentMoney, Math.random() * 100);
            settlement = outcome.settlement;
            wasCaught = outcome.caught;
            breakUp(wasCaught ? 'cheated' : 'drifted');

            // Set consequence state to trigger modal (regardless of caught/drifted)
            // Using setTimeout to allow EncounterModal to close properly before showing BreakupModal
            console.log('⏳ Delaying Modal Trigger...');
            setTimeout(() => {
                console.log('🚨 SETTING BREAKUP CONSEQUENCE STATE NOW:', { wasCaught, oldPartnerName });
                setCheatingConsequence({
                    settlement: wasCaught ? settlement : 0,
                    partnerName: oldPartnerName
                });
            }, 600);
        }

        // B. Start New Relationship
        setPartner(candidate);
        setIsVisible(false);

        return {
            success: true,
            message: t('love.startedDatingYou', { name: candidate.name }),
            wasCaught,
            settlement,
            breakupOccurred: !!partner // true if we had a partner before
        };

    }, [candidate, partner, breakUp, setPartner]);

    /**
     * One night, and nobody is anybody's partner in the morning.
     *
     * -----------------------------------------------------------------------
     *  IT WAS THE SAME FUNCTION AS THE DATE, AND THAT IS THE WHOLE BUG
     * -----------------------------------------------------------------------
     *  Reported as: after a hookup the person shows up as my girlfriend, and
     *  it was a one night thing. It did, because `ProfileScreen` wired both
     *  `onHookup` and `onDate` to the same handler and that handler ends with
     *  `setPartner(candidate)`. A modal offering two different answers ran one.
     *
     *  What a hookup KEEPS from the date is the cheating. If there is somebody
     *  at home, a night out is still a night out and they can still find out,
     *  so the consequence path below is deliberately identical. What it does
     *  not do is put a stranger on the profile as a partner.
     * -----------------------------------------------------------------------
     */
    const handleHookup = useCallback(() => {
        if (!candidate) return { success: false, wasCaught: false, settlement: 0 };

        let wasCaught = false;
        let settlement = 0;

        if (partner) {
            const oldPartnerName = partner.name;
            const currentMoney = useStatsStore.getState().money;
            const outcome = cheatingOutcome(partner, currentMoney, Math.random() * 100);
            settlement = outcome.settlement;
            wasCaught = outcome.caught;
            breakUp(wasCaught ? 'cheated' : 'drifted');
            setTimeout(() => {
                setCheatingConsequence({
                    settlement: wasCaught ? settlement : 0,
                    partnerName: oldPartnerName,
                });
            }, 600);
        }

        // NO setPartner. That line is the difference between the two answers.
        setIsVisible(false);

        return {
            success: true,
            message: t('love.oneNightWith', { name: candidate.name }),
            wasCaught,
            settlement,
            breakupOccurred: !!partner,
        };
    }, [candidate, partner, breakUp]);

    const closeEncounter = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Helper to get potential cheating consequence without executing
    const getCheatingConsequence = useCallback(() => {
        if (!partner) return 0;
        if (!partner.isMarried || partner.hasPrenup) return 0;

        const statsStore = useStatsStore.getState();
        return statsStore.money * 0.5;
    }, [partner]);

    // Clear cheating consequence state (for modal close)
    const clearConsequence = useCallback(() => {
        setCheatingConsequence(null);
    }, []);


    return {
        isVisible,
        currentScenario,
        candidate,
        triggerEncounter,
        handleDate,
        handleHookup,
        closeEncounter,
        getCheatingConsequence,
        cheatingConsequence,
        clearConsequence
    };
};
