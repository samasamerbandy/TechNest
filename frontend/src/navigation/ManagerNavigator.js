import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import AllIssuesScreen   from '../screens/manager/AllIssuesScreen';
import IssueAssignScreen from '../screens/manager/IssueAssignScreen';
import IssueManageScreen from '../screens/manager/IssueManageScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ManagerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle-outline'; // ✅ safe default
          if (route.name === 'AllIssues')
            iconName = focused ? 'grid' : 'grid-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#1E3A8A',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="AllIssues"
        component={AllIssuesScreen}
        options={{ tabBarLabel: 'All Issues' }}
      />
      {/* Add more manager tabs here when ready */}
    </Tab.Navigator>
  );
}

export default function ManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerTabs"  component={ManagerTabs} />
      <Stack.Screen name="IssueAssign"  component={IssueAssignScreen} />
      <Stack.Screen name="IssueManage"  component={IssueManageScreen} />
    </Stack.Navigator>
  );
}