// src/features/casino/components/AnimatedCard.tsx
//
// ============================================================================
//  A CARD HAS TWO SIDES AND THIS ONE ONLY EVER HAD ONE
// ============================================================================
//
//  Reported as "half the card looks completely faded and missing while it is
//  opening, and there is no turning effect".
//
//  Both halves of that are the same defect. The component used to return EITHER
//  a face-down card OR a face-up card depending on a prop, and animate a
//  rotateY across the swap:
//
//      if (hidden) return <back rotateY 0deg -> 180deg />
//      return          <face rotateY 180deg -> 360deg />
//
//  So the moment the hole card was revealed, React threw the back away and
//  mounted the FACE at 180 degrees - which is the face seen from BEHIND. With
//  no backface handling that renders as a mirrored, washed out ghost of itself,
//  and it stays that way for the entire first half of the turn. Exactly what
//  was reported: half the animation is a card that looks wrong and empty.
//
//  It is also why nothing else turned over. A card dealt face up mounted at
//  flip = 1 and simply slid in, because the only thing that ever moved `flip`
//  was the hole card being revealed. Every other card at the table arrived
//  already open, which is not something a dealer can do.
//
//  ---------------------------------------------------------------------------
//  SO THE CARD IS TWO SIDED NOW, THE WAY A CARD IS
//  ---------------------------------------------------------------------------
//  Both faces are mounted, all the time, stacked on the same square, each with
//  `backfaceVisibility: 'hidden'`. They sit a half turn apart:
//
//      flip = 0        back at   0deg  (facing you)    face at 180deg (hidden)
//      flip = 0.5      both edge on, and nothing is drawn
//      flip = 1        back at 180deg  (hidden)        face at 360deg (facing you)
//
//  There is no swap and no moment where a face is drawn backwards, because the
//  side pointing away from you is not drawn at all. That is what
//  `backfaceVisibility` is for and it was the missing piece.
//
//  AND EVERY CARD NOW TURNS OVER AS IT LANDS. It leaves the shoe face down,
//  travels, and begins its turn a little before it arrives - which is what a
//  dealer's flick actually looks like, and is the whole of the difference
//  between a card being dealt and a value appearing.
// ============================================================================

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
  /**
   * How wide the card is, in points.
   *
   * A PROP RATHER THAN A SECOND COMPONENT. The showdown shows five opponents'
   * hands inside seats 86 points wide, and a full size card does not fit -
   * but a separate MiniCard would be a second card that has to be taught the
   * flip, the deal and the backface all over again, and would drift from this
   * one the first time either changed. Everything below scales off this.
   */
  width?: number;
}

/** The full size card, and the ratio everything else keeps. */
export const CARD_W = 62;
export const CARD_H = 88;

/** How long a card takes to travel from the deck to its place. */
export const DEAL_MS = 260;
/** And the gap between one card being dealt and the next. */
export const DEAL_GAP = 120;
/** How long a card takes to turn over. */
export const FLIP_MS = 300;
/**
 * How far into its journey a card starts turning.
 *
 * Not at the end. A dealer flicks the card and it turns WHILE it travels, so
 * it is face up by the time it stops moving. Waiting for it to land and then
 * turning it reads as two separate events, which is slower and looks like a
 * machine taking its turn.
 */
export const TURN_AT = 130;

/** Everything the deal is waiting on: travel, then the turn that overlaps it. */
export const CARD_SHOW_MS = TURN_AT + FLIP_MS;

const AnimatedCard = ({
  card, index, hidden = false, baseDelay = 0, fromX = 0, fromY = 0, width = CARD_W,
}: AnimatedCardProps) => {
  /** Everything on the card in proportion, so a mini card is not a squashed one. */
  const k = width / CARD_W;
  const height = CARD_H * k;
  const travel = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  /** 0 face down, 1 face up. Every card starts face down, the way it is dealt. */
  const flip = useRef(new Animated.Value(0)).current;

  const cardKey = `${card.rank}${card.suit}`;
  const dealDelay = baseDelay + index * DEAL_GAP;

  useEffect(() => {
    travel.setValue(1);
    opacity.setValue(0);
    scale.setValue(0.85);

    const anim = Animated.parallel([
      Animated.timing(travel, {
        toValue: 0,
        duration: DEAL_MS,
        delay: dealDelay,
        // Out of a shoe and onto the felt. `back` overshoots, which is what a
        // card sliding to a stop against the others actually does.
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        delay: dealDelay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: dealDelay,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);

    anim.start();

    return () => anim.stop();
  }, [cardKey, index, baseDelay, fromX, fromY]);

  // ----------------------------------------------------------------------
  //  AND THE TURN
  // ----------------------------------------------------------------------
  //  TWO DIFFERENT EVENTS SHARE THIS, and telling them apart is the only
  //  fiddly part of the file:
  //
  //    A CARD BEING DEALT turns as it lands, so it waits out the stagger
  //    ahead of it and starts partway through its own travel.
  //
  //    THE HOLE CARD BEING REVEALED happens minutes later, when the player
  //    stands, and must turn IMMEDIATELY. Making it sit through the deal's
  //    stagger a second time would be a dealer pausing before showing you
  //    the card that decides the hand.
  //
  //  `flippedFor` is how they are told apart: a card it has not seen before
  //  is being dealt, and a card it has seen whose `hidden` changed is being
  //  turned over.
  // ----------------------------------------------------------------------
  const flippedFor = useRef<string | null>(null);

  useEffect(() => {
    const beingDealt = flippedFor.current !== cardKey;
    flippedFor.current = cardKey;

    const anim = Animated.timing(flip, {
      toValue: hidden ? 0 : 1,
      duration: FLIP_MS,
      delay: beingDealt ? dealDelay + TURN_AT : 0,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [hidden, cardKey, dealDelay]);

  const translateX = travel.interpolate({ inputRange: [0, 1], outputRange: [0, fromX] });
  const translateY = travel.interpolate({ inputRange: [0, 1], outputRange: [0, fromY] });
  /** A half turn apart, so exactly one side is ever pointing at you. */
  const faceUpSpin = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const faceDownSpin = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const isRed = ['♥', '♦'].includes(card.suit);
  const textColor = isRed ? '#C0392B' : '#1C242C';

  return (
    <Animated.View
      style={[
        styles.slot,
        { width, height },
        {
          opacity,
          transform: [{ perspective: 800 }, { translateX }, { translateY }, { scale }],
        },
      ]}
    >
      {/* THE BACK. Drawn first, so it is underneath when both are edge on. */}
      <Animated.View
        style={[
          styles.card, styles.hiddenCard,
          { borderRadius: 8 * k },
          { transform: [{ perspective: 800 }, { rotateY: faceDownSpin }] },
        ]}
      >
        <View style={[styles.hiddenPattern, { borderRadius: 6 * k, margin: 3 * k }]}>
          <View style={[styles.hiddenInner, { width: 36 * k, height: 36 * k, borderRadius: 18 * k }]}>
            <Text style={[styles.hiddenIcon, { fontSize: 22 * k }]}>🂠</Text>
          </View>
        </View>
      </Animated.View>

      {/* THE FACE. */}
      <Animated.View
        style={[
          styles.card,
          { borderRadius: 8 * k },
          { transform: [{ perspective: 800 }, { rotateY: faceUpSpin }] },
        ]}
      >
        {/* Top-left rank + suit */}
        <View style={[styles.cornerTop, { top: 4 * k, left: 5 * k }]}>
          <Text style={[styles.cornerRank, { color: textColor, fontSize: 13 * k, lineHeight: 15 * k }]}>{card.rank}</Text>
          <Text style={[styles.cornerSuit, { color: textColor, fontSize: 10 * k, lineHeight: 12 * k }]}>{card.suit}</Text>
        </View>

        {/* Center suit (large) */}
        <Text style={[styles.centerSuit, { color: textColor, fontSize: 26 * k }]}>{card.suit}</Text>

        {/* Bottom-right rank + suit (inverted).
            SHELVED ON A MINI CARD. Two corners on a 26 point card is four
            pieces of type inside a space that fits one legibly, and the
            bottom one is the redundant copy - it exists so a card fanned in
            a real hand can be read from either end, which nothing here does. */}
        {k > 0.7 && (
          <View style={styles.cornerBottom}>
            <Text style={[styles.cornerSuit, { color: textColor }]}>{card.suit}</Text>
            <Text style={[styles.cornerRank, { color: textColor }]}>{card.rank}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export default AnimatedCard;

const styles = StyleSheet.create({
  /**
   * The space the card occupies, and the only thing in the row's layout.
   *
   * The two faces are absolutely positioned inside it, so neither of them is
   * measured and the card cannot change width halfway through its turn.
   */
  slot: {
    // Width and height are set inline from the `width` prop; these are the
    // defaults so the style is complete on its own.
    width: CARD_W,
    height: CARD_H,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    // THE MISSING PIECE. Without this the side pointing away from you is drawn
    // anyway, mirrored, and you spend half of every turn looking at a card
    // that is inside out.
    backfaceVisibility: 'hidden',
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
