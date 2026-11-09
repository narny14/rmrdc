// src/navigation/CommunityStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../screens/CommunityScreen';
import CommunityMembersScreen from '../screens/CommunityMembersScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityList" component={CommunityScreen} />
      <Stack.Screen name="CommunityMembers" component={CommunityMembersScreen} />
    </Stack.Navigator>
  );
}