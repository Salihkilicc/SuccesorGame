import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import { theme } from '../../../core/theme';

interface GameRoomCardProps {
    title: string;
    subtitle: string;
    image: ImageSourcePropType; // Expecting require('./path/to/image.png')
    onPress: () => void;
    locked?: boolean;
}

export const GameRoomCard = ({ title, subtitle, image, onPress, locked = false }: GameRoomCardProps) => {
    return (
        <Pressable
            onPress={locked ? undefined : onPress}
            style={({ pressed }) => [
                styles.container,
                pressed && !locked && styles.pressed,
                locked && styles.lockedContainer
            ]}
        >
            <Image source={image} style={[styles.image, locked && styles.lockedImage]} resizeMode="cover" />

            {/* Overlay Gradient/Tint */}
            <View style={[styles.overlay, locked && styles.lockedOverlay]} />

            {/* Content */}
            <View style={styles.content}>
                <View>
                    <Text style={styles.title}>{title.toUpperCase()}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>

                {!locked ? (
                    <View style={styles.playButton}>
                        <Text style={styles.playText}>PLAY</Text>
                    </View>
                ) : (
                    <View style={styles.lockBadge}>
                        <Text style={styles.lockText}>COMING SOON</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1F2937',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9
    },
    lockedContainer: {
        borderColor: 'transparent',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    lockedImage: {
        opacity: 0.4,
        tintColor: 'gray'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Darken image for text readability
        // Optional: add gradient if library available, else solid overlay is fine
    },
    lockedOverlay: {
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: 16,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: '#E5E7EB', // Gray-200
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    playButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    playText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
    lockBadge: {
        borderWidth: 1,
        borderColor: '#9CA3AF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    lockText: {
        color: '#9CA3AF',
        fontWeight: '700',
        fontSize: 10,
        letterSpacing: 1,
    }
});
