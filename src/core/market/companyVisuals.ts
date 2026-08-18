export interface CompanyVisual {
  icon: string;
  color: string;
  badgeBorder: string;
  badgeBg: string;
  tierLabel: string;
  tierColor: string;
}

/**
 * Returns a tailored MaterialCommunityIcons name, theme color, and valuation tier styling
 * for any company in the game (Acquisitions / Hostile Takeover / My Empire subsidiaries).
 */
export const getCompanyVisual = (item: any, valuation: number = 0): CompanyVisual => {
  const id = (item?.id || '').toLowerCase();
  const symbol = (item?.symbol || '').toLowerCase();
  const name = (item?.name || '').toLowerCase();
  const sector = (item?.sector || item?.category || '').toLowerCase();

  let icon = 'domain';
  let color = '#38BDF8';

  // 1. Specific company brand mapping
  if (symbol === 'pear' || id.includes('pear') || name.includes('pear')) {
    icon = 'fruit-cherries';
    color = '#F43F5E';
  } else if (symbol === 'mcrh' || id.includes('micro') || name.includes('microhard')) {
    icon = 'microsoft-windows';
    color = '#38BDF8';
  } else if (symbol === 'chip' || id.includes('chip') || name.includes('novidia')) {
    icon = 'chip';
    color = '#10B981';
  } else if (symbol === 'face' || id.includes('face') || name.includes('facespace')) {
    icon = 'account-group';
    color = '#60A5FA';
  } else if (symbol === 'ai' || symbol === 'chat' || id.includes('ai') || name.includes('openai') || name.includes('chatai')) {
    icon = 'robot-outline';
    color = '#A78BFA';
  } else if (symbol === 'sknt' || id.includes('skynet') || name.includes('skynet')) {
    icon = 'skull-scan-outline';
    color = '#EF4444';
  } else if (symbol === 'volt' || symbol === 'tsla' || id.includes('volt') || id.includes('edison')) {
    icon = 'car-electric';
    color = '#FBBF24';
  } else if (symbol === 'plnr' || id.includes('planora')) {
    icon = 'calendar-check-outline';
    color = '#38BDF8';
  } else if (symbol === 'flix' || symbol === 'stfy' || symbol === 'spot' || id.includes('stream') || id.includes('spot')) {
    icon = 'play-box-outline';
    color = '#E11D48';
  } else if (symbol === 'crm' || id.includes('sales')) {
    icon = 'cloud-outline';
    color = '#0284C7';
  } else if (symbol === 'intc' || id.includes('intel')) {
    icon = 'cpu-64-bit';
    color = '#0369A1';
  } else if (symbol === 'adbe' || id.includes('adobe')) {
    icon = 'palette-outline';
    color = '#E11D48';
  } else if (symbol === 'pfe' || id.includes('pfiz') || symbol === 'bio' || symbol === 'vax') {
    icon = 'pill';
    color = '#10B981';
  } else if (symbol === 'unh' || symbol === 'care' || symbol === 'cure' || id.includes('cure') || id.includes('med')) {
    icon = 'hospital-box-outline';
    color = '#06B6D4';
  } else if (symbol === 'jnj' || id.includes('jnj')) {
    icon = 'shield-cross-outline';
    color = '#14B8A6';
  } else if (symbol === 'algn' || id.includes('fix')) {
    icon = 'tooth-outline';
    color = '#2DD4BF';
  } else if (symbol === 'hlf' || id.includes('pyramid')) {
    icon = 'leaf';
    color = '#84CC16';
  } else if (symbol === 'steel' || id.includes('rust')) {
    icon = 'anvil';
    color = '#F59E0B';
  } else if (symbol === 'luck' || id.includes('mine')) {
    icon = 'pickaxe';
    color = '#EAB308';
  } else if (symbol === 'spcy' || symbol === 'spce' || id.includes('space')) {
    icon = 'rocket-launch-outline';
    color = '#818CF8';
  } else if (symbol === 'fly' || symbol === 'lmt' || id.includes('air')) {
    icon = 'airplane';
    color = '#94A3B8';
  } else if (symbol === 'gmp' || id.includes('gm')) {
    icon = 'truck-flatbed';
    color = '#EA580C';
  } else if (symbol === 'gold' || symbol === 'jpm' || id.includes('gs') || id.includes('jpm')) {
    icon = 'bank';
    color = '#FBBF24';
  } else if (symbol === 'visa' || id.includes('visa')) {
    icon = 'credit-card-outline';
    color = '#3B82F6';
  } else if (symbol === 'bank' || id.includes('coin')) {
    icon = 'bitcoin';
    color = '#F97316';
  } else if (symbol === 'shark' || id.includes('shark')) {
    icon = 'shark';
    color = '#DC2626';
  } else if (symbol === 'strt' || id.includes('start')) {
    icon = 'lightning-bolt';
    color = '#FBBF24';
  } else {
    // Sector fallback
    if (sector.includes('tech') || sector.includes('ai') || sector.includes('soft') || sector.includes('elect')) {
      icon = 'laptop';
      color = '#38BDF8';
    } else if (sector.includes('ind') || sector.includes('manu') || sector.includes('prod')) {
      icon = 'factory';
      color = '#FBBF24';
    } else if (sector.includes('fin') || sector.includes('bank') || sector.includes('invest')) {
      icon = 'bank-outline';
      color = '#60A5FA';
    } else if (sector.includes('health') || sector.includes('bio') || sector.includes('pharma')) {
      icon = 'heart-pulse';
      color = '#34D399';
    } else if (sector.includes('lux') || sector.includes('jewel') || sector.includes('retail')) {
      icon = 'diamond-stone';
      color = '#F59E0B';
    }
  }

  // 2. Valuation Tier Border & Badging
  let tierLabel = 'MID-CAP';
  let tierColor = '#34D399';
  let badgeBorder = `${color}40`;
  let badgeBg = `${color}18`;

  if (valuation >= 500_000_000_000) {
    tierLabel = 'MEGA-CAP';
    tierColor = '#FBBF24'; // Gold
    badgeBorder = '#FBBF2480';
    badgeBg = '#FBBF2420';
  } else if (valuation >= 50_000_000_000) {
    tierLabel = 'LARGE-CAP';
    tierColor = '#A78BFA'; // Royal Purple
    badgeBorder = '#A78BFA70';
    badgeBg = '#A78BFA20';
  } else if (valuation >= 1_000_000_000) {
    tierLabel = 'MID-CAP';
    tierColor = '#38BDF8'; // Cyan
    badgeBorder = '#38BDF850';
    badgeBg = '#38BDF818';
  } else {
    tierLabel = 'SMALL-CAP';
    tierColor = '#94A3B8'; // Slate
    badgeBorder = '#94A3B840';
    badgeBg = '#94A3B815';
  }

  return {
    icon,
    color,
    badgeBorder,
    badgeBg,
    tierLabel,
    tierColor,
  };
};
