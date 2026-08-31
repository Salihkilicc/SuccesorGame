// src/data/i18n/casinoText.ts
import { useLocaleStore } from '../../core/i18n';

/**
 * Complete Casino localization module.
 * Provides helpers for city destinations, subtitles, VIP ranks, room cards,
 * outside table bets, and dynamic game round statuses.
 * Guarantees strict English isolation: returns English when locale === 'en'.
 */

const CITY_EN_TO_TR: Record<string, string> = {
  'Athens': 'Atina',
  'ATHENS': 'ATİNA',
  'Istanbul': 'İstanbul',
  'ISTANBUL': 'İSTANBUL',
  'Las Vegas': 'Las Vegas',
  'LAS VEGAS': 'LAS VEGAS',
  'London': 'Londra',
  'LONDON': 'LONDRA',
  'Singapore': 'Singapur',
  'SINGAPORE': 'SİNGAPUR',
  'Monte Carlo': 'Monte Carlo',
  'MONTE CARLO': 'MONTE CARLO',
  'Macau': 'Makao',
  'MACAU': 'MAKAO',
};

const CITY_TR_TO_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(CITY_EN_TO_TR)) {
  CITY_TR_TO_EN[tr] = en;
}

const SUBTITLE_EN_TO_TR: Record<string, string> = {
  'The Agora': 'Agora',
  'Bosphorus Royale': 'Boğaziçi Royale',
  'Neon Palace': 'Neon Sarayı',
  'The Crown Club': 'Crown Club',
  'Marina Bay Heights': 'Marina Bay Heights',
  'Le Grand Casino': 'Le Grand Casino',
  "Dragon's Ascendancy": 'Ejderha Yükselişi',
};

const SUBTITLE_TR_TO_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(SUBTITLE_EN_TO_TR)) {
  SUBTITLE_TR_TO_EN[tr] = en;
}

const RANK_EN_TO_TR: Record<string, string> = {
  'High Roller': 'Yüksek Bahisçi',
  'HIGH ROLLER': 'YÜKSEK BAHİSÇİ',
  'VIP Lounge': 'VIP Salonu',
  'VIP LOUNGE': 'VIP SALONU',
  'VIP': 'VIP',
  'Gambler': 'Kumarbaz',
  'GAMBLER': 'KUMARBAZ',
  'Member': 'Üye',
  'MEMBER': 'ÜYE',
};

const RANK_TR_TO_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(RANK_EN_TO_TR)) {
  RANK_TR_TO_EN[tr] = en;
}

const BADGE_EN_TO_TR: Record<string, string> = {
  '3:2 PAYOUT': '3:2 ÖDEME',
  '35:1 SINGLE ZERO': '35:1 TEK SIFIR',
  'MEGA JACKPOT': 'MEGA JACKPOT',
  'NO LIMIT VIP': 'LİMİTSİZ VIP',
};

const BADGE_TR_TO_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(BADGE_EN_TO_TR)) {
  BADGE_TR_TO_EN[tr] = en;
}

export const translateCasinoLocationName = (name: string): string => {
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    return CITY_TR_TO_EN[name] || name;
  }
  return CITY_EN_TO_TR[name] || name;
};

export const translateCasinoLocationSubtitle = (subtitle: string): string => {
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    return SUBTITLE_TR_TO_EN[subtitle] || subtitle;
  }
  return SUBTITLE_EN_TO_TR[subtitle] || subtitle;
};

export const translateCasinoRank = (rank: string): string => {
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    return RANK_TR_TO_EN[rank] || rank;
  }
  return RANK_EN_TO_TR[rank] || rank;
};

export const translateCasinoBadge = (badge?: string): string => {
  if (!badge) return '';
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    return BADGE_TR_TO_EN[badge] || badge;
  }
  return BADGE_EN_TO_TR[badge] || badge;
};

export const translateDozenBet = (label: string): string => {
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    if (label === '1. 12') return '1st 12';
    if (label === '2. 12') return '2nd 12';
    if (label === '3. 12') return '3rd 12';
    return label;
  }
  if (label === '1st 12') return '1. 12';
  if (label === '2nd 12') return '2. 12';
  if (label === '3rd 12') return '3. 12';
  return label;
};

export const translateOutsideBet = (label: string): string => {
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    if (label === 'ÇİFT') return 'EVEN';
    if (label === 'TEK') return 'ODD';
    if (label === '◆ KIRMIZI') return '◆ RED';
    if (label === '◆ SİYAH') return '◆ BLACK';
    return label;
  }
  if (label === 'EVEN') return 'ÇİFT';
  if (label === 'ODD') return 'TEK';
  if (label === '◆ RED') return '◆ KIRMIZI';
  if (label === '◆ BLACK') return '◆ SİYAH';
  return label;
};

export const translateCasinoStatus = (status: string): string => {
  if (!status) return '';
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    // Reverse lookup if text was somehow Turkish
    if (status === 'Bahsinizi koyun ve dağıtın.') return 'Place your bet and deal.';
    if (status === 'Sıra sizde: KART ÇEK veya KAL.') return 'Your move: HIT or STAND.';
    if (status === 'Blackjack! Özel kazanç.') return 'Blackjack! Premium payout.';
    if (status === 'Berabere. Bahis iade edildi.') return 'Push. Bet returned.';
    if (status === 'Battınız veya krupiye kazandı.') return 'Bust or dealer wins.';
    if (status === '2 kişilik Hold’em. Kademeli bahis.' || status === "2 kişilik Hold'em. Kademeli bahis.") {
      return '2-player Hold’em. Progressive betting.';
    }
    if (status === 'Flop açıldı. Bahsi ikiye katlamak için devam edin.') return 'Flop dealt. Continue to double bet.';
    if (status === 'Turn açıldı. Bahsi üçe katlamak için devam edin.') return 'Turn revealed. Continue to triple bet.';
    if (status === 'River açıldı. Kartlar açılsın!') return 'River revealed. Showdown!';
    if (status === 'Berabere. Bahisler iade edildi.') return 'Push. Bets returned.';
    if (status === 'Yeni el için hazır.') return 'Ready for next hand.';
    if (status === 'Çiplerinizi masaya yerleştirin.') return 'Place your chips on the table.';
    if (status === 'Dönüyor...') return 'Spinning...';
    if (status === 'Bu sefer şans yaver gitmedi.') return 'No luck this time.';
    if (status === 'Çevirmeye hazır') return 'Ready to spin';
    if (status === 'Eşleşme yok.') return 'No match.';
    return status;
  }

  // Exact matches
  switch (status.trim()) {
    // Blackjack
    case 'Place your bet and deal.':
      return 'Bahsinizi koyun ve dağıtın.';
    case 'Your move: HIT or STAND.':
      return 'Sıra sizde: KART ÇEK veya KAL.';
    case 'Blackjack! Premium payout.':
      return 'Blackjack! Özel kazanç.';
    case 'Push. Bet returned.':
      return 'Berabere. Bahis iade edildi.';
    case 'Bust or dealer wins.':
      return 'Battınız veya krupiye kazandı.';

    // Poker
    case '2-player Hold’em. Progressive betting.':
    case "2-player Hold'em. Progressive betting.":
      return "2 kişilik Hold'em. Kademeli bahis.";
    case 'Flop dealt. Continue to double bet.':
      return 'Flop açıldı. Bahsi ikiye katlamak için devam edin.';
    case 'Turn revealed. Continue to triple bet.':
      return 'Turn açıldı. Bahsi üçe katlamak için devam edin.';
    case 'River revealed. Showdown!':
      return 'River açıldı. Kartlar açılsın!';
    case 'Push. Bets returned.':
      return 'Berabere. Bahisler iade edildi.';
    case 'Ready for next hand.':
      return 'Yeni el için hazır.';

    // Roulette
    case 'Place your chips on the table.':
      return 'Çiplerinizi masaya yerleştirin.';
    case 'Spinning...':
      return 'Dönüyor...';
    case 'No luck this time.':
      return 'Bu sefer şans yaver gitmedi.';

    // Slots
    case 'Ready to spin':
      return 'Çevirmeye hazır';
    case 'No match.':
      return 'Eşleşme yok.';
  }

  // Dynamic regex matches
  // "You win 1,000,000!" or "You win $1,000,000!"
  const winMatch1 = status.match(/^You win (.*?)(!)?$/i);
  if (winMatch1) {
    return `${winMatch1[1]} kazandınız!`;
  }

  // "Won $1,000,000!"
  const winMatch2 = status.match(/^Won (.*?)(!)?$/i);
  if (winMatch2) {
    return `${winMatch2[1]} kazandınız!`;
  }

  // "Folded. You lost $1,000."
  const foldMatch = status.match(/^Folded\. You lost (.*?)\.$/i);
  if (foldMatch) {
    return `Çekildiniz. ${foldMatch[1]} kaybettiniz.`;
  }

  // "You win! Score: 42 vs 38"
  const scoreWinMatch = status.match(/^You win! Score: (\d+) vs (\d+)$/i);
  if (scoreWinMatch) {
    return `Kazandınız! Skor: ${scoreWinMatch[1]} vs ${scoreWinMatch[2]}`;
  }

  // "Dealer wins. Score: 45 vs 40"
  const scoreDealerMatch = status.match(/^Dealer wins\. Score: (\d+) vs (\d+)$/i);
  if (scoreDealerMatch) {
    return `Krupiye kazandı. Skor: ${scoreDealerMatch[1]} vs ${scoreDealerMatch[2]}`;
  }

  // "JACKPOT! +$50,000"
  const jackpotMatch = status.match(/^JACKPOT!\s*(\+\$[0-9,]+)/i);
  if (jackpotMatch) {
    return `JACKPOT! ${jackpotMatch[1]}`;
  }

  // "MINI WIN! +$10,000"
  const miniWinMatch = status.match(/^MINI WIN!\s*(\+\$[0-9,]+)/i);
  if (miniWinMatch) {
    return `MİNİ KAZANÇ! ${miniWinMatch[1]}`;
  }

  return status;
};

const ALERT_EN_TO_TR: Record<string, string> = {
  'Place Bet': 'Bahis Koyun',
  'Please place a bet on the table.': 'Lütfen masaya bir bahis koyun.',
  'Not enough cash': 'Yetersiz Bakiye',
  'Lower your bet or build more bankroll.': 'Bahsinizi düşürün veya kasanızı artırın.',
  'The ante is required to play.': 'Oynamak için ortaya bahis koymanız gerekir.',
  'You need more funds to continue.': 'Devam etmek için daha fazla paraya ihtiyacınız var.',
  'Place your chips on the table first.': 'Önce çiplerinizi masaya yerleştirin.',
  "You don't have enough to place this bet.": 'Bu bahsi koymak için yeterli paranız yok.',
  "You don't have enough to cover your bets.": 'Bahislerinizi karşılayacak kadar paranız yok.',
  'Select a chip to play!': 'Oynamak için bir çip seçin!',
  'Funds': 'Bakiye',
  "You don't have enough cash!": 'Yeterli nakdiniz yok!',
};

const ALERT_TR_TO_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(ALERT_EN_TO_TR)) {
  ALERT_TR_TO_EN[tr] = en;
}

export const translateCasinoAlert = (text: string): string => {
  if (!text) return '';
  const locale = useLocaleStore.getState().locale;
  if (locale === 'en') {
    return ALERT_TR_TO_EN[text] || text;
  }
  if (ALERT_EN_TO_TR[text]) {
    return ALERT_EN_TO_TR[text];
  }
  const needMatch = text.match(/^You need (.*?) to start\.$/i);
  if (needMatch) {
    return `Başlamak için ${needMatch[1]} tutarına ihtiyacınız var.`;
  }
  return text;
};

export const casinoAlert = (title: string, message?: string) => {
  const { Alert } = require('react-native');
  Alert.alert(translateCasinoAlert(title), message ? translateCasinoAlert(message) : undefined);
};

