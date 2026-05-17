import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import IssueSubmissionScreen from '../screens/member/IssueSubmissionScreen';
import MyIssuesScreen from '../screens/member/MyIssuesScreen';
import IssueDetailScreen from '../screens/member/IssueDetailScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Report Issue') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'My Issues') iconName = focused ? 'list' : 'list-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#1E3A8A',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Report Issue" component={IssueSubmissionScreen} />
      <Tab.Screen name="My Issues"    component={MyIssuesScreen} />
    </Tab.Navigator>
  );
}

export default function MemberNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberTabs"    component={MemberTabs} />
      <Stack.Screen name="IssueDetail"   component={IssueDetailScreen} />
    </Stack.Navigator>
  );
}