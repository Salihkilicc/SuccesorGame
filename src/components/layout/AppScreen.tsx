import React from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle?: string;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
};

const AppScreen = ({ title, subtitle, leftNode, rightNode, children, compact = false }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C242C" />
      <View style={[styles.header, compact && styles.headerCompact]}>
        {leftNode ? <View style={styles.sideNode}>{leftNode}</View> : null}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightNode ? <View style={styles.rightNode}>{rightNode}</View> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

export default AppScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C242C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(207,208,210,0.98)',
  },
  headerCompact: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  sideNode: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  rightNode: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});

