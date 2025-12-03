export interface GameEvent {
  id: string;
  category: 'life' | 'love' | 'market' | 'company' | 'casino';
  text: string;
  effects: {
    money?: number;
    health?: number;
    stress?: number;
    charisma?: number;
    reputation?: number;
    love?: number;
    companyValue?: number;
    casinoReputation?: number;
  };
  tags?: string[];
  aiGenerated?: boolean;
}

export const lifeEvents: GameEvent[] = [
  {
    id: 'life_001',
    category: 'life',
    text: 'Bir influencer partisine davet edildin, ortam lükstü.',
    effects: {charisma: 2, stress: -1},
    tags: ['social'],
    aiGenerated: false,
  },
  {
    id: 'life_002',
    category: 'life',
    text: 'Lüks bir restoran çıkışında paparazziler seni görüntüledi.',
    effects: {charisma: 1},
    tags: ['media'],
    aiGenerated: false,
  },
  {
    id: 'life_003',
    category: 'life',
    text: 'Boş bir gününde şehirde sakin bir yürüyüş yaptın.',
    effects: {stress: -2},
    tags: ['calm'],
    aiGenerated: false,
  },
];

export const loveEvents: GameEvent[] = [
  {
    id: 'love_001',
    category: 'love',
    text: 'Partnerin sürpriz bir mesajla gününü güzelleştirdi.',
    effects: {stress: -1, charisma: 1},
    tags: ['warm'],
    aiGenerated: false,
  },
  {
    id: 'love_002',
    category: 'love',
    text: 'Romantik bir akşam yemeği için rezervasyon yaptın.',
    effects: {charisma: 1},
    tags: ['date'],
    aiGenerated: false,
  },
  {
    id: 'love_003',
    category: 'love',
    text: 'Aranızda samimi bir sohbet geçti ve bağınız güçlendi.',
    effects: {stress: -1},
    tags: ['bond'],
    aiGenerated: false,
  },
];

export const marketEvents: GameEvent[] = [
  {
    id: 'market_001',
    category: 'market',
    text: 'Analist raporu tech hisselerinde iyimser bir hava yarattı.',
    effects: {money: 1200},
    tags: ['bull'],
    aiGenerated: false,
  },
  {
    id: 'market_002',
    category: 'market',
    text: 'Piyasada beklenmedik bir volatilite dalgası oluştu.',
    effects: {money: -800, stress: 1},
    tags: ['volatility'],
    aiGenerated: false,
  },
  {
    id: 'market_003',
    category: 'market',
    text: 'Bir fon yöneticisi sana özel bir bilgi paylaştı.',
    effects: {charisma: 1},
    tags: ['insight'],
    aiGenerated: false,
  },
];

export const companyEvents: GameEvent[] = [
  {
    id: 'company_001',
    category: 'company',
    text: 'Yönetim kurulu yeni bir yatırım önerisini onayladı.',
    effects: {companyValue: 250_000},
    tags: ['board'],
    aiGenerated: false,
  },
  {
    id: 'company_002',
    category: 'company',
    text: 'Önemli bir çalışan kritik bir iyileştirme önerdi.',
    effects: {companyValue: 120_000},
    tags: ['ops'],
    aiGenerated: false,
  },
  {
    id: 'company_003',
    category: 'company',
    text: 'Basında şirketin hakkında olumlu bir haber çıktı.',
    effects: {charisma: 1},
    tags: ['media'],
    aiGenerated: false,
  },
];

export const casinoEvents: GameEvent[] = [
  {
    id: 'casino_001',
    category: 'casino',
    text: 'Masa başında dealer seni sıcak karşıladı.',
    effects: {casinoReputation: 2},
    tags: ['social'],
    aiGenerated: false,
  },
  {
    id: 'casino_002',
    category: 'casino',
    text: 'Yan masada büyük bir kazanç tüm salonu hareketlendirdi.',
    effects: {stress: -1},
    tags: ['energy'],
    aiGenerated: false,
  },
  {
    id: 'casino_003',
    category: 'casino',
    text: 'Gözlem yaparken yeni bir bahis taktiği öğrendin.',
    effects: {charisma: 1},
    tags: ['skill'],
    aiGenerated: false,
  },
];
