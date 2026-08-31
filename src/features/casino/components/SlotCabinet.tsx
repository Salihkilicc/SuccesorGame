// src/features/casino/components/SlotCabinet.tsx
//
// ============================================================================
//  IT WAS A GREY BOX WITH THREE HOLES IN IT
// ============================================================================
//
//  Reported as "the flow is very good, I liked it a lot, but the slot needs a
//  complete makeover, it does not look good at all".
//
//  The flow was already right - the stagger, the hang on the last reel, the
//  amount rising and fading - and none of that is touched here. What was wrong
//  is that the machine had no BODY. A rounded rectangle in the same grey as
//  every other card in the game, holding three reels. Nothing about it said
//  cabinet, and nothing about it said which machine you were standing at.
//
//  ---------------------------------------------------------------------------
//  WHAT A SLOT MACHINE ACTUALLY HAS
//  ---------------------------------------------------------------------------
//  Four things, and each one does a job rather than being decoration:
//
//    THE MARQUEE   the lit crown across the top with the machine's name on it.
//                  This is the one that carries real information: the screen
//                  never told you whether you were at the Ticker, the Boardroom
//                  or the Dynasty, even though they pay differently. Three
//                  machines that look identical are one machine.
//    THE PILLARS   lamps down both sides. They chase while the reels turn and
//                  they all come up together on a win, so the machine reacts to
//                  the spin instead of sitting there.
//    THE GLASS     a bezel with a highlight across it, so the reels read as
//                  being BEHIND something rather than printed on the front.
//    THE TRAY      the lip at the bottom where the money would come out. Pure
//                  weight - it stops the cabinet looking like it is floating.
//
//  ---------------------------------------------------------------------------
//  AND IT IS THE GAME'S OWN COLOURS, NOT A CASINO'S
//  ---------------------------------------------------------------------------
//  The obvious version of this is chrome, red and gold. It would have looked
//  like a different app bolted on. Every colour here comes from the room's own
//  theme - the same purple, orange and blue the rest of the game is built from
//  - so the cabinet reads as premium rather than as a fruit machine. The shape
//  is a slot machine; the palette is Succesor.
//
//  DARK TEXT ON THE LIT MARQUEE. It is the one bright fill on the screen and
//  bright fills take dark text.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, {
    Circle, Defs, LinearGradient, Path, Rect, Stop,
} from 'react-native-svg';
import { theme } from '../../../core/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Lamps down each pillar. */
export const LAMPS = 5;
/** How long one pass of the chase takes. */
export const CHASE_MS = 900;
/** And how long the win flash lasts. */
export const FLASH_MS = 320;

/** The cabinet's own furniture, in points. */
export const MARQUEE_H = 36;
export const TRAY_H = 20;
export const PILLAR_W = 26;

interface SlotCabinetProps {
    width: number;
    /** The height of the glass, which is whatever the reels need. */
    glassHeight: number;
    /** The machine's name, across the marquee. */
    title: string;
    /** The room's colour. */
    tint: string;
    /** The room's second colour, for the lamps. */
    glow: string;
    spinning: boolean;
    /** True for a moment after a winning spin. */
    won: boolean;
    children: React.ReactNode;
}

const SlotCabinet = ({
    width, glassHeight, title, tint, glow, spinning, won, children,
}: SlotCabinetProps) => {
    const height = MARQUEE_H + glassHeight + TRAY_H + 24;

    /** 0 to 1, looping, while the reels turn. */
    const chase = useRef(new Animated.Value(0)).current;
    /** 0 to 1 and back, once, on a win. */
    const flash = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!spinning) {
            chase.stopAnimation();
            chase.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.timing(chase, {
                toValue: 1,
                duration: CHASE_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        loop.start();
        return () => loop.stop();
    }, [spinning]);

    useEffect(() => {
        if (!won) return;
        const anim = Animated.sequence([
            Animated.timing(flash, {
                toValue: 1, duration: FLASH_MS, easing: Easing.out(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(flash, {
                toValue: 0, duration: FLASH_MS * 2, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
        ]);
        anim.start();
        return () => anim.stop();
    }, [won]);

    /**
     * How bright lamp `i` is.
     *
     * ONE ANIMATED VALUE FOR THE WHOLE CHASE, phase shifted per lamp, rather
     * than five values and five timers. The lamp is bright when the chase
     * passes its own position and dim the rest of the time, which is what
     * makes the light look like it is TRAVELLING rather than blinking.
     *
     * The win flash is added on top and the sum is clamped, so a win during a
     * spin lights everything instead of overflowing.
     */
    const lampOpacity = (i: number) => {
        const at = i / LAMPS;
        const input = [0, Math.max(0, at - 0.12), at, Math.min(1, at + 0.12), 1];
        const chasePart = chase.interpolate({
            inputRange: input,
            outputRange: [0.22, 0.22, 1, 0.22, 0.22],
            extrapolate: 'clamp',
        });
        return Animated.add(chasePart, flash).interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
    };

    const glassTop = MARQUEE_H + 12;
    const lampX = PILLAR_W / 2;
    const lampSpan = glassHeight - 16;

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
                <Defs>
                    {/* ----------------------------------------------------
                        THE BODY. Lit at the top, sinking to the ground at the
                        bottom, which is what gives it weight.

                        BOTH ENDS ARE THEME TOKENS. I had two invented greys
                        here, one either end, which is precisely the drift the
                        palette audit exists to catch - and it caught them,
                        including the ones I had left sitting in this very
                        comment. The elevation ladder already spans what
                        this needs: surfaceHigh is lighter than any card in the
                        game and the ground is darker than all of them, so the
                        cabinet reads as an OBJECT rather than another card,
                        without a single colour that is not already in the
                        theme.
                       ---------------------------------------------------- */}
                    <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.surfaceHigh} />
                        <Stop offset="1" stopColor={theme.colors.background} />
                    </LinearGradient>
                    {/* The marquee, lit in the room's colour. */}
                    <LinearGradient id="crown" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={tint} stopOpacity="1" />
                        <Stop offset="1" stopColor={tint} stopOpacity="0.72" />
                    </LinearGradient>
                    {/* And the sheen across the glass. */}
                    <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
                        <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.03" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* ---- THE BODY ---- */}
                <Rect
                    x={0} y={0} width={width} height={height}
                    rx={22} fill="url(#body)"
                    stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />

                {/* ---- THE MARQUEE HOOD ----
                    A hood rather than a bar: wider at the bottom, shoulders
                    curving in at the top, which is the silhouette that reads
                    as a slot machine from across a room. The lit panel with
                    the name on it is an RN View drawn over this - see below
                    for why that matters. */}
                <Path
                    d={`M 14 ${MARQUEE_H + 6}
                        L 14 22 Q 14 8 32 8
                        L ${width - 32} 8 Q ${width - 14} 8 ${width - 14} 22
                        L ${width - 14} ${MARQUEE_H + 6} Z`}
                    fill="url(#crown)"
                    opacity={0.55}
                />

                {/* ---- THE PILLARS ---- */}
                {[10, width - 10 - PILLAR_W].map((x, side) => (
                    <Rect
                        key={side}
                        x={x} y={glassTop - 4}
                        width={PILLAR_W} height={glassHeight + 8}
                        rx={11}
                        fill="rgba(0,0,0,0.26)"
                        stroke="rgba(255,255,255,0.06)" strokeWidth={1}
                    />
                ))}

                {/* ---- THE LAMPS ---- */}
                {[10, width - 10 - PILLAR_W].map((x, side) =>
                    Array.from({ length: LAMPS }).map((_, i) => (
                        <AnimatedCircle
                            key={`${side}-${i}`}
                            cx={x + lampX}
                            cy={glassTop + 8 + (lampSpan / (LAMPS - 1)) * i}
                            r={4}
                            fill={glow}
                            opacity={lampOpacity(i) as unknown as number}
                        />
                    )),
                )}

                {/* ---- THE GLASS BEZEL ---- */}
                <Rect
                    x={10 + PILLAR_W + 6}
                    y={glassTop - 6}
                    width={width - 2 * (10 + PILLAR_W + 6)}
                    height={glassHeight + 12}
                    rx={12}
                    fill="rgba(0,0,0,0.34)"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={1}
                />
                {/* The sheen ON the glass, which is what says there is glass. */}
                <Rect
                    x={10 + PILLAR_W + 6}
                    y={glassTop - 6}
                    width={width - 2 * (10 + PILLAR_W + 6)}
                    height={(glassHeight + 12) * 0.5}
                    rx={12}
                    fill="url(#sheen)"
                    pointerEvents="none"
                />

                {/* ---- THE TRAY ----
                    The lip the money would come out of. It does nothing and it
                    is the reason the cabinet does not look like it is
                    floating. */}
                <Rect
                    x={26} y={height - TRAY_H - 8}
                    width={width - 52} height={TRAY_H}
                    rx={9}
                    fill="rgba(0,0,0,0.30)"
                    stroke="rgba(255,255,255,0.07)" strokeWidth={1}
                />
                <Rect
                    x={width / 2 - 34} y={height - TRAY_H - 2}
                    width={68} height={5}
                    rx={2.5}
                    fill="rgba(0,0,0,0.5)"
                />
            </Svg>

            {/* ---- THE NAME ----
                RN Text rather than SVG Text so it translates and wraps like
                every other string in the game.

                AND THE LIT FILL IS AN RN VIEW, NOT THE SVG CROWN. The text is
                dark, which is the house rule for a bright surface - but with
                the fill living in an SVG gradient underneath, nothing could
                CHECK that: the contrast audit saw dark text with no readable
                background and correctly reported it as dark on the dark
                ground. Painting the fill here makes the claim verifiable
                instead of something I asserted in a comment. The SVG crown is
                the hood and the shoulders around it. */}
            <View
                style={[styles.marquee, { height: MARQUEE_H - 12, backgroundColor: tint }]}
            >
                <Text numberOfLines={1} style={styles.marqueeText}>
                    {title.toUpperCase()}
                </Text>
            </View>

            {/* ---- AND THE REELS, BEHIND THE GLASS ---- */}
            <View style={[styles.glass, { top: glassTop, height: glassHeight }]}>
                {children}
            </View>
        </View>
    );
};

export default SlotCabinet;

const styles = StyleSheet.create({
    marquee: {
        position: 'absolute',
        left: 22, right: 22, top: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    marqueeText: {
        // ------------------------------------------------------------------
        //  THE ONE ANSWER FOR A LIGHT FILL
        // ------------------------------------------------------------------
        //  This was `#16202A` - a dark navy I picked because it looked right
        //  against the blue crown. It was wrong twice over. The theme note in
        //  core/theme.ts says it outright: black is used on every light fill
        //  and NO THIRD TEXT COLOUR EXISTS. Inventing one is how a palette
        //  drifts into the four reds and six backgrounds this theme was
        //  rebuilt to get rid of.
        //
        //  And a raw hex is unverifiable: the contrast audit reads a literal,
        //  cannot see the fill under it, and correctly reported dark text on
        //  the dark ground. The token carries its own guarantee.
        //
        //  Measured against all five room primaries, which are the only fills
        //  this ever sits on:
        //      #05A8F6  black 7.94   white 2.65
        //      #3FC9C0  black 10.33  white 2.03
        //      #C4B5FD  black 11.38  white 1.85
        //      #EFC94C  black 13.13  white 1.60
        //      #FF8A8A  black 9.25   white 2.27
        //  Black on every one of them, and not close.
        // ------------------------------------------------------------------
        color: theme.colors.onLight,
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2.5,
    },
    glass: {
        position: 'absolute',
        left: 0, right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
