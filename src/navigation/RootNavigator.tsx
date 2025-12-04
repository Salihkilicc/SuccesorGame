import React from 'react';
import {Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigatorScreenParams,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  AssetsScreen,
  LifeScreen,
  LoveScreen,
  MarketScreen,
  MyCompanyScreen,
  StockDetailScreen,
  CasinoScreen,
  PremiumScreen,
  ProfileScreen,
  AchievementsScreen,
  HomeScreen,
} from '../screens';
import {formatScreenTitle} from '../utils';
import BottomStatsBar from '../components/common/BottomStatsBar';

export type LifeStackParamList = {
  LifeHome: undefined;
  Profile: undefined;
  Achievements: undefined;
};

export type LoveStackParamList = {
  LoveHome: undefined;
};

export type AssetsStackParamList = {
  AssetsHome: undefined;
  Market: undefined;
  MyCompany: undefined;
  Casino: undefined;
  Premium: undefined;
  StockDetail: {
    symbol: string;
    price: number;
    change: number;
    category?: string;
  };
};

export type RootTabParamList = {
  Life: NavigatorScreenParams<LifeStackParamList>;
  Love: NavigatorScreenParams<LoveStackParamList>;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
};

export type RootStackParamList = {
  Home: undefined;
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  MyCompany: undefined;
  Premium: undefined;
  Achievements: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const LifeStack = createNativeStackNavigator<LifeStackParamList>();
const LoveStack = createNativeStackNavigator<LoveStackParamList>();
const AssetsStack = createNativeStackNavigator<AssetsStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

const LifeStackNavigator = () => (
  <LifeStack.Navigator screenOptions={{headerShown: false}}>
    <LifeStack.Screen name="LifeHome" component={LifeScreen} />
    <LifeStack.Screen name="Profile" component={ProfileScreen} />
    <LifeStack.Screen name="Achievements" component={AchievementsScreen} />
  </LifeStack.Navigator>
);

const LoveStackNavigator = () => (
  <LoveStack.Navigator screenOptions={{headerShown: false}}>
    <LoveStack.Screen name="LoveHome" component={LoveScreen} />
  </LoveStack.Navigator>
);

const AssetsStackNavigator = () => (
  <AssetsStack.Navigator screenOptions={{headerShown: false}}>
    <AssetsStack.Screen
      name="AssetsHome"
      component={AssetsScreen}
      options={{title: formatScreenTitle('Assets')}}
    />
    <AssetsStack.Screen
      name="Market"
      component={MarketScreen}
      options={{title: formatScreenTitle('Market')}}
    />
    <AssetsStack.Screen
      name="MyCompany"
      component={MyCompanyScreen}
      options={{title: formatScreenTitle('My Company')}}
    />
    <AssetsStack.Screen
      name="Casino"
      component={CasinoScreen}
      options={{title: formatScreenTitle('Casino')}}
    />
    <AssetsStack.Screen
      name="StockDetail"
      component={StockDetailScreen}
      options={{title: formatScreenTitle('Stock Detail')}}
    />
    <AssetsStack.Screen
      name="Premium"
      component={PremiumScreen}
      options={{title: formatScreenTitle('Premium')}}
    />
  </AssetsStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {display: 'none'},
    }}>
    <Tab.Screen
      name="Life"
      component={LifeStackNavigator}
      options={{
        tabBarIcon: ({color}) => <Text style={{fontSize: 18, color}}>🎭</Text>,
      }}
    />
    <Tab.Screen
      name="Love"
      component={LoveStackNavigator}
      options={{
        tabBarIcon: ({color}) => <Text style={{fontSize: 18, color}}>❤️</Text>,
      }}
    />
    <Tab.Screen
      name="Assets"
      component={AssetsStackNavigator}
      options={{
        tabBarIcon: ({color}) => <Text style={{fontSize: 18, color}}>💼</Text>,
      }}
    />
  </Tab.Navigator>
);

const RootNavigator = () => (
  <NavigationContainer ref={rootNavigationRef}>
    <View style={{flex: 1}}>
      <RootStack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="Home">
        <RootStack.Screen name="Home" component={HomeScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="MyCompany" component={MyCompanyScreen} />
        <RootStack.Screen name="Premium" component={PremiumScreen} />
        <RootStack.Screen name="Achievements" component={AchievementsScreen} />
        {/* Future settings/legal/notifications routes can be added here */}
      </RootStack.Navigator>
      <BottomStatsBar
        onHomePress={() => {
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate('Home');
          }
        }}
      />
    </View>
  </NavigationContainer>
);

export default RootNavigator;
