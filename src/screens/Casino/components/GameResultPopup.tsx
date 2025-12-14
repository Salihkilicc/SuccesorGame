import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { theme } from '../../../theme';

type Props = {
  result: {
    type: 'win' | 'loss' | 'push';
    amount: number;
  } | null;
  onHide?: () => void;
};

const GameResultPopup = ({ result, onHide }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (result) {
      // Reset values if needed
      opacity.setValue(0);
      scale.setValue(0.8);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start((finished) => {
        if (finished.finished && onHide) {
          onHide();
        }
      });
    }
  }, [result, onHide, opacity, scale]);

  if (!result) return null;

  const isWin = result.type === 'win';
  const isPush = result.type === 'push';

  const color = isWin
    ? theme.colors.success
    : isPush
      ? theme.colors.warning // Or textSecondary? 
      : theme.colors.danger;

  const label = isWin ? 'WON' : isPush ? 'PUSH' : 'LOST';
  const sign = isWin ? '+' : isPush ? '' : '-';

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.container,
          {
            borderColor: color,
            opacity: opacity,
            transform: [{ scale: scale }]
          }
        ]}
      >
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={styles.amount}>
          {sign}${result.amount.toLocaleString()}
        </Text>
      </Animated.View>
    </View>
  );
};

export default GameResultPopup;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'rgba(12, 15, 26, 0.95)',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  label: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  amount: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
