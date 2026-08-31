// src/features/news/components/SiliconNewsModal.tsx
//
// ============================================================================
//  IT CAME UP FROM THE BOTTOM, AND EVERYTHING ELSE COMES IN FROM THE RIGHT
// ============================================================================
//
//  RootNavigator says it in a comment of its own: "Products slid in from the
//  right while My Empire, the stock market and the takeover screen came up
//  from the bottom, because those were Modals and Products was a screen. Two
//  different gestures for the same kind of navigation is what made the app
//  feel like separate pieces bolted together. Everything pushes from the right
//  now."
//
//  Everything except this one, which stayed a Modal and so kept the bottom
//  sheet animation - `animationType="slide"` has no other direction to offer.
//  Reported as exactly that: it should arrive from the right and leave back to
//  the right like every other screen.
//
//  So it is a ROUTE now. `asScreen` renders it as a plain view inside the
//  stack, which gives it `slide_from_right` on push and the reverse on pop for
//  free, and it renders as a Modal from anywhere that still raises it that way
//  - see SiliconNewsButton. Same component, one implementation.
//
//  AND IT DREW ITS OWN NAV BAR. RootNavigator renders exactly one, absolutely
//  against the window, because 44 files used to draw their own and on several
//  of them the bar sat outside the touchable area and did nothing. As a route
//  this screen inherits that one; the local copy is shelved for the modal
//  path, where there is genuinely nothing else above it.
// ============================================================================

import React from 'react';
import {
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
import ScreenHost from '../../../components/common/ScreenHost';
import CrystalNavBar, { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { theme } from '../../../core/theme';
import { t, useLocale } from '../../../core/i18n';
import {
  translateNewsHeadline,
  translateNewsCategory,
  translateNewsReadTime,
} from '../../../data/i18n/siliconNewsTranslations';

export interface SiliconNewsModalProps {
  visible: boolean;
  onClose: () => void;
  /** Render as a route rather than a popup. See components/common/ScreenHost. */
  asScreen?: boolean;
}

/** News Article Card */
const NewsCard = React.memo(({ item }: { item: NewsItem }) => {
  const visualTheme = NEWS_VISUAL_THEMES[item.type] || NEWS_VISUAL_THEMES.world;
  const categoryText = translateNewsCategory(item.category, visualTheme.label);
  const readTimeText = translateNewsReadTime(item.readTime);
  const headlineText = translateNewsHeadline(item.text);

  return (
    <View style={[styles.card, { borderLeftColor: visualTheme.accentColor }]}>
      {/* Top Meta: Category Tag, Source Name, Read Time */}
      <View style={styles.cardMetaRow}>
        <View style={styles.cardMetaLeft}>
          <View style={[styles.badge, { backgroundColor: visualTheme.badgeBg }]}>
            <Text style={[styles.badgeText, { color: visualTheme.badgeText }]}>
              {categoryText}
            </Text>
          </View>
          <Text style={styles.sourceText}>{item.source}</Text>
        </View>
        <Text style={styles.readTimeText}>{readTimeText}</Text>
      </View>

      {/* Article Body */}
      <Text style={styles.headlineText}>{headlineText}</Text>
    </View>
  );
});

export const SiliconNewsModal: React.FC<SiliconNewsModalProps> = ({ visible, onClose, asScreen }) => {
  useLocale();
  const { state, actions } = useSiliconNewsLogic(visible, onClose);
  const { newsHistory } = state;

  const renderItem: ListRenderItem<NewsItem> = ({ item }) => <NewsCard item={item} />;

  return (
    <ScreenHost
      asScreen={asScreen}
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={actions.handleClose}
    >
      <View style={styles.container}>
        {/* Header Container with downward nudge for comfortable spacing */}
        <View style={styles.headerWrapper}>
          <ScreenHeader
            title={t('news.title')}
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
              <Text style={styles.emptyText}>{t('news.noNews')}</Text>
            </View>
          }
        />

        {/* ----------------------------------------------------------------
            ONLY WHEN THERE IS NOTHING ELSE ABOVE THIS

            As a route the global bar is already there, drawn once by
            RootNavigator and absolute against the window. A second copy would
            be the fault that comment describes: present, and outside the
            touchable area.
           ---------------------------------------------------------------- */}
        {!asScreen && (
          <CrystalNavBar
            activeTab="Home"
            variant="dark"
            onTabPress={actions.handleClose}
          />
        )}
      </View>
    </ScreenHost>
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
