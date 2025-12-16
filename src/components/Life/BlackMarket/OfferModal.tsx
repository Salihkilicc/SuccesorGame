import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { theme } from '../../../theme';

type OfferModalProps = {
    visible: boolean;
    item: any | null; // { name, price, description, ... }
    onBuy: () => void;
    onReject: () => void;
};

const formatMoney = (value: number) => {
    return `$${value.toLocaleString()}`;
};

const OfferModal = ({ visible, item, onBuy, onReject }: OfferModalProps) => {
    if (!visible || !item) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <Text style={styles.title}>EXCLUSIVE OFFER</Text>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>
                            {item.type === 'art' ? '🎨' : item.type === 'antique' ? '🏺' : '💎'}
                        </Text>
                    </View>

                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    <Text style={styles.price}>{formatMoney(item.price)}</Text>
                </View>

                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [styles.button, styles.buyButton, pressed && styles.pressed]}
                        onPress={onBuy}
                    >
                        <Text style={styles.buyText}>BUY IT</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.button, styles.rejectButton, pressed && styles.pressed]}
                        onPress={onReject}
                    >
                        <Text style={styles.rejectText}>NOT INTERESTED</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 999,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        color: '#666',
        fontSize: 12,
        letterSpacing: 2,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    content: {
        alignItems: 'center',
        marginBottom: 40,
        width: '100%',
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#111',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    icon: {
        fontSize: 40,
    },
    itemName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
        paddingHorizontal: 20,
    },
    price: {
        color: '#ff4444',
        fontSize: 32,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 68, 68, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    footer: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyButton: {
        backgroundColor: '#fff',
    },
    rejectButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buyText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    rejectText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default OfferModal;
