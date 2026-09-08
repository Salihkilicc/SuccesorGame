// src/features/products/components/ProductIcon.tsx
//
// ============================================================================
//  THE CATEGORY KEEPS ITS SYMBOL AND GETS THE GAME'S OWN COLOURS
// ============================================================================
//
//  Asked for as the category colours coming out of the game's palette. The
//  eight here were hand-picked hexes that appear nowhere else in the app, and
//  one of them was a rule break rather than a mismatch:
//
//      Bio-Tech      #4ADE80      which is theme.colors.success
//
//  Green and red in this game mean profit and loss and nothing else, and they
//  are TEXT colours - never a fill or a border. So every Bio-Tech badge was
//  drawing the profit signal around a product that had not earned or lost
//  anything. Measured: 1 of 8 was a signal colour, 0 of 8 were in the palette.
//
//  `avatarTints` is the right set and it already exists for exactly this. It
//  is the game's CATEGORICAL palette: eight hues that differ from each other,
//  carry no good or bad, and are documented in core/theme.ts as the answer to
//  "this is a kind of thing, not a score". The mail app and the encounter
//  card already use it for sender and social class.
//
//  THE SYMBOLS ARE UNTOUCHED. Every icon name below is the one it was.
// ============================================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductCategory } from '../data/unlockableProductsData';
import { theme } from '../../../core/theme';

const TINTS = theme.colors.avatarTints;

/**
 * Which tint each category wears.
 *
 * Fixed rather than hashed. There are eight of these and they must not change
 * colour between two saves - see avatarTintFor in core/theme.ts, which hashes
 * because names are unbounded and these are not.
 *
 * Indices chosen so that no two categories a player sees side by side are
 * neighbours on the ramp: sky, teal, lilac, sage.
 */
export const CATEGORY_COLORS: Record<string, string> = {
    'Consumer': TINTS[5],    // sky
    'Robotics': TINTS[3],    // teal
    'Bio-Tech': TINTS[7],    // sage, and NOT theme.colors.success
    'Deep Tech': TINTS[6],   // lilac
    // The lowercase four are the older product `type` values. Same table
    // rather than a second one, which is how the two came to disagree.
    'phone': TINTS[5],
    'computer': TINTS[3],
    'watch': TINTS[4],       // wheat
    'other': TINTS[6],
};

// SHELVED, not deleted: the eight hand-picked hexes this table held. Kept so
// the change is legible and so nobody re-derives them by accident.
//
// export const CATEGORY_COLORS: Record<string, string> = {
//     'Consumer': '#60A5FA',
//     'Robotics': '#38BDF8',
//     'Bio-Tech': '#4ADE80',
//     'Deep Tech': '#C084FC',
//     'phone': '#60A5FA',
//     'computer': '#38BDF8',
//     'watch': '#FBBF24',
//     'other': '#A78BFA',
// };

export const CATEGORY_ICONS: Record<string, string> = {
    'Consumer': 'cellphone-sound',
    'Robotics': 'robot-industrial',
    'Bio-Tech': 'dna',
    'Deep Tech': 'atom',
};

export const PRODUCT_ICON_NAMES: Record<string, string> = {
    'smart_phone': 'cellphone',
    'smart_speaker': 'speaker-wireless',
    'vr_headset': 'glasses',
    'gaming_console': 'gamepad-variant',
    'drone_4k': 'quadcopter',
    'home_robot': 'robot',
    'delivery_bot': 'truck-fast-outline',
    'ind_robot_arm': 'robot-industrial',
    'electric_car': 'car-electric',
    'cyber_limb': 'arm-flex',
    'neural_chip': 'chip',
    'flying_car': 'airplane-takeoff',
    'quantum_pc': 'atom',
    'fusion_reactor': 'radioactive',
    'immortality': 'infinity',
};

export const PRODUCT_EMOJIS: Record<string, string> = {
    'smart_phone': '📱',
    'smart_speaker': '🔊',
    'vr_headset': '🥽',
    'gaming_console': '🎮',
    'drone_4k': '🛸',
    'home_robot': '🤖',
    'delivery_bot': '📦',
    'ind_robot_arm': '🦾',
    'electric_car': '🚗',
    'cyber_limb': '🦾',
    'neural_chip': '🧠',
    'flying_car': '🚀',
    'quantum_pc': '💻',
    'fusion_reactor': '⚡',
    'immortality': '🧬',
};

export const getProductIconName = (productId?: string, category?: string): string => {
    if (productId && PRODUCT_ICON_NAMES[productId]) {
        return PRODUCT_ICON_NAMES[productId];
    }
    if (category && CATEGORY_ICONS[category]) {
        return CATEGORY_ICONS[category];
    }
    return 'cube-outline';
};

export const getProductEmoji = (productId?: string): string => {
    if (productId && PRODUCT_EMOJIS[productId]) {
        return PRODUCT_EMOJIS[productId];
    }
    return '📦';
};

export const getCategoryColor = (category?: string): string => {
    if (category && CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category];
    }
    // An unknown category is still a category. The fallback comes out of the
    // same palette as the eight above, so a product whose category has not
    // been added here does not arrive in a colour from nowhere.
    return TINTS[5];
};

export const getCategoryIconName = (category: string): string => {
    if (CATEGORY_ICONS[category]) {
        return CATEGORY_ICONS[category];
    }
    return 'cube-outline';
};

type Props = {
    productId?: string;
    category?: string;
    size?: number;
    iconSize?: number;
    unlocked?: boolean;
    style?: any;
};

export const ProductIconBadge = ({ productId, category, size = 44, iconSize = 22, unlocked = true, style }: Props) => {
    const iconName = getProductIconName(productId, category);
    const color = getCategoryColor(category);

    return (
        <View
            style={[
                styles.badge,
                {
                    width: size,
                    height: size,
                    borderRadius: Math.round(size * 0.28),
                    backgroundColor: unlocked ? `${color}18` : 'rgba(255,255,255,0.04)',
                    borderColor: unlocked ? `${color}38` : 'rgba(255,255,255,0.08)',
                },
                style,
            ]}
        >
            <MaterialCommunityIcons
                name={iconName}
                size={iconSize}
                color={unlocked ? color : 'rgba(255,255,255,0.3)'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
});
