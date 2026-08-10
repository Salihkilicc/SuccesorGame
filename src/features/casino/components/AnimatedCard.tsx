// src/features/casino/components/AnimatedCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export type CardData = {
  rank: string;
  suit: string;
  value: number;
};

interface AnimatedCardProps {
  card: CardData;
  index: number;
  hidden?: boolean;
  /** Base delay before this card animates in (ms). Stagger = index * 150 added. */
  baseDelay?: number;
}

const AnimatedCard = ({ card, index, hidden = false, baseDelay = 0 }: AnimatedCardProps) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const staggerDelay = baseDelay + index * 150;

    translateY.setValue(40);
    opacity.setValue(0);
    scale.setValue(0.85);

    const anim = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: staggerDelay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay: staggerDelay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: staggerDelay,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);

    anim.start();

    return () => anim.stop();
  }, [card.rank, card.suit, index, baseDelay]);

  const isRed = ['♥', '♦'].includes(card.suit);
  const textColor = isRed ? '#C0392B' : '#1C242C';

  if (hidden) {
    return (
      <Animated.View
        style={[
          styles.card,
          styles.hiddenCard,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.hiddenPattern}>
          <View style={styles.hiddenInner}>
            <Text style={styles.hiddenIcon}>🂠</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      {/* Top-left rank + suit */}
      <View style={styles.cornerTop}>
        <Text style={[styles.cornerRank, { color: textColor }]}>{card.rank}</Text>
        <Text style={[styles.cornerSuit, { color: textColor }]}>{card.suit}</Text>
      </View>

      {/* Center suit (large) */}
      <Text style={[styles.centerSuit, { color: textColor }]}>{card.suit}</Text>

      {/* Bottom-right rank + suit (inverted) */}
      <View style={styles.cornerBottom}>
        <Text style={[styles.cornerSuit, { color: textColor }]}>{card.suit}</Text>
        <Text style={[styles.cornerRank, { color: textColor }]}>{card.rank}</Text>
      </View>
    </Animated.View>
  );
};

export default AnimatedCard;

const styles = StyleSheet.create({
  card: {
    width: 62,
    height: 88,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  hiddenCard: {
    backgroundColor: '#2C3E50',
    borderColor: '#1A252F',
  },
  hiddenPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 6,
    margin: 3,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hiddenInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenIcon: {
    fontSize: 22,
  },

  // Corner elements
  cornerTop: {
    position: 'absolute',
    top: 4,
    left: 5,
    alignItems: 'center',
  },
  cornerBottom: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  cornerSuit: {
    fontSize: 10,
    lineHeight: 12,
  },

  // Center
  centerSuit: {
    fontSize: 26,
  },
});
