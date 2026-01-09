import React from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';

type Props = {
  title: string;
  subtitle?: string;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  children: React.ReactNode;
};

const AppScreen = ({ title, subtitle, leftNode, rightNode, children }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        {leftNode ? <View style={styles.sideNode}>{leftNode}</View> : <View style={styles.sideNode} />}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightNode ? <View style={styles.sideNode}>{rightNode}</View> : <View style={styles.sideNode} />}
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

export default AppScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  sideNode: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs / 2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    marginTop: theme.spacing.xs,
  },
  rightNode: {
    marginLeft: theme.spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});
