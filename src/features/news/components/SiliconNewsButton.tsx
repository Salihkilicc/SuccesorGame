// src/features/news/components/SiliconNewsButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useNewsStore } from '../../../core/store/useNewsStore';
import { SiliconNewsModal } from './SiliconNewsModal';

export interface SiliconNewsButtonProps {
  label?: string;
  onPressOverride?: () => void;
  compact?: boolean;
}

export const SiliconNewsButton: React.FC<SiliconNewsButtonProps> = ({
  label = 'WIRE',
  onPressOverride,
  compact = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const unreadCount = useNewsStore((state) => state.unreadCount);

  const handlePress = () => {
    if (onPressOverride) {
      onPressOverride();
    } else {
      setModalVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePress}
        style={[styles.button, compact && styles.buttonCompact]}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${unreadCount} unread wire dispatches`}
      >
        <Text style={[styles.icon, compact && styles.iconCompact]}>📰</Text>
        {!compact && <Text style={styles.buttonText}>{label}</Text>}

        {/* Sophisticated Executive Amber Notification Badge */}
        {unreadCount > 0 && (
          <View style={[styles.badge, compact && styles.badgeCompact]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <SiliconNewsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202832',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#323E4C',
    gap: 6,
  },
  buttonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  icon: {
    fontSize: 15,
  },
  iconCompact: {
    fontSize: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FFA94D', // Executive Amber
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#161C24',
  },
  badgeCompact: {
    top: -4,
    right: -4,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
  },
  badgeText: {
    color: '#1C242C', // High-contrast black on amber
    fontSize: 9.5,
    fontWeight: '900',
    lineHeight: 11,
  },
});
