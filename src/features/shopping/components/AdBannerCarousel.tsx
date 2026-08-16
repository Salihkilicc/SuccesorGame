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

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width * 0.76;

type AdBannerCarouselProps = {
    onPressBanner: (shopId: string) => void;
};

const ADS = [
    {
        id: 'ad_velocity',
        shopId: 'shop_velocity_motors',
        title: 'Velocity Motors',
        subtitle: 'Bespoke Track & Road Hypercars',
        cta: 'Drive Now →',
        icon: 'car-sports',
    },
    {
        id: 'ad_dynasty',
        shopId: 'shop_dynasty8',
        title: 'Dynasty 8 Luxury',
        subtitle: 'Live Above The Clouds In Bel Air',
        cta: 'View Estates →',
        icon: 'home-city-outline',
    },
    {
        id: 'ad_poseidon',
        shopId: 'shop_poseidon_yards',
        title: 'Poseidon Superyachts',
        subtitle: 'Flagship Megayachts & Transatlantic Luxury',
        cta: 'Set Sail →',
        icon: 'ferry',
    },
];

export const AdBannerCarousel: React.FC<AdBannerCarouselProps> = ({ onPressBanner }) => {
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
                {ADS.map((ad) => {
                    const shop = SHOPS.find((s) => s.id === ad.shopId);
                    if (!shop) return null;

                    return (
                        <Pressable
                            key={ad.id}
                            onPress={() => onPressBanner(ad.shopId)}
                            style={({ pressed }) => [
                                styles.banner,
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={styles.bannerHeader}>
                                <View style={styles.iconWrap}>
                                    <MaterialCommunityIcons
                                        name={ad.icon as any}
                                        size={22}
                                        color="#05A8F6"
                                    />
                                </View>
                                <View style={styles.ctaBadge}>
                                    <Text style={styles.ctaText}>{ad.cta}</Text>
                                </View>
                            </View>

                            <View style={styles.infoBlock}>
                                <Text style={styles.title}>{ad.title}</Text>
                                <Text style={styles.subtitle} numberOfLines={1}>
                                    {ad.subtitle}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
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
