import React, { useEffect, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { StyleSheet, Text, View, Pressable, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../../core/theme';
import { formatMoney } from '../../../core/utils';

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
  const contentScale = useRef(new Animated.Value(0.7)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(25)).current;

  const visible = !!result;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      contentScale.setValue(0.7);
      contentOpacity.setValue(0);
      slideY.setValue(25);

      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          delay: 50,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          delay: 50,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 280,
          delay: 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 2.8s
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      overlayOpacity.setValue(0);
      contentScale.setValue(0.7);
      contentOpacity.setValue(0);
      slideY.setValue(25);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!result) return null;

  const isWin = result.type === 'win';
  const isPush = result.type === 'push';

  const accentColor = isWin ? '#10B981' : isPush ? '#F59E0B' : '#EF4444';
  const glowColor = isWin ? 'rgba(16, 185, 129, 0.35)' : isPush ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  const emoji = isWin ? '🏆' : isPush ? '🤝' : '🎲';
  const label = isWin ? (t('casino.victory') || 'VICTORY') : isPush ? (t('casino.draw') || 'PUSH') : (t('casino.defeat') || 'DEFEAT');
  const sign = isWin ? '+' : isPush ? '' : '-';
  const subtitle = isWin
    ? (t('casino.winSub') || 'Winnings deposited to your cash balance.')
    : isPush
    ? (t('casino.drawSub') || 'Your bet was returned in full.')
    : (t('casino.lossSub') || 'The house took this round. Better luck next time.');

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

      <Animated.View
        style={[
          styles.popup,
          {
            borderColor: accentColor,
            shadowColor: accentColor,
            transform: [
              { scale: contentScale },
              { translateY: slideY },
            ],
            opacity: contentOpacity,
          },
        ]}
      >
        {/* Top Gradient Header */}
        <LinearGradient
          colors={[glowColor, 'transparent']}
          style={styles.gradientHeader}
        />

        <View style={styles.content}>
          {/* Badge & Icon */}
          <View style={[styles.badge, { backgroundColor: isWin ? 'rgba(16, 185, 129, 0.15)' : isPush ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: accentColor }]}>
            <Text style={styles.badgeEmoji}>{emoji}</Text>
            <Text style={[styles.badgeText, { color: accentColor }]}>{label}</Text>
          </View>

          {/* Formatted Amount */}
          <Text style={[styles.amount, { color: isWin ? '#34D399' : isPush ? '#FBBF24' : '#F87171' }]}>
            {sign}{formatMoney(result.amount)}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Tap to close indicator */}
          <View style={styles.footerNote}>
            <Text style={styles.footerText}>{t('casino.tapToContinue') || 'Tap anywhere to continue'}</Text>
          </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    zIndex: 100,
  },
  popup: {
    width: '84%',
    maxWidth: 320,
    backgroundColor: '#1E252B',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  amount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 2,
    paddingHorizontal: 10,
  },
  footerNote: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.5,
  },
});
