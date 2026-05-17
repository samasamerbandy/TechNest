import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, Text } from "react-native";

import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

import MemberNavigator from "./MemberNavigator";
import ManagerNavigator from "./ManagerNavigator";
import WorkerNavigator from "./WorkerNavigator";
import AdminNavigator from "./AdminNavigator";

const Stack = createStackNavigator();

/* ---------------- AUTH STACK ---------------- */
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/* ---------------- MAIN NAVIGATOR ---------------- */
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === "member" ? (
  <MemberNavigator />
      ) : user.role === "manager" ? (
  <ManagerNavigator />
      ) : user.role === "worker" ? (
        <WorkerNavigator />
      ) : user.role === "admin" ? (
        <AdminNavigator />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#EF4444" }}>
            Unknown role: {user.role}
          </Text>
        </View>
      )}
    </NavigationContainer>
  );
}