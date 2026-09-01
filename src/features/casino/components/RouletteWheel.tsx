// src/features/casino/components/RouletteWheel.tsx
//
// ============================================================================
//  IT WAS A FERRIS WHEEL EMOJI ROTATING AT A CONSTANT SPEED
// ============================================================================
//
//  Reported as "roulette needs animation, either spin the ball around the
//  wheel or shrink the wheel, make it an oval table and orbit the ball round
//  it". What was actually there:
//
//      <Animated.View style={{ rotate }}><Text>🎡</Text></Animated.View>
//
//  A fairground emoji, turning once every eight hundred milliseconds, at a
//  perfectly constant speed, for three seconds, with no relationship to the
//  number that came out at the end. That is why the wait felt like nothing
//  was happening: nothing was.
//
//  ---------------------------------------------------------------------------
//  WHAT MAKES A WHEEL READ AS A WHEEL
//  ---------------------------------------------------------------------------
//  Four things, and only the first is obvious.
//
//    1. REAL POCKETS. Thirty seven wedges in the real order, which alternates
//       red and black the whole way round. In numeric order it draws as
//       eighteen red then eighteen black - a pie chart. See
//       core/casino/roulette.ts -> WHEEL_ORDER.
//    2. THE BALL GOES THE OTHER WAY. A croupier launches it against the spin.
//       One sign, and it is most of the realism.
//    3. IT SLOWS DOWN LIKE A HEAVY OBJECT. Not linear and not ease-out-cubic,
//       which both stop too politely. A long tail that creeps the last few
//       degrees is what a rim with a bearing under it does.
//    4. THE BALL DROPS. In the last moment it leaves the rim, falls into the
//       pocket and settles. Two hundred milliseconds, and it is the difference
//       between a wheel and a spinning picture.
//
//  ---------------------------------------------------------------------------
//  THE RESULT IS DECIDED BEFORE THIS COMPONENT IS TOLD ANYTHING
//  ---------------------------------------------------------------------------
//  This draws a conclusion somebody else reached. `result` comes in as a prop
//  and the animation's whole job is to ARRIVE there. That is the engine and
//  show split the casino rewrite is built on, and it is why the spin can be
//  retimed without touching anything that decides money.
//
//  Everything animated here is `transform` and `opacity` with
//  `useNativeDriver: true`, so it runs on the UI thread and does not care what
//  JavaScript is doing.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import {
    FELT,
    POCKET_ARC,
    WHEEL_ORDER,
    feltColour,
    spinAngles,
} from '../../../core/casino/roulette';

/** How long the wheel takes to come to rest. */
export const SPIN_MS = 2400;
/** And how long the ball takes to fall into the pocket once it has. */
export const DROP_MS = 220;

type Props = {
    /** Diameter. */
    size?: number;
    /** The pocket the engine chose. Null while nothing has been spun. */
    result: number | null;
    /** Flips to true to start the show. */
    spinning: boolean;
    /** Called once the ball has settled, so the screen can pay out. */
    onSettled?: () => void;
    /** The room's accent, for the rim. */
    tint: string;
    // ----------------------------------------------------------------------
    //  THE HUB IS THE BUTTON
    // ----------------------------------------------------------------------
    //  Asked for as "there should be no play button; make the round thing in
    //  the middle of the wheel the button, and pressing it spins".
    //
    //  Which is the right instinct and it is not only tidiness. The button was
    //  at the very bottom of a tall screen, so the sequence was: put chips
    //  down at the top, travel to the bottom, press, travel back up to watch.
    //  Three places for one action. Putting it in the middle of the thing that
    //  turns collapses all three into one, and the wheel is already pinned in
    //  view.
    //
    //  A `Pressable` over the hub rather than the whole wheel: the wheel is a
    //  betting SURFACE in a real room, and a tap anywhere on it is ambiguous.
    //  The hub is the one part of a wheel nobody ever bets on.
    // ----------------------------------------------------------------------
    /** Press the hub. Absent means the hub is inert. */
    onSpin?: () => void;
    /** Whether the hub will do anything. Greyed and dead when false. */
    canSpin?: boolean;
    /** What the hub says. */
    spinLabel?: string;
};


/**
 * One pocket, as a filled wedge.
 *
 * SVG arc rather than a rotated rectangle: at thirty seven slices the corners
 * of a rectangle stick out past the rim and the wheel looks like a gear.
 */
const wedgePath = (cx: number, cy: number, r: number, from: number, to: number): string => {
    const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(from));
    const y1 = cy + r * Math.sin(rad(from));
    const x2 = cx + r * Math.cos(rad(to));
    const y2 = cy + r * Math.sin(rad(to));
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
};

const RouletteWheel = ({
    size = 240, result, spinning, onSettled, tint, onSpin, canSpin = false, spinLabel = 'SPIN',
}: Props) => {
    const wheel = useRef(new Animated.Value(0)).current;
    const ball = useRef(new Animated.Value(0)).current;
    /** The ball's distance from the centre. It falls inward at the end. */
    const ballRadius = useRef(new Animated.Value(0)).current;

    /** Where the wheel was left last time, so a second spin carries on. */
    const wheelAt = useRef(0);
    /**
     * And where the BALL was left, which nothing tracked.
     *
     * THE DEFECT behind "sometimes it is not the ball that spins, the disc
     * does". The wheel carried its angle forward and the ball did not, so
     * from the second spin onwards the ball's target was a few degrees from
     * where it already sat while the wheel did three full turns underneath
     * it. See core/casino/roulette.ts -> spinAngles.
     */
    const ballAt = useRef(0);

    const r = size / 2;
    const pocketR = r * 0.86;
    const ballTrackR = r * 0.93;
    const ballRestR = r * 0.72;

    useEffect(() => {
        if (!spinning || result === null) return;

        const { wheelTo, ballTo } = spinAngles(result, wheelAt.current, ballAt.current);
        ballAt.current = ballTo;
        wheelAt.current = wheelTo;

        ballRadius.setValue(0);

        Animated.parallel([
            Animated.timing(wheel, {
                toValue: wheelTo,
                duration: SPIN_MS,
                // A LONG TAIL. `Easing.out(Easing.cubic)` stops too politely
                // for something with a bearing under it; this creeps the last
                // few degrees the way a real rim does.
                easing: Easing.bezier(0.17, 0.67, 0.12, 0.99),
                useNativeDriver: true,
            }),
            Animated.timing(ball, {
                toValue: ballTo,
                duration: SPIN_MS,
                easing: Easing.bezier(0.12, 0.72, 0.1, 1),
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (!finished) return;
            // AND THEN IT DROPS. Off the rim, into the pocket, one small
            // settle. Without this the ball simply stops in mid air.
            Animated.timing(ballRadius, {
                toValue: 1,
                duration: DROP_MS,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start(() => onSettled?.());
        });
        // `result` and `spinning` are the whole trigger. The animated values
        // are refs and never change identity.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning, result]);

    const wheelSpin = wheel.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });
    const ballSpin = ball.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });
    const ballDrop = ballRadius.interpolate({
        inputRange: [0, 1],
        outputRange: [-ballTrackR, -ballRestR],
    });

    return (
        <View style={[styles.wrap, { width: size, height: size }]}>
            {/* ---- THE WHEEL ---- */}
            <Animated.View style={{ transform: [{ rotate: wheelSpin }] }}>
                <Svg width={size} height={size}>
                    <Circle cx={r} cy={r} r={r - 1} fill={FELT.rim} stroke={tint} strokeWidth={2} />
                    <G>
                        {WHEEL_ORDER.map((n, i) => {
                            const from = i * POCKET_ARC;
                            const to = from + POCKET_ARC;
                            return (
                                <Path
                                    key={n}
                                    d={wedgePath(r, r, pocketR, from, to)}
                                    // ONE SET OF FELT COLOURS, shared with the
                                    // betting table. They had two different
                                    // reds before this.
                                    fill={feltColour(n)}
                                    stroke={FELT.rim}
                                    strokeWidth={0.6}
                                />
                            );
                        })}
                        {/* The numbers, each turned to face out of its own pocket. */}
                        {WHEEL_ORDER.map((n, i) => {
                            const mid = i * POCKET_ARC + POCKET_ARC / 2;
                            const rad = ((mid - 90) * Math.PI) / 180;
                            const tr = pocketR * 0.82;
                            return (
                                <SvgText
                                    key={`t${n}`}
                                    x={r + tr * Math.cos(rad)}
                                    y={r + tr * Math.sin(rad) + 3}
                                    fill="#FFFFFF"
                                    fontSize={size * 0.038}
                                    fontWeight="700"
                                    textAnchor="middle"
                                    transform={`rotate(${mid} ${r + tr * Math.cos(rad)} ${r + tr * Math.sin(rad)})`}
                                >
                                    {n}
                                </SvgText>
                            );
                        })}
                    </G>
                    {/* The turret the wedges meet at. The hub CAP that sits on
                        top of it is drawn outside this layer, because a label
                        on a spinning disc cannot be read. */}
                    <Circle cx={r} cy={r} r={r * 0.30} fill={FELT.rim} stroke={tint} strokeWidth={1.5} />
                </Svg>
            </Animated.View>

            {/* ---- THE BALL ----
                A separate layer turning the OTHER WAY. The ball itself sits at
                the top of that layer and is pushed outwards by translateY, so
                rotating the layer carries it round the rim. */}
            <Animated.View
                style={[StyleSheet.absoluteFill, styles.centre, { transform: [{ rotate: ballSpin }] }]}
                pointerEvents="none"
            >
                <Animated.View style={[styles.ball, { transform: [{ translateY: ballDrop }] }]} />
            </Animated.View>

            {/* ---- THE HUB CAP, WHICH IS THE BUTTON ----
                Outside both turning layers, so the label stays still while
                everything under it moves. A light fill takes dark text, which
                is the house rule and is also what makes it read as a control
                rather than as another part of the wheel. */}
            <View style={[StyleSheet.absoluteFill, styles.centre]} pointerEvents="box-none">
                <Pressable
                    onPress={onSpin}
                    disabled={!canSpin || !onSpin}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.hub,
                        {
                            width: r * 0.56,
                            height: r * 0.56,
                            borderRadius: r * 0.28,
                            backgroundColor: canSpin ? tint : FELT.rim,
                            borderColor: canSpin ? tint : 'rgba(255,255,255,0.14)',
                        },
                        pressed && canSpin && styles.hubPressed,
                    ]}
                >
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.hubText,
                            { fontSize: Math.max(8, r * 0.10) },
                            !canSpin && styles.hubTextOff,
                        ]}
                    >
                        {spinLabel}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center' },
    centre: { alignItems: 'center', justifyContent: 'center' },
    /**
     * The hub cap, and the only control on this screen now.
     *
     * Sized off the wheel's radius so it stays in proportion when the wheel
     * is resized, which it has been twice already.
     */
    hub: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 6,
    },
    hubPressed: { transform: [{ scale: 0.92 }] },
    hubText: {
        // DARK ON A LIT FILL. Every room primary is a light colour; measured
        // in slotCabinet.test.ts, and this is the same rule.
        color: '#000000',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    hubTextOff: { color: 'rgba(255,255,255,0.45)' },
    ball: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: FELT.ivory,
        // A highlight, so it reads as a sphere rather than a dot.
        borderWidth: 1,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
});

export default RouletteWheel;
