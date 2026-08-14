// src/features/news/components/SiliconNewsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItem,
  Platform,
} from 'react-native';
import { NewsItem } from '../../../core/store/useNewsStore';
import { useSiliconNewsLogic, NEWS_VISUAL_THEMES } from '../logic/useSiliconNewsLogic';
import ScreenHeader from '../../../components/common/ScreenHeader';
import CrystalNavBar, { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { theme } from '../../../core/theme';
import { t } from '../../../core/i18n';

export interface SiliconNewsModalProps {
  visible: boolean;
  onClose: () => void;
}

/** News Article Card */
const NewsCard = React.memo(({ item }: { item: NewsItem }) => {
  const visualTheme = NEWS_VISUAL_THEMES[item.type] || NEWS_VISUAL_THEMES.world;

  return (
    <View style={[styles.card, { borderLeftColor: visualTheme.accentColor }]}>
      {/* Top Meta: Category Tag, Source Name, Read Time */}
      <View style={styles.cardMetaRow}>
        <View style={styles.cardMetaLeft}>
          <View style={[styles.badge, { backgroundColor: visualTheme.badgeBg }]}>
            <Text style={[styles.badgeText, { color: visualTheme.badgeText }]}>
              {item.category || visualTheme.label}
            </Text>
          </View>
          <Text style={styles.sourceText}>{item.source}</Text>
        </View>
        <Text style={styles.readTimeText}>{item.readTime}</Text>
      </View>

      {/* Article Body */}
      <Text style={styles.headlineText}>{item.text}</Text>
    </View>
  );
});

export const SiliconNewsModal: React.FC<SiliconNewsModalProps> = ({ visible, onClose }) => {
  const { state, actions } = useSiliconNewsLogic(visible, onClose);
  const { newsHistory } = state;

  const renderItem: ListRenderItem<NewsItem> = ({ item }) => <NewsCard item={item} />;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={actions.handleClose}
    >
      <View style={styles.container}>
        {/* Header Container with downward nudge for comfortable spacing */}
        <View style={styles.headerWrapper}>
          <ScreenHeader
            title="SILICON NEWS"
            subtitle={t('home.news') || 'NEWS'}
            onBack={actions.handleClose}
            inset={true}
            category="company"
          />
        </View>

        {/* Direct News Feed List */}
        <FlatList
          data={newsHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No news recorded yet.</Text>
            </View>
          }
        />

        {/* Bottom Tab Bar for in-modal navigation consistency */}
        <CrystalNavBar activeTab="Home" variant="dark" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 10 : 6,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: NAV_BAR_CLEARANCE + theme.spacing.xl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.xs || 4,
  },
  badgeText: {
    fontSize: theme.typography.caption - 1,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sourceText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
  readTimeText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption - 1,
  },
  headlineText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    lineHeight: 20,
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
});
