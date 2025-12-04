import type {GameEvent} from './eventTemplates';

const templates: Record<GameEvent['category'], string[]> = {
  life: [
    'Bugün ultra lüks bir açılışa davet edildin.',
    'LA’de özel bir toplantıya katıldın.',
    'Sosyal çevrenden ilginç bir teklif aldın.',
  ],
  love: [
    'Partnerin sana sürpriz bir mesaj attı.',
    'Romantik bir jest planladın.',
    'Aranızda duygusal bir an yaşandı.',
  ],
  market: [
    'Piyasada agresif bir hareket algıladın.',
    'Bir analist raporu seni düşündürdü.',
    'Beklenmedik bir volatilite oluştu.',
  ],
  company: [
    'Yönetim kurulu sana olağanüstü bir konuda danıştı.',
    'Yeni bir yatırım fırsatı önüne düştü.',
    'Bir çalışan kritik bir öneride bulundu.',
  ],
  casino: [
    'Masa başında beklenmedik bir enerji hissettin.',
    'Krupiye seni dikkatle izledi.',
    'Salonda havayı değiştiren kısa bir an yaşandı.',
  ],
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const effectBuilders: Record<GameEvent['category'], () => GameEvent['effects']> = {
  life: () => ({
    charisma: randomInt(-1, 2),
    stress: randomInt(-2, 1),
    health: randomInt(-1, 2),
  }),
  love: () => ({
    love: randomInt(-1, 3),
    charisma: randomInt(0, 1),
    stress: randomInt(-1, 1),
  }),
  market: () => ({
    money: randomInt(-1200, 1500),
    stress: randomInt(-1, 2),
    reputation: randomInt(-1, 1),
  }),
  company: () => ({
    companyValue: randomInt(-80_000, 160_000),
    reputation: randomInt(-1, 2),
    stress: randomInt(-1, 1),
  }),
  casino: () => ({
    money: randomInt(-600, 1200),
    casinoReputation: randomInt(-1, 3),
    stress: randomInt(-1, 1),
  }),
};

export async function buildAIEvent(
  category: GameEvent['category'],
  _playerState: any,
  isPremiumUser = false,
): Promise<GameEvent> {
  const picks = templates[category];
  const text = picks[Math.floor(Math.random() * picks.length)];

  // playerState ileride gerçek AI yönlendirmesi için kullanılacak
  const effects = effectBuilders[category]();

  if (isPremiumUser) {
    if (typeof effects.money === 'number') {
      effects.money += randomInt(50, 250);
    }
    if (typeof effects.stress === 'number') {
      effects.stress = Math.min(effects.stress, effects.stress - 1);
    }
    if (typeof effects.charisma === 'number') {
      effects.charisma = Math.max(effects.charisma, effects.charisma + 1);
    }
  }

  return {
    id: `ai_${category}_${Date.now()}`,
    category,
    text,
    effects,
    aiGenerated: true,
    tags: ['dynamic'],
  };
}
