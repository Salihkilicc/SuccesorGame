import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { theme } from '../../../core/theme';
import { SHOPS } from '../data/ShoppingData';

const { width } = Dimensions.get('window');

type AdBannerCarouselProps = {
    onPressBanner: (shopId: string) => void;
};

const ADS = [
    {
        id: 'ad_velocity',
        shopId: 'shop_velocity_motors',
        title: 'Velocity Motors',
        subtitle: 'Start Your Legacy',
        cta: 'Drive Now →',
        color: '#E74C3C',
        emoji: '🏎️',
    },
    {
        id: 'ad_dynasty',
        shopId: 'shop_dynasty8',
        title: 'Dynasty 8',
        subtitle: 'Live Above the Clouds',
        cta: 'View Estates →',
        color: '#2C3E50',
        emoji: '🏠',
    },
    {
        id: 'ad_poseidon',
        shopId: 'shop_poseidon_yards',
        title: 'Poseidon Yards',
        subtitle: 'Summer Sale: Conquer the Ocean',
        cta: 'Set Sail →',
        color: '#3498DB',
        emoji: '⛵',
    },
];

const AdBannerCarousel = ({ onPressBanner }: AdBannerCarouselProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={width * 0.75 + theme.spacing.md}
            >
                {ADS.map((ad) => {
                    // find shop to ensure it exists
                    const shop = SHOPS.find(s => s.id === ad.shopId);
                    if (!shop) return null;

                    return (
                        <Pressable
                            key={ad.id}
                            onPress={() => onPressBanner(ad.shopId)}
                            style={({ pressed }) => [
                                styles.banner,
                                { backgroundColor: ad.color },
                                pressed && styles.pressed
                            ]}
                        >
                            <View style={styles.bannerHeader}>
                                <Text style={styles.emoji}>{ad.emoji}</Text>
                                <View style={styles.ctaBadge}>
                                    <Text style={styles.ctaText}>{ad.cta}</Text>
                                </View>
                            </View>

                            <View>
                                <Text style={styles.title}>{ad.title}</Text>
                                <Text style={styles.subtitle}>{ad.subtitle}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default AdBannerCarousel;

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    banner: {
        width: width * 0.75,
        height: 180,
        borderRadius: 20,
        padding: theme.spacing.xl,
        justifyContent: 'space-between',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    emoji: {
        fontSize: 42,
    },
    ctaBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: 8,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        letterSpacing: 0.3,
    },
});
