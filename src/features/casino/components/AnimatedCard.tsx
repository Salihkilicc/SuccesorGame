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
  /** Base delay before this card animates in (ms). Stagger = index * DEAL_GAP added. */
  baseDelay?: number;
  /**
   * WHERE THE DECK IS, relative to this card's resting place.
   *
   * The whole of "there should be a table and it should feel real". A card
   * that fades up from forty pixels below is a number appearing; a card that
   * travels from the deck in the corner has been DEALT. Both numbers are in
   * pixels and the card animates from them to zero.
   */
  fromX?: number;
  fromY?: number;
}

/** How long a card takes to travel from the deck to its place. */
export const DEAL_MS = 260;
/** And the gap between one card being dealt and the next. */
export const DEAL_GAP = 120;
/** How long the hole card takes to turn over. */
export const FLIP_MS = 300;

const AnimatedCard = ({
  card, index, hidden = false, baseDelay = 0, fromX = 0, fromY = 0,
}: AnimatedCardProps) => {
  const travel = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  /** 0 face down, 1 face up. Only the hole card ever moves it. */
  const flip = useRef(new Animated.Value(hidden ? 0 : 1)).current;

  useEffect(() => {
    const staggerDelay = baseDelay + index * DEAL_GAP;

    travel.setValue(1);
    opacity.setValue(0);
    scale.setValue(0.85);

    const anim = Animated.parallel([
      Animated.timing(travel, {
        toValue: 0,
        duration: DEAL_MS,
        delay: staggerDelay,
        // Out of a shoe and onto the felt. `back` overshoots, which is what a
        // card sliding to a stop against the others actually does.
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
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
  }, [card.rank, card.suit, index, baseDelay, fromX, fromY]);

  // ----------------------------------------------------------------------
  //  AND THE HOLE CARD TURNS OVER
  // ----------------------------------------------------------------------
  //  Separate from the deal on purpose: it happens much later, when the
  //  player stands, and it is the single most dramatic moment at the table.
  //  It used to be a hard swap between two different components.
  // ----------------------------------------------------------------------
  useEffect(() => {
    Animated.timing(flip, {
      toValue: hidden ? 0 : 1,
      duration: FLIP_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [hidden]);

  const translateX = travel.interpolate({ inputRange: [0, 1], outputRange: [0, fromX] });
  const translateY = travel.interpolate({ inputRange: [0, 1], outputRange: [0, fromY] });
  /** A quarter turn each way, so the two faces swap at the halfway point. */
  const faceUpSpin = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const faceDownSpin = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const isRed = ['♥', '♦'].includes(card.suit);
  const textColor = isRed ? '#C0392B' : '#1C242C';

  if (hidden) {
    return (
      <Animated.View
        style={[
          styles.card,
          styles.hiddenCard,
          {
            transform: [
              { translateX }, { translateY }, { scale },
              { perspective: 800 }, { rotateY: faceDownSpin },
            ],
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
          transform: [
            { translateX }, { translateY }, { scale },
            { perspective: 800 }, { rotateY: faceUpSpin },
          ],
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
