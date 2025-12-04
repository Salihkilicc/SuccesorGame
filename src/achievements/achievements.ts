export type AchievementCategory = 'wealth' | 'company' | 'love' | 'lifestyle' | 'casino' | 'meta';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  hidden?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'wealth_001',
    title: 'First 100K',
    description: 'Net worth 100K’ye ulaştığında açılır.',
    category: 'wealth',
  },
  {
    id: 'wealth_002',
    title: 'First Million',
    description: 'Net worth 1M’ye ulaştığında açılır.',
    category: 'wealth',
  },
  {
    id: 'company_001',
    title: 'CEO Level Up',
    description: 'Company value 10M olduğunda açılır.',
    category: 'company',
  },
  {
    id: 'love_001',
    title: 'Serious Relationship',
    description: 'Love %80 üzerine çıktığında.',
    category: 'love',
  },
  {
    id: 'lifestyle_001',
    title: 'Nightlife Enthusiast',
    description: '10 kere Night Out yaptığında.',
    category: 'lifestyle',
  },
  {
    id: 'casino_001',
    title: 'High Roller',
    description: 'High Roller odasında büyük bir bet kazandığında.',
    category: 'casino',
  },
  {
    id: 'casino_002',
    title: 'Silent Shark',
    description: 'Casio’da gizli bir başarı elde ettiğinde.',
    category: 'casino',
    hidden: true,
  },
  {
    id: 'meta_001',
    title: 'Month Ten',
    description: '10. aya ulaştığında.',
    category: 'meta',
  },
  {
    id: 'meta_002',
    title: 'Well Rounded',
    description: 'Charisma, health ve luck 70 üzerine çıktığında.',
    category: 'meta',
  },
  {
    id: 'lifestyle_002',
    title: 'Globetrotter',
    description: '5 farklı Travel aksiyonu yaptığında.',
    category: 'lifestyle',
  },
];
