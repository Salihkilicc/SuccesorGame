// ============================================================================
// LUXENET - Type Definitions
// ============================================================================

export interface Shop {
    id: string;
    name: string;
    url: string;
    category: 'VEHICLE' | 'REAL_ESTATE' | 'WATCH' | 'JEWELRY' | 'MARINE' | 'AIRCRAFT';
    description: string;
    bannerColor: string;
    emoji: string;
}

export interface Item {
    id: string;
    shopId: string;
    name: string;
    price: number;
    type: string;
    brand: string;
    category: 'VEHICLE' | 'REAL_ESTATE' | 'WATCH' | 'JEWELRY' | 'MARINE' | 'AIRCRAFT';
    specs: string[];
    description: string;
}

export interface CategoryData {
    shops: Shop[];
    items: Item[];
}
