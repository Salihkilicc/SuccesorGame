export type ProductCategory = 'REAL_ESTATE' | 'VEHICLE' | 'MARINE' | 'AIRCRAFT' | 'WATCH' | 'JEWELRY';

export type ShopId = string;

export interface ShoppingItem {
    id: string;
    shopId: string;
    name: string;
    price: number;
    category: ProductCategory;
    specs: string[];
    description: string;
    brandColor?: string;
    website?: string;
    // Additional fields found in data
    type?: string;
    brand?: string;
}

export interface Shop {
    id: string;
    name: string;
    url: string;
    category: ProductCategory;
    description: string;
    bannerColor: string;
    emoji: string;
}

export interface OwnedAsset extends ShoppingItem {
    instanceId: string;
    purchaseDate: number;
    condition: number;
    marketValue: number;
}
