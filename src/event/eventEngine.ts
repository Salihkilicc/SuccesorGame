import {useEventStore, useStatsStore, useUserStore} from '../store';
import {
  lifeEvents,
  loveEvents,
  marketEvents,
  companyEvents,
  casinoEvents,
  type GameEvent,
} from './eventTemplates';
import {buildAIEvent} from './aiEventBuilder';
import {checkAllAchievementsAfterStateChange} from '../achievements/checker';

export type EventType = GameEvent['category'];

const pools: Record<EventType, GameEvent[]> = {
  life: lifeEvents,
  love: loveEvents,
  market: marketEvents,
  company: companyEvents,
  casino: casinoEvents,
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const getRandomEvent = (pool: GameEvent[], category: EventType): GameEvent => {
  if (!pool.length) {
    return {
      id: `fallback_${category}`,
      category,
      text: 'Bugün önemli bir olay yaşanmadı.',
      effects: {},
      tags: ['placeholder'],
      aiGenerated: false,
    };
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

export const applyEventEffects = (event: GameEvent) => {
  const {effects = {}} = event;
  const stats = useStatsStore.getState();
  const {setField} = useStatsStore.getState();

  if (typeof effects.money === 'number') {
    setField('money', stats.money + effects.money);
  }
  if (typeof effects.health === 'number') {
    setField('health', stats.health + effects.health);
  }
  if (typeof effects.stress === 'number') {
    setField('stress', stats.stress + effects.stress);
  }
  if (typeof effects.charisma === 'number') {
    setField('charisma', stats.charisma + effects.charisma);
  }
  if (typeof effects.reputation === 'number') {
    const next = clamp(stats.reputation + effects.reputation);
    setField('reputation', next);
  }
  if (typeof effects.love === 'number') {
    const next = clamp(stats.love + effects.love);
    setField('love', next);
  }
  if (typeof effects.companyValue === 'number') {
    setField('companyValue', stats.companyValue + effects.companyValue);
  }
  if (typeof effects.casinoReputation === 'number') {
    const casinoValue = clamp(stats.casinoReputation + effects.casinoReputation);
    setField('casinoReputation', casinoValue);
  }

  const handledKeys = [
    'money',
    'health',
    'stress',
    'charisma',
    'reputation',
    'love',
    'companyValue',
    'casinoReputation',
  ];
  const pendingKeys = Object.keys(effects).filter(key => !handledKeys.includes(key));
  if (pendingKeys.length) {
    console.log('[EventEngine] Effects fields pending implementation', pendingKeys);
  }

  if (Object.keys(effects).length) {
    console.log('[EventEngine] Effects applied', effects);
  }
  checkAllAchievementsAfterStateChange();
};

export const triggerEvent = async (type: EventType): Promise<GameEvent> => {
  const shouldAI = Math.random() < 0.3;
  const pool = pools[type] ?? [];
  const {hasPremium} = useUserStore.getState();
  const eventObj = shouldAI
    ? await buildAIEvent(type, useStatsStore.getState(), hasPremium)
    : getRandomEvent(pool, type);

  applyEventEffects(eventObj);

  const {
    setLastLifeEvent,
    setLastLoveEvent,
    setLastMarketEvent,
    setLastCompanyEvent,
    setLastCasinoEvent,
    incrementCompanyEventCount,
  } = useEventStore.getState();

  switch (type) {
    case 'life':
      setLastLifeEvent(eventObj.text);
      break;
    case 'love':
      setLastLoveEvent(eventObj.text);
      break;
    case 'market':
      setLastMarketEvent(eventObj.text);
      break;
    case 'company':
      setLastCompanyEvent(eventObj.text);
      incrementCompanyEventCount?.();
      break;
    case 'casino':
      setLastCasinoEvent(eventObj.text);
      break;
    default:
      break;
  }

  return eventObj;
};

export const simulateNewMonth = () => {
  console.log('[EventEngine] New month simulated (placeholder)');
  // TODO: Update markets, company valuation, and other monthly systems here.
};

export const simulateNewDay = simulateNewMonth;
