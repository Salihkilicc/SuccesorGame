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
    /**
     * How many game quarters this has been owned for.
     *
     * `purchaseDate` is `Date.now()` - real world time, which has nothing to
     * do with the game's calendar and cannot be used to age anything. A save
     * loaded a year later would find its whole collection had aged a year.
     *
     * Optional because saves made before the market drift existed do not carry
     * it, and a missing count reads as nought - which values an old asset at
     * its sticker price rather than at a number derived from garbage.
     */
    quartersOwned?: number;
}
