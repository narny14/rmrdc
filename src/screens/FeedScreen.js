import React, { useState, useEffect, useCallback } from 'react';

import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'https://byteatomeneons.com/rmcf/apis';
const LOGIN_ENDPOINT = `${API_BASE}/login.php`;

const TOKEN_KEY = '@rmrdc_auth_token';
const USER_KEY = '@rmrdc_user';

const DEMO_EMAIL = 'playreview@realmadridrdc.com';
const DEMO_PASSWORD = 'RMReview2026!';

export default function FeedScreen({
  isLoginScreen = false,
  onLoginSuccess,
  onLogout,
}) {
  const navigation = useNavigation();

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);

  // Vérifier la session sauvegardée

  // Connexion
  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert('Connexion', 'Veuillez remplir tous les champs.');
      return;
    }

    if (loggingIn) return;

    try {
      setLoggingIn(true);

      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const raw = await response.text();

      console.log('[RMRDC LOGIN] HTTP:', response.status);

      if (!raw || !raw.trim()) {
        throw new Error('Le serveur retourne une réponse vide.');
      }

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Réponse JSON invalide du serveur.');
      }

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || 'Email ou mot de passe incorrect.');
      }

      const token = data.token || data.access_token;

      if (!token) {
        throw new Error('Le serveur ne retourne aucun token.');
      }

      const account = data.user || data.data?.user || null;

      await AsyncStorage.setItem(TOKEN_KEY, String(token));
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(account));

      setUser(account);

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      console.log('[RMRDC LOGIN] Connexion réussie');
    } catch (error) {
      console.error('[RMRDC LOGIN ERROR]', error);

      Alert.alert(
        'Erreur de connexion',
        error?.message || 'Une erreur inconnue est survenue.',
      );
    } finally {
      setLoggingIn(false);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      setUser(null);
      setPassword(DEMO_PASSWORD);
      setEmail(DEMO_EMAIL);
      setFeed([]);

      if (onLogout) {
        await onLogout();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de fermer la session.');
    }
  };

  // Charger les actualités
  const loadFeed = useCallback(
    async (refresh = false) => {
      if (!refresh) setLoading(true);

      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        if (!token) {
          setUser(null);
          setFeed([]);

          if (onLogout) {
            await onLogout();
          }

          return;
        }

        const res = await fetch(`${API_BASE}/get_feed.php`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('[RMRDC FEED] HTTP:', res.status);

        if (res.status === 401) {
          setUser(null);
          setFeed([]);

          if (onLogout) {
            await onLogout();
          }

          Alert.alert('Session expirée', 'Veuillez vous reconnecter.');

          return;
        }

        const raw = await res.text();

        if (!raw || !raw.trim()) {
          throw new Error('Le serveur retourne une réponse vide.');
        }

        let data;

        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error('Réponse JSON invalide lors du chargement du Feed.');
        }

        if (!data || typeof data !== 'object') {
          throw new Error('Données du Feed invalides.');
        }

        if (data.success === true) {
          setFeed(
            Array.isArray(data.feed)
              ? data.feed.filter(item => item && typeof item === 'object')
              : [],
          );
        } else {
          Alert.alert(
            'Erreur',
            data.error || data.message || 'Impossible de charger le feed.',
          );
        }
      } catch (error) {
        Alert.alert('Erreur réseau', error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onLogout],
  );

  useEffect(() => {
    if (!isLoginScreen) {
      loadFeed();
    }
  }, [isLoginScreen, loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed(true);
  };

  // Affichage des actualités et publications
  const renderItem = ({ item }) => {
    if (item.type === 'news') {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            if (item.url) {
              Linking.openURL(item.url).catch(() => {
                Alert.alert('Erreur', 'Impossible d’ouvrir ce lien.');
              });
            }
          }}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          ) : null}

          <View style={styles.cardContent}>
            <Text style={styles.sourceTag}>📰 {item.source}</Text>

            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.date}>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : null}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.communityTag}>👥 {item.community_name}</Text>

            <Text style={styles.userTag}>👤 {item.user_id}</Text>
          </View>

          {item.content ? (
            <Text style={styles.postContent}>{item.content}</Text>
          ) : null}

          <View style={styles.postFooter}>
            <View style={styles.likeButton}>
              <Ionicons name="heart-outline" size={18} color="#FFD700" />

              <Text style={styles.likeCount}>{item.likes_count || 0}</Text>
            </View>

            <Text style={styles.date}>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Vérification initiale

  // Écran de connexion
  if (isLoginScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.loginContainer}>
            <Ionicons name="shield-checkmark" size={75} color="#FFD700" />

            <Text style={styles.loginTitle}>REAL MADRID RDC</Text>

            <Text style={styles.loginSubtitle}>
              Connectez-vous à votre communauté
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={21} color="#FFD700" />

              <TextInput
                style={styles.input}
                placeholder="Adresse e-mail"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={21} color="#FFD700" />

              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.loginButtonText}>SE CONNECTER</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.demoInfo}>
              Accès de démonstration Google Play
            </Text>

            <Text style={styles.demoEmail}>{DEMO_EMAIL}</Text>

            <Text style={styles.demoPassword}>Mot de passe prérempli</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Chargement du Feed
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Chargement du feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Feed connecté
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📲 Feed</Text>

          <Text style={styles.headerSubtitle}>Actualités & posts des fans</Text>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFD700']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.loadingText}>Aucune publication disponible.</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Ionicons name="add" size={28} color="#0A0A0A" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  loginTitle: {
    color: '#FFD700',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 18,
  },
  loginSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 55,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    marginLeft: 12,
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoInfo: {
    color: '#FFD700',
    fontSize: 13,
    marginTop: 30,
    fontWeight: 'bold',
  },
  demoEmail: {
    color: '#fff',
    fontSize: 13,
    marginTop: 8,
  },
  demoPassword: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  list: {
    padding: 12,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a2e',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceTag: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  communityTag: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userTag: {
    color: '#aaa',
    fontSize: 11,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    color: '#FFD700',
    marginLeft: 6,
    fontSize: 14,
  },
  date: {
    fontSize: 11,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#FFD700',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
