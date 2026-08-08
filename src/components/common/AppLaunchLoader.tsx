import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

interface AppLaunchLoaderProps {
    appName: string;
    appIcon: ReactNode;
    backgroundColor: string;
    children: ReactNode;
}

const AppLaunchLoader: React.FC<AppLaunchLoaderProps> = ({
    appName,
    appIcon,
    backgroundColor,
    children,
}) => {
    const [isComplete, setIsComplete] = useState(false);
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        // Generate random delay between 1000ms and 1800ms
        const delay = Math.floor(Math.random() * (1800 - 1000 + 1) + 1000);

        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsComplete(true);
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [fadeAnim]);

    return (
        <View style={styles.container}>
            {/* Mount children immediately in the background so there's no flash when loader disappears */}
            <View style={styles.childContainer}>
                {children}
            </View>

            {/* Overlay */}
            {!isComplete && (
                <Animated.View style={[styles.splashScreen, { backgroundColor, opacity: fadeAnim }]}>
                    <View style={styles.contentContainer}>
                        <View style={styles.iconContainer}>{appIcon}</View>
                        <Text style={styles.appName}>{appName}</Text>
                    </View>
                    <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    childContainer: {
        flex: 1,
    },
    splashScreen: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    appName: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    loader: {
        position: 'absolute',
        bottom: 60,
    },
});

export default AppLaunchLoader;
