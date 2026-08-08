import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';
import { useAssetStore } from '../store/useAssetStore';

type BrowserHeaderProps = {
    currentUrl: string;
    canGoBack: boolean;
    onBack: () => void;
    onCartPress: () => void;
    onBelongingsPress: () => void;
    onHomePress?: () => void; // Optional: to quickly jump to Hub if needed, though Back handles hierarchy
};

const BrowserHeader = ({ currentUrl, canGoBack, onBack, onCartPress, onBelongingsPress }: BrowserHeaderProps) => {
    const cart = useAssetStore((state) => state.cart);

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                    styles.backButton,
                    !canGoBack && styles.disabledButton,
                    pressed && styles.pressed
                ]}
                disabled={!canGoBack}
            >
                <Text style={[styles.backIcon, !canGoBack && styles.disabledIcon]}>←</Text>
            </Pressable>

            <View style={styles.addressBar}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.urlText} numberOfLines={1}>{currentUrl}</Text>
            </View>

            {/* Assets Button */}
            <Pressable
                onPress={onBelongingsPress}
                style={({ pressed }) => [
                    styles.cartButton, // Reusing button style
                    pressed && styles.pressed
                ]}
            >
                <Text style={styles.cartIcon}>🎒</Text>
            </Pressable>

            {/* Cart Button */}
            <Pressable
                onPress={onCartPress}
                style={({ pressed }) => [
                    styles.cartButton,
                    pressed && styles.pressed
                ]}
            >
                <Text style={styles.cartIcon}>🛒</Text>
                {cart.length > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cart.length}</Text>
                    </View>
                )}
            </Pressable>
        </View>
    );
};

export default BrowserHeader;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: '#1C242C',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        gap: theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.3,
    },
    pressed: {
        opacity: 0.7,
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    disabledIcon: {
        color: '#FFFFFF',
        opacity: 0.5,
    },
    addressBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#434B50',
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    lockIcon: {
        fontSize: 14,
    },
    urlText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'monospace',
        letterSpacing: 0.3,
    },
    cartButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cartIcon: {
        fontSize: 20,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#434B50',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
