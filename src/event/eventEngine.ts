import {useEventStore, useStatsStore} from '../store';
import {
  lifeEvents,
  loveEvents,
  marketEvents,
  companyEvents,
  casinoEvents,
  type GameEvent,
} from './eventTemplates';
import {buildAIEvent} from './aiEventBuilder';

export type EventType = GameEvent['category'];

const pools: Record<EventType, GameEvent[]> = {
  life: lifeEvents,
  love: loveEvents,
  market: marketEvents,
  company: companyEvents,
  casino: casinoEvents,
};

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
  if (typeof effects.companyValue === 'number') {
    setField('companyValue', stats.companyValue + effects.companyValue);
  }
  if (typeof effects.casinoReputation === 'number') {
    const next = Math.min(100, Math.max(0, stats.casinoReputation + effects.casinoReputation));
    setField('casinoReputation', next);
  }

  const handledKeys = [
    'money',
    'health',
    'stress',
    'charisma',
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
};

export const triggerEvent = async (type: EventType): Promise<GameEvent> => {
  const shouldAI = Math.random() < 0.3;
  const pool = pools[type] ?? [];
  const eventObj = shouldAI
    ? await buildAIEvent(type, useStatsStore.getState())
    : getRandomEvent(pool, type);

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

  applyEventEffects(eventObj);
  return eventObj;
};

export const simulateNewDay = () => {
  console.log('[EventEngine] New day simulated (placeholder)');
  // TODO: Update markets, company valuation, and other daily systems here.
};
