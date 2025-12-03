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

export async function buildAIEvent(
  category: GameEvent['category'],
  playerState: any,
): Promise<GameEvent> {
  const picks = templates[category];
  const text = picks[Math.floor(Math.random() * picks.length)];

  return {
    id: `ai_${category}_${Date.now()}`,
    category,
    text,
    effects: {
      money: Math.floor(Math.random() * 2000 - 1000),
      stress: Math.floor(Math.random() * 3 - 1),
      charisma: Math.random() < 0.3 ? 1 : 0,
    },
    aiGenerated: true,
    tags: ['dynamic'],
  };
}
