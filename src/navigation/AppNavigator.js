import React, { useState, useEffect, useCallback } from 'react';

import {
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CompetitionStack from './CompetitionStack';
import StandingsScreen from '../screens/StandingsScreen';
import CommunityStack from './CommunityStack';

const TOKEN_KEY = '@rmrdc_auth_token';
const USER_KEY = '@rmrdc_user';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// MENU PRINCIPAL
function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Matchs') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Classement') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Communautés') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },

        tabBarActiveTintColor: '#073EBD',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E6ECF5',
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
          paddingBottom: 7,
          elevation: 12,
          shadowColor: '#173B70',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      })}
    >
      <Tab.Screen name="Feed">
        {props => (
          <FeedScreen
            {...props}
            isLoginScreen={false}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Matchs"
        component={CompetitionStack}
      />

      <Tab.Screen
        name="Classement"
        component={StandingsScreen}
      />

      <Tab.Screen
        name="Communautés"
        component={CommunityStack}
      />

      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

// NAVIGATEUR PRINCIPAL
export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // VERIFICATION DE SESSION AU DEMARRAGE
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        if (mounted) {
          setIsAuthenticated(
            typeof token === 'string' && token.trim().length > 0
          );
        }
      } catch (error) {
        console.log('[RMRDC AUTH ERROR]', error);

        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // CONNEXION REUSSIE
  const login = useCallback(() => {
    console.log('[RMRDC AUTH] Connexion réussie - ouverture du menu');

    setIsAuthenticated(true);
  }, []);

  // DECONNEXION
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        USER_KEY,
      ]);

      setIsAuthenticated(false);

      console.log('[RMRDC AUTH] Session fermée');
    } catch (error) {
      console.log('[RMRDC LOGOUT ERROR]', error);
    }
  }, []);

  // CHARGEMENT INITIAL
  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#FFD700"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs">
            {props => (
              <MainTabs
                {...props}
                onLogout={logout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {props => (
              <FeedScreen
                {...props}
                isLoginScreen={true}
                onLoginSuccess={login}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F4F7FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});