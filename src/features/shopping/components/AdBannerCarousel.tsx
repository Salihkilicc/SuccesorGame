import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { theme } from '../../../core/theme';
import { SHOPS } from '../data/shoppingRegistry';

const { width } = Dimensions.get('window');

type AdBannerCarouselProps = {
    onPressBanner: (shopId: string) => void;
};

const ADS = [
    {
        id: 'ad_velocity',
        shopId: 'shop_velocity_motors',
        title: t('ui.velocityMotors'),
        subtitle: t('ui.startYourLegacy'),
        cta: 'Drive Now →',
        color: '#E9B8C9',
        emoji: '🏎️',
    },
    {
        id: 'ad_dynasty',
        shopId: 'shop_dynasty8',
        title: t('ui.dynasty8'),
        subtitle: t('ui.liveAboveTheClouds'),
        cta: 'View Estates →',
        color: '#674C41',
        emoji: '🏠',
    },
    {
        id: 'ad_poseidon',
        shopId: 'shop_poseidon_yards',
        title: t('ui.poseidonYards'),
        subtitle: t('ui.summerSaleConquerTheOcean'),
        cta: 'Set Sail →',
        color: '#5992C6',
        emoji: '⛵',
    },
];

const AdBannerCarousel = ({ onPressBanner }: AdBannerCarouselProps) => {
    useLocale();
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('ui.featured')}</Text>
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
        color: '#FFFFFF',
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
        shadowColor: '#31241F',
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
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        letterSpacing: 0.3,
    },
});
