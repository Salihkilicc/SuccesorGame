import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  AssetsScreen,
  LifeScreen,
  LoveScreen,
  MarketScreen,
  MyCompanyScreen,
  StockDetailScreen,
  CasinoScreen,
} from '../screens';
import {formatScreenTitle} from '../utils';

export type LifeStackParamList = {
  LifeHome: undefined;
};

export type LoveStackParamList = {
  LoveHome: undefined;
};

export type AssetsStackParamList = {
  AssetsHome: undefined;
  Market: undefined;
  MyCompany: undefined;
  Casino: undefined;
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

const Tab = createBottomTabNavigator<RootTabParamList>();
const LifeStack = createNativeStackNavigator<LifeStackParamList>();
const LoveStack = createNativeStackNavigator<LoveStackParamList>();
const AssetsStack = createNativeStackNavigator<AssetsStackParamList>();

const LifeStackNavigator = () => (
  <LifeStack.Navigator screenOptions={{headerShown: false}}>
    <LifeStack.Screen name="LifeHome" component={LifeScreen} />
  </LifeStack.Navigator>
);

const LoveStackNavigator = () => (
  <LoveStack.Navigator screenOptions={{headerShown: false}}>
    <LoveStack.Screen name="LoveHome" component={LoveScreen} />
  </LoveStack.Navigator>
);

const AssetsStackNavigator = () => (
  <AssetsStack.Navigator>
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
  </AssetsStack.Navigator>
);

const RootNavigator = () => (
  <Tab.Navigator screenOptions={{headerShown: false}}>
    <Tab.Screen name="Life" component={LifeStackNavigator} />
    <Tab.Screen name="Love" component={LoveStackNavigator} />
    <Tab.Screen name="Assets" component={AssetsStackNavigator} />
  </Tab.Navigator>
);

export default RootNavigator;
