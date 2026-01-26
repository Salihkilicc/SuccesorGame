import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';
import { useAssetStore } from '../store/useAssetStore';

type BrowserHeaderProps = {
    currentUrl: string;
    canGoBack: boolean;
    onBack: () => void;
    onCartPress: () => void;
    onHomePress?: () => void; // Optional: to quickly jump to Hub if needed, though Back handles hierarchy
};

const BrowserHeader = ({ currentUrl, canGoBack, onBack, onCartPress }: BrowserHeaderProps) => {
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

            {/* Address Bar */}
            <View style={styles.addressBar}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.urlText} numberOfLines={1}>{currentUrl}</Text>
            </View>

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
        backgroundColor: '#1A1A1A',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
        gap: theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#2A2A2A',
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
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    disabledIcon: {
        color: '#888',
    },
    addressBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    lockIcon: {
        fontSize: 14,
    },
    urlText: {
        flex: 1,
        color: '#888',
        fontSize: 13,
        fontFamily: 'monospace',
        letterSpacing: 0.3,
    },
    cartButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#2A2A2A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartIcon: {
        fontSize: 20,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
