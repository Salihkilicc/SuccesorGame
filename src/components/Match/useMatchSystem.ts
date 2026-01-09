import { useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../../core/store';
import { PartnerProfile, PartnerStats } from '../../core/types';

export type MatchCandidate = {
  name: string;
  age?: number;
  attractiveness: number;
  moodImpact: number;
  bio?: string;
};

const defaultCandidate: MatchCandidate = {
  name: 'Sophia',
  age: 24,
  attractiveness: 80,
  moodImpact: 10,
  bio: 'Enerjik ve sosyal biri.',
};

/**
 * Helper function to create a basic PartnerProfile from a MatchCandidate
 * This generates default stats for partners created through the match system
 */
const createPartnerFromCandidate = (candidate: MatchCandidate): PartnerProfile => {
  // Generate basic stats for the partner
  const stats: PartnerStats = {
    ethnicity: 'Mixed', // Default, can be randomized later
    age: candidate.age || 25,
    occupation: 'Professional', // Default occupation
    looks: candidate.attractiveness,
    style: 'Casual', // Default style
    socialClass: 'MiddleClass', // Default social class
    familyWealth: 50, // Average wealth
    intelligence: 50 + Math.floor(Math.random() * 30), // 50-80
    jealousy: 30 + Math.floor(Math.random() * 40), // 30-70
    crazy: 20 + Math.floor(Math.random() * 30), // 20-50
    libido: 50 + Math.floor(Math.random() * 30), // 50-80
    reputationBuff: 0, // No buff by default
    financialAidChance: 10, // Low chance
    networkPower: 30, // Low network power
  };

  return {
    id: `partner-${Date.now()}`,
    name: candidate.name,
    photo: null,
    stats,
    love: Math.min(100, candidate.attractiveness),
    relationYears: 0,
    isMarried: false,
    hasPrenup: false,
  };
};

export const useMatchSystem = () => {
  const [visible, setVisible] = useState(false);
  const [matchCandidate, setMatchCandidate] =
    useState<MatchCandidate>(defaultCandidate);
  const { partner, setPartner } = useUserStore();

  const openMatch = useCallback((candidate?: MatchCandidate) => {
    setMatchCandidate(candidate ?? defaultCandidate);
    setVisible(true);
  }, []);

  const closeMatch = useCallback(() => {
    setVisible(false);
  }, []);

  const acceptMatch = useCallback(() => {
    if (!partner) {
      // Create a full PartnerProfile from the match candidate
      const newPartner = createPartnerFromCandidate(matchCandidate);
      setPartner(newPartner);
    } else {
      console.log('Partner varken hookup event tetiklenecek');
    }
    setVisible(false);
  }, [matchCandidate, partner, setPartner]);

  const rejectMatch = useCallback(() => {
    setVisible(false);
  }, []);

  return useMemo(
    () => ({
      visible,
      matchCandidate,
      openMatch,
      closeMatch,
      acceptMatch,
      rejectMatch,
    }),
    [acceptMatch, closeMatch, matchCandidate, openMatch, rejectMatch, visible],
  );
};
