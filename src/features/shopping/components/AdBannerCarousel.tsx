// src/features/shopping/components/AdBannerCarousel.tsx
//
// ============================================================================
//  FEATURED LUXURY BOUTIQUE BANNERS
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { SHOPS } from '../data/shoppingRegistry';
import { featuredFor } from '../../../core/luxury/promotions';
import { currentQuarter } from '../../../core/story/world';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width * 0.76;

type AdBannerCarouselProps = {
    onPressBanner: (shopId: string) => void;
};

// ============================================================================
//  THE SAME THREE SHOPS BOUGHT THE FRONT PAGE FOREVER
// ============================================================================
//
//  SHELVED, and it is the whole defect in six lines: three ids typed here, out
//  of a catalogue of twenty seven, identical in the first quarter and the
//  fortieth.
//
//      const ADS = [
//          { id: 'ad_velocity',  shopId: 'shop_velocity_motors', ... },
//          { id: 'ad_dynasty',   shopId: 'shop_dynasty8',        ... },
//          { id: 'ad_poseidon',  shopId: 'shop_poseidon_yards',  ... },
//      ];
//
//  The rotation is now a pure function of the quarter, so it changes on its
//  own, works its way round the whole catalogue, and is the same after a
//  reload without anything being stored. See core/luxury/promotions.
//
//  AND THE BANNER IS NOT DECORATION. A shop with a campaign running says so,
//  and the discount it prints is read from the same function the checkout
//  charges from. There is no second number here to fall out of step.
// ============================================================================

/** Which symbol a department advertises itself with. */
const ICON_FOR: Record<string, string> = {
    VEHICLE: 'car-sports',
    REAL_ESTATE: 'home-city-outline',
    MARINE: 'ferry',
    AIRCRAFT: 'airplane',
    WATCH: 'watch',
    JEWELRY: 'diamond-stone',
};

export const AdBannerCarousel: React.FC<AdBannerCarouselProps> = ({ onPressBanner }) => {
    const featured = featuredFor(SHOPS, currentQuarter());

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>FEATURED BOUTIQUES</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH + 12}
            >
                {featured.map(({ shop, discount }) => (
                    <Pressable
                        key={shop.id}
                        onPress={() => onPressBanner(shop.id)}
                        style={({ pressed }) => [
                            styles.banner,
                            pressed && styles.pressed,
                        ]}
                    >
                        <View style={styles.bannerHeader}>
                            <View style={styles.iconWrap}>
                                <MaterialCommunityIcons
                                    name={(ICON_FOR[shop.category] || 'shopping-outline') as any}
                                    size={22}
                                    color="#05A8F6"
                                />
                            </View>
                            {/* The offer, or the invitation. NOT green: green
                                and red are profit and loss in this game. */}
                            <View style={[styles.ctaBadge, discount > 0 && styles.offerBadge]}>
                                <Text style={[styles.ctaText, discount > 0 && styles.offerText]}>
                                    {discount > 0
                                        ? `${Math.round(discount * 100)}% OFF`
                                        : 'VISIT'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoBlock}>
                            <Text style={styles.title}>{shop.name}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {shop.description}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#05A8F6',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    scrollContent: {
        gap: 12,
        paddingVertical: 2,
    },
    banner: {
        width: BANNER_WIDTH,
        backgroundColor: theme.colors.surface, // Solid surface, NO border
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        height: 125,
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#183D5C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaBadge: {
        backgroundColor: '#183D5C',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    /**
     * A shop with a campaign running.
     *
     * GOLD, not green. Every real shop makes a sale badge green and this game
     * has one colour rule it does not bend: green and red are profit and loss.
     * A discount is neither; it is an invitation.
     */
    offerBadge: {
        backgroundColor: '#4E3A20',
    },
    offerText: {
        color: '#FBBF24',
    },
    ctaText: {
        color: '#7DD3FC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    infoBlock: {
        marginTop: 6,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },
});

export default AdBannerCarousel;
