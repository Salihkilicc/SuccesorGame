import {useCallback, useMemo, useState} from 'react';
import {useUserStore} from '../../store';

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

export const useMatchSystem = () => {
  const [visible, setVisible] = useState(false);
  const [matchCandidate, setMatchCandidate] =
    useState<MatchCandidate>(defaultCandidate);
  const {partner, setField} = useUserStore();

  const openMatch = useCallback((candidate?: MatchCandidate) => {
    setMatchCandidate(candidate ?? defaultCandidate);
    setVisible(true);
  }, []);

  const closeMatch = useCallback(() => {
    setVisible(false);
  }, []);

  const acceptMatch = useCallback(() => {
    if (!partner) {
      setField('partner', {
        name: matchCandidate.name,
        mood: 'Neutral',
        love: Math.min(100, matchCandidate.attractiveness),
        photo: null,
      });
    } else {
      console.log('Partner varken hookup event tetiklenecek');
    }
    setVisible(false);
  }, [matchCandidate.name, matchCandidate.attractiveness, partner, setField]);

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
