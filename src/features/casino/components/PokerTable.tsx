// src/features/casino/components/PokerTable.tsx
//
// ============================================================================
//  THE OVAL, AND FIVE PEOPLE AROUND IT
// ============================================================================
//
//  Asked for as "poker should feel like playing with several people". The old
//  screen had two hands stacked vertically, labelled YOU and DEALER, and no
//  table at all - which is heads up against a machine, whatever the cards said.
//
//  Six seats. You at the bottom, five around the rest. The geometry is the
//  work: seats are placed by ANGLE on an ellipse rather than by hand, so the
//  table can seat four or six without anybody moving a style rule, and the
//  spacing is even by construction rather than by adjustment.
//
//  The bottom of the ellipse is left empty because that is where the player's
//  own cards and controls live, so the five opponents share the top two thirds
//  and the arc reads as a table you are sitting AT rather than looking down on.
// ============================================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

type Props = {
    width: number;
    height: number;
    tint: string;
    /** The pot, written on the felt where a dealer would push it. */
    potLabel?: string;
    children?: React.ReactNode;
};

const FELT_DARK = '#0A3327';
const FELT_LIGHT = '#10513A';
const RAIL = '#241811';

/**
 * Where seat `i` of `n` sits, as a fraction of the table.
 *
 * The arc runs from the lower left, over the top, to the lower right - the
 * bottom is the player's own edge and stays clear. Returned as 0-1 so the
 * caller multiplies by whatever size it is drawing at.
 *
 * ARC RATHER THAN HAND PLACED. Five seats at even angles is a table; five
 * seats at five typed positions is a table until somebody asks for six.
 */
export const seatPosition = (index: number, count: number): { x: number; y: number } => {
    const n = Math.max(1, count);
    // 200 degrees of arc, starting past the lower left and ending before the
    // lower right, so nobody is ever sitting where the player's cards go.
    const startDeg = 168;
    const sweepDeg = 204;
    const t = n === 1 ? 0.5 : index / (n - 1);
    const deg = startDeg + sweepDeg * t;
    const rad = (deg * Math.PI) / 180;
    return {
        x: 0.5 + 0.42 * Math.cos(rad),
        // Squashed vertically, because a poker table is wider than it is deep
        // and a circle of players reads as a seance.
        y: 0.46 + 0.34 * Math.sin(rad),
    };
};

const PokerTable = ({ width, height, tint, potLabel, children }: Props) => {
    const cx = width / 2;
    const cy = height * 0.46;
    const rx = width * 0.46;
    const ry = height * 0.36;

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                    <LinearGradient id="pokerFelt" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={FELT_LIGHT} />
                        <Stop offset="1" stopColor={FELT_DARK} />
                    </LinearGradient>
                </Defs>

                <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={RAIL} />
                <Ellipse cx={cx} cy={cy} rx={rx - 8} ry={ry - 8} fill="url(#pokerFelt)" />
                <Ellipse
                    cx={cx} cy={cy} rx={rx - 8} ry={ry - 8}
                    fill="none" stroke={tint} strokeWidth={1} opacity={0.30}
                />

                {!!potLabel && (
                    <SvgText
                        x={cx}
                        y={cy - ry * 0.42}
                        fill="#FFFFFF"
                        opacity={0.40}
                        fontSize={Math.max(9, width * 0.030)}
                        fontWeight="800"
                        letterSpacing={1.4}
                        textAnchor="middle"
                    >
                        {potLabel}
                    </SvgText>
                )}
            </Svg>
            {children}
        </View>
    );
};

export default PokerTable;
