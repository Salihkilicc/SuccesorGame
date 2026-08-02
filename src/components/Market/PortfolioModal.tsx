import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { theme } from '../../core/theme';
import { useMarketStore } from '../../core/store/useMarketStore';
import { useAssetsLogic } from '../../features/assets/hooks/useAssetsLogic';
import { formatMoney, formatPrice } from '../../core/utils';

interface PortfolioModalProps {
  visible: boolean;
  onClose: () => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({ visible, onClose }) => {
  const { getPortfolioList } = useAssetsLogic();
  const { buyAsset, sellAsset } = useMarketStore();
  const portfolioList = getPortfolioList();

  const handleBuy = (symbol: string, currentPrice: number, type: 'stock' | 'crypto' | 'bond' | 'fund') => {
    Alert.prompt(
      'Buy Stock',
      `How many shares of ${symbol} would you like to buy at ${formatPrice(currentPrice)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: (quantity?: string) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0) {
              buyAsset(symbol, currentPrice, qty, type);
            }
          },
        },
      ],
      'plain-text',
      '1'
    );
  };

  const handleSell = (symbol: string, currentPrice: number, maxQuantity: number) => {
    Alert.prompt(
      'Sell Stock',
      `How many shares of ${symbol} would you like to sell at ${formatPrice(currentPrice)}? (Max: ${maxQuantity})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          onPress: (quantity?: string) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0 && qty <= maxQuantity) {
              sellAsset(symbol, qty, currentPrice);
            } else if (qty > maxQuantity) {
              Alert.alert('Error', `You only have ${maxQuantity} shares`);
            }
          },
        },
      ],
      'plain-text',
      maxQuantity.toString()
    );
  };

  const renderItem = ({ item }: { item: ReturnType<typeof getPortfolioList>[0] }) => {
    const isProfitable = item.profitLoss >= 0;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSymbol}>{item.symbol}</Text>
          <Text style={styles.itemQuantity}>{item.quantity.toFixed(2)} shares</Text>
          <Text style={styles.itemCostInfo}>
            Avg: {formatPrice(item.averageCost)} → Now: {formatPrice(item.currentPrice)}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemValue}>{formatMoney(item.currentValue)}</Text>
          <Text style={[styles.itemPL, isProfitable ? styles.profit : styles.loss]}>
            {isProfitable ? '+' : ''}{item.profitLoss.toFixed(2)} ({item.profitLossPercent.toFixed(1)}%)
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.buyButton, pressed && styles.buttonPressed]}
              onPress={() => handleBuy(item.symbol, item.currentPrice, item.type)}>
              <Text style={styles.buyButtonText}>+ Buy</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sellButton, pressed && styles.buttonPressed]}
              onPress={() => handleSell(item.symbol, item.currentPrice, item.quantity)}>
              <Text style={styles.sellButtonText}>- Sell</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const totalValue = portfolioList.reduce((sum, item) => sum + item.currentValue, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Portfolio</Text>
              <Text style={styles.totalValue}>Total Value: {formatMoney(totalValue)}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {portfolioList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active investments</Text>
              <Text style={styles.emptySubtext}>Buy stocks from the market to get started</Text>
            </View>
          ) : (
            <FlatList
              data={portfolioList}
              keyExtractor={(item) => item.symbol}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0a0a0c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: theme.typography.body,
    color: '#D4AF37',
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  itemLeft: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemSymbol: {
    fontSize: theme.typography.caption,
    color: '#D4AF37',
    fontWeight: '700',
  },
  itemQuantity: {
    fontSize: theme.typography.caption,
    color: '#A0A0A0',
  },
  itemCostInfo: {
    fontSize: theme.typography.caption,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  itemValue: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemPL: {
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
  profit: {
    color: '#00E676',
  },
  loss: {
    color: '#FF3B30',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  buyButton: {
    backgroundColor: 'rgba(0,230,118,0.12)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  sellButton: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  buyButtonText: {
    color: '#00E676',
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  sellButtonText: {
    color: '#FF3B30',
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyState: {
    padding: theme.spacing.lg * 2,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.subtitle,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: theme.typography.caption,
    color: '#A0A0A0',
  },
});

export default PortfolioModal;
