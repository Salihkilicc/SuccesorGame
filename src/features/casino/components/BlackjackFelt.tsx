// src/features/casino/components/BlackjackFelt.tsx
//
// ============================================================================
//  THERE WAS NO TABLE
// ============================================================================
//
//  Reported as "blackjack should be better too, there should be a table in the
//  middle, it should turn, it should feel real". What was there: two bordered
//  boxes stacked vertically with a faint "BLACKJACK PAYS 3:2" between them,
//  and cards that faded up from forty pixels below wherever they happened to
//  sit. Nothing came from anywhere.
//
//  This draws the felt: an oval, an arc rail, the house rules across the
//  middle, and - the part that matters - A DECK IN THE CORNER FOR THE CARDS TO
//  COME FROM. A card that appears is a number; a card that travels from a deck
//  is dealt.
//
//  The travel is the whole trick and it is cheap: every card knows where the
//  deck is, starts there, and animates to zero. No layout measuring, no
//  absolute positioning, no re-render while it moves - one `translate` on the
//  UI thread. See DealtCard.
// ============================================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

type Props = {
    width: number;
    height: number;
    /** The room's accent, for the rail. */
    tint: string;
    /** The house rules, written on the felt as they are in every casino. */
    label: string;
};

const FELT_DARK = '#0B3B2A';
const FELT_LIGHT = '#12563C';
const RAIL = '#2A1D14';

const BlackjackFelt = ({ width, height, tint, label }: Props) => {
    const cx = width / 2;
    const cy = height * 0.52;
    const rx = width * 0.52;
    const ry = height * 0.52;

    return (
        <View style={[StyleSheet.absoluteFill, styles.wrap]} pointerEvents="none">
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id="feltGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={FELT_LIGHT} />
                        <Stop offset="1" stopColor={FELT_DARK} />
                    </LinearGradient>
                </Defs>

                {/* The rail, then the felt inside it. */}
                <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={RAIL} />
                <Ellipse cx={cx} cy={cy} rx={rx - 7} ry={ry - 7} fill="url(#feltGrad)" />
                <Ellipse
                    cx={cx} cy={cy} rx={rx - 7} ry={ry - 7}
                    fill="none" stroke={tint} strokeWidth={1} opacity={0.35}
                />

                {/* The croupier's arc, which is what makes it read as a
                    blackjack table rather than a poker one. */}
                <Path
                    d={`M ${cx - rx * 0.72} ${cy - ry * 0.06}
                        A ${rx * 0.72} ${ry * 0.5} 0 0 0 ${cx + rx * 0.72} ${cy - ry * 0.06}`}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                    opacity={0.18}
                />

                {/* The house rules, on the felt where they belong. */}
                <SvgText
                    x={cx}
                    y={cy + ry * 0.12}
                    fill="#FFFFFF"
                    opacity={0.22}
                    fontSize={Math.max(9, width * 0.032)}
                    fontWeight="700"
                    letterSpacing={1.5}
                    textAnchor="middle"
                >
                    {label}
                </SvgText>
                <SvgText
                    x={cx}
                    y={cy + ry * 0.30}
                    fill="#FFFFFF"
                    opacity={0.14}
                    fontSize={Math.max(7, width * 0.024)}
                    letterSpacing={1.2}
                    textAnchor="middle"
                >
                    DEALER MUST STAND ON 17
                </SvgText>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center' },
});

export default BlackjackFelt;
