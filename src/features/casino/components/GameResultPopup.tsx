import React, { useEffect, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { StyleSheet, Text, View, Pressable, Animated, Easing } from 'react-native';
import { theme } from '../../../core/theme';

type Props = {
  result: {
    type: 'win' | 'loss' | 'push';
    amount: number;
  } | null;
  onHide?: () => void;
};

const GameResultPopup = ({ result, onHide }: Props) => {
    useLocale();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.6)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(30)).current;

  const visible = !!result;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      contentScale.setValue(0.6);
      contentOpacity.setValue(0);
      slideY.setValue(30);

      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 350,
          delay: 100,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 2.5s
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      overlayOpacity.setValue(0);
      contentScale.setValue(0.6);
      contentOpacity.setValue(0);
      slideY.setValue(30);
    }
  }, [visible]);

  const handleDismiss = () => {
    // Fade out first
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!result) return null;

  const isWin = result.type === 'win';
  const isPush = result.type === 'push';

  const accentColor = isWin ? '#4ADE80' : isPush ? '#FFA94D' : '#FF8A8A';
  const emoji = isWin ? '🎉' : isPush ? '🤝' : '💔';
  const label = isWin ? 'WON' : isPush ? 'PUSH' : 'LOST';
  const sign = isWin ? '+' : isPush ? '' : '-';

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

      <Animated.View
        style={[
          styles.popup,
          {
            transform: [
              { scale: contentScale },
              { translateY: slideY },
            ],
            opacity: contentOpacity,
          },
        ]}
      >
        {/* Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        <View style={styles.content}>
          {/* Emoji */}
          <Text style={styles.emoji}>{emoji}</Text>

          {/* Label */}
          <Text style={[styles.label, { color: accentColor }]}>{label}</Text>

          {/* Amount */}
          <Text style={[styles.amount, { color: accentColor }]}>
            {sign}${result.amount.toLocaleString()}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {isWin ? 'Congratulations!' : isPush ? 'Draw game.' : 'Better luck next time.'}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default GameResultPopup;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(28,36,44,0.6)',
    zIndex: 50,
  },
  popup: {
    width: '75%',
    maxWidth: 300,
    backgroundColor: '#1C242C',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  accentLine: {
    height: 3,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  amount: {
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
