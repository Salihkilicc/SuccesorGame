import { ACHIEVEMENTS } from './achievements';
import { useStatsStore } from '../core/store/useStatsStore';
import { useUserStore } from '../core/store/useUserStore';
import { useGameStore } from '../core/store/useGameStore';
import { useAchievementStore } from '../core/store/useAchievementStore';
import { usePlayerStore } from '../core/store/usePlayerStore';

const getAchievementById = (id: string) => ACHIEVEMENTS.find(a => a.id === id);

export function checkAllAchievementsAfterStateChange() {
  const stats = useStatsStore.getState();
  const user = useUserStore.getState();
  const game = useGameStore.getState();
  const achievementStore = useAchievementStore.getState();
  const player = usePlayerStore.getState();

  const unlock = (id: string) => {
    const achievement = getAchievementById(id);
    if (!achievement) return;
    achievementStore.unlockAchievement(id);
  };

  if (stats.netWorth >= 100_000) unlock('wealth_001');
  if (stats.netWorth >= 1_000_000) unlock('wealth_002');

  if (stats.companyValue >= 10_000_000) unlock('company_001');

  const monthsPlayed = (game.age - 18) * 12 + (game.currentMonth - 1);
  if (monthsPlayed >= 10) unlock('meta_001');

  if (user.partner && user.partner.love >= 80) unlock('love_001');

  const { charm } = player.attributes;
  const { health } = player.core;
  const { luck } = player.hidden;

  if (charm >= 70 && health >= 70 && luck >= 70) {
    unlock('meta_002');
  }

  if (stats.casinoReputation >= 60) unlock('casino_001');
}
