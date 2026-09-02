export type ProductCategory =
    | 'REAL_ESTATE' | 'VEHICLE' | 'MARINE' | 'AIRCRAFT' | 'WATCH' | 'JEWELRY'
    // The top of the market, and the most expensive thing in the game to own.
    // See data/categories/space.ts for why it exists and core/luxury for what
    // it costs: the worst upkeep, the worst decay and the worst drift, all in
    // one department.
    | 'SPACE';

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
    /**
     * SHELVED. A shop's colour comes from `data/shopIdentity.shopTheme` now.
     *
     * Five values across twenty seven shops, two of them greys, so a boutique
     * watchmaker and a defence contractor were the same colour. Kept on the
     * data rather than stripped out of eighty five records, and pinned by a
     * test so nothing reads it again.
     */
    bannerColor: string;
    /**
     * SHELVED. Same reason, and worse.
     *
     * Emoji is a font the game does not control, drawn by the operating
     * system, in somebody else's colours, and it is the one element on the
     * screen that ignores the palette entirely - which is why it read as older
     * than everything round it. Two shops led with a crown, two with a trophy,
     * two with a diamond. See `SHOP_IDENTITY`.
     */
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
