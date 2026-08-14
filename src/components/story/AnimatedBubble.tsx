import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    skipAnimation?: boolean;
};

const AnimatedBubble = ({ children, style, delay = 0, skipAnimation = false }: Props) => {
    const opacity = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
    const translateY = useRef(new Animated.Value(skipAnimation ? 0 : 8)).current;
    const scale = useRef(new Animated.Value(skipAnimation ? 1 : 0.96)).current;

    useEffect(() => {
        if (skipAnimation) return;

        const animation = Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 220,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                delay,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => animation.stop();
    }, [opacity, translateY, scale, delay, skipAnimation]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

export default AnimatedBubble;
