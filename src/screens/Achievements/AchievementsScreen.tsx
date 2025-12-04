import React from 'react';
import {SafeAreaView, FlatList, Text, StyleSheet, View} from 'react-native';
import AchievementItem from '../../components/Achievements/AchievementItem';
import AchievementToast from '../../components/Achievements/AchievementToast';
import {ACHIEVEMENTS} from '../../achievements/achievements';
import {theme} from '../../theme';

const AchievementsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>ACHIEVEMENTS</Text>
            <Text style={styles.subtitle}>Long-term goals & milestones.</Text>
          </View>
        }
        renderItem={({item}) => <AchievementItem achievement={item} />}
        ItemSeparatorComponent={() => <View style={{height: theme.spacing.md}} />}
        showsVerticalScrollIndicator={false}
      />
      <AchievementToast />
    </SafeAreaView>
  );
};

export default AchievementsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
});
