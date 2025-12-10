import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../theme';
import type {HoldingItem} from './marketTypes';

type Props = {
  visible: boolean;
  holdings: HoldingItem[];
  onClose: () => void;
  onLiquidate: () => void;
};

const PortfolioModal = ({visible, holdings, onClose, onLiquidate}: Props) => {
  const totalValue = holdings.reduce((sum, item) => sum + item.estimatedValue, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Portfolio Holdings</Text>
            <Pressable
              onPress={onClose}
              style={({pressed}) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={{gap: theme.spacing.sm}}>
            {holdings.length === 0 ? (
              <Text style={styles.empty}>No holdings yet. Start investing to build this list.</Text>
            ) : (
              holdings.map(item => {
                const isPositive = item.pl >= 0;
                return (
                  <View key={item.id} style={styles.row}>
                    <View style={{gap: theme.spacing.xs / 2}}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>
                        {item.type.toUpperCase()} • Invested {formatMoney(item.amount)}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.value}>{formatMoney(item.estimatedValue)}</Text>
                      <Text style={[styles.meta, {color: isPositive ? theme.colors.success : theme.colors.danger}]}>
                        P/L {isPositive ? '+' : ''}{item.pl.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.footer}> 
            <Text style={styles.total}>Estimated Total: {formatMoney(totalValue)}</Text>
            <Pressable
              onPress={() => {
                onLiquidate();
                onClose();
              }}
              style={({pressed}) => [styles.liquidateButton, pressed && styles.liquidateButtonPressed]}>
              <Text style={styles.liquidateText}>LIQUIDATE ALL</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PortfolioModal;

const formatMoney = (value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '94%',
    maxWidth: 540,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCirclePressed: {
    backgroundColor: theme.colors.card,
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  name: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  value: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  empty: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  total: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  liquidateButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  liquidateButtonPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.9,
  },
  liquidateText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
});
