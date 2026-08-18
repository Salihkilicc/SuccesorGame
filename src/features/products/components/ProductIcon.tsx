import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductCategory } from '../data/unlockableProductsData';

export const CATEGORY_COLORS: Record<string, string> = {
    'Consumer': '#60A5FA',
    'Robotics': '#38BDF8',
    'Bio-Tech': '#4ADE80',
    'Deep Tech': '#C084FC',
    'phone': '#60A5FA',
    'computer': '#38BDF8',
    'watch': '#FBBF24',
    'other': '#A78BFA',
};

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
    return '#60A5FA';
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
