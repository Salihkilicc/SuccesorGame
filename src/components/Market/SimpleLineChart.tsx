
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type Props = {
    data: number[];
    color?: string;
    height?: number;
};

const SimpleLineChart = ({ data, color = theme.colors.accent, height = 150 }: Props) => {
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    // Normalize data to fit height
    const points = useMemo(() => {
        if (data.length === 0) return [];

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        // Scale values to 0-1 range
        return data.map((val) => ((val - min) / range));
    }, [data]);

    return (
        <View style={[styles.container, { height }]}>
            <View
                style={styles.chartArea}
                onLayout={(e) => setLayout(e.nativeEvent.layout)}
            >
                {layout.width > 0 && (
                    <>
                        {/* Gradient Fill Area */}
                        <GradientFill points={points} layout={layout} color={color} />

                        {/* Line Segments */}
                        <LineSegments points={points} layout={layout} color={color} />

                        {/* Data Points */}
                        <DataPoints points={points} layout={layout} color={color} />
                    </>
                )}
            </View>
        </View>
    );
};

// Gradient fill component (approximated with multiple layers)
const GradientFill = ({ points, layout, color }: { points: number[], layout: any, color: string }) => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {points.map((val, index) => {
                if (index === points.length - 1) return null;

                const nextVal = points[index + 1];
                const x1 = (index / (points.length - 1)) * layout.width;
                const y1 = layout.height - (val * layout.height);
                const x2 = ((index + 1) / (points.length - 1)) * layout.width;
                const y2 = layout.height - (nextVal * layout.height);

                const avgY = (y1 + y2) / 2;
                const fillHeight = layout.height - avgY;

                return (
                    <View
                        key={`fill-${index}`}
                        style={{
                            position: 'absolute',
                            left: x1,
                            bottom: 0,
                            width: x2 - x1,
                            height: fillHeight,
                            backgroundColor: color,
                            opacity: 0.15,
                        }}
                    />
                );
            })}
        </View>
    );
};

// Line segments component
const LineSegments = ({ points, layout, color }: { points: number[], layout: any, color: string }) => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {points.map((val, index) => {
                if (index === points.length - 1) return null;

                const nextVal = points[index + 1];
                const x1 = (index / (points.length - 1)) * layout.width;
                const y1 = layout.height - (val * layout.height);
                const x2 = ((index + 1) / (points.length - 1)) * layout.width;
                const y2 = layout.height - (nextVal * layout.height);

                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                const cx = (x1 + x2) / 2;
                const cy = (y1 + y2) / 2;

                return (
                    <View
                        key={`line-${index}`}
                        style={{
                            position: 'absolute',
                            top: cy - 1.5,
                            left: cx - (length / 2),
                            width: length + 1,
                            height: 3,
                            backgroundColor: color,
                            transform: [{ rotate: `${angle}deg` }],
                            borderRadius: 2,
                        }}
                    />
                );
            })}
        </View>
    );
};

// Data points component (dots at each data point)
const DataPoints = ({ points, layout, color }: { points: number[], layout: any, color: string }) => {
    // Only show dots at key points (first, last, and every 3rd point)
    return (
        <View style={StyleSheet.absoluteFill}>
            {points.map((val, index) => {
                // Show first, last, and every 4th point
                if (index !== 0 && index !== points.length - 1 && index % 4 !== 0) return null;

                const x = (index / (points.length - 1)) * layout.width;
                const y = layout.height - (val * layout.height);

                return (
                    <View
                        key={`dot-${index}`}
                        style={{
                            position: 'absolute',
                            left: x - 3,
                            top: y - 3,
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: color,
                            borderWidth: 1.5,
                            borderColor: theme.colors.card,
                        }}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    chartArea: {
        flex: 1,
        width: '100%',
    },
});

export default SimpleLineChart;
