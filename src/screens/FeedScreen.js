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
      /////////////////////////////////////////////////////

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
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14, textAlign: 'center' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, backgroundColor: '#F4F7FC' },
  loginTitle: { color: '#073EBD', fontSize: 27, fontWeight: '900', marginTop: 18, letterSpacing: 0.5 },
  loginSubtitle: { color: '#64748B', fontSize: 14, marginTop: 8, marginBottom: 35 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE5F3', borderRadius: 16, paddingHorizontal: 15, marginBottom: 16, height: 56, shadowColor: '#123B79', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  input: { flex: 1, color: '#14213D', fontSize: 15, marginLeft: 12 },
  loginButton: { width: '100%', height: 55, backgroundColor: '#073EBD', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#073EBD', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  demoInfo: { color: '#073EBD', fontSize: 13, marginTop: 30, fontWeight: '700' },
  demoEmail: { color: '#334155', fontSize: 13, marginTop: 8 },
  demoPassword: { color: '#94A3B8', fontSize: 12, marginTop: 5 },
  header: { paddingHorizontal: 18, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 23, fontWeight: '900', color: '#092D75' },
  headerSubtitle: { fontSize: 13, color: '#718096', marginTop: 3 },
  logoutButton: { padding: 10, borderRadius: 14, backgroundColor: '#EEF4FF' },
  list: { padding: 14, paddingBottom: 96 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E8EDF5', shadowColor: '#173B70', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardImage: { width: '100%', height: 200, backgroundColor: '#EAF1FC' },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sourceTag: { color: '#073EBD', fontSize: 12, fontWeight: '800' },
  communityTag: { color: '#073EBD', fontSize: 12, fontWeight: '800' },
  userTag: { color: '#94A3B8', fontSize: 11 },
  title: { fontSize: 17, fontWeight: '800', color: '#14213D', marginBottom: 7, lineHeight: 23 },
  postContent: { fontSize: 14, color: '#475569', marginBottom: 8, lineHeight: 21 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  likeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7E3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  likeCount: { color: '#B7791F', marginLeft: 6, fontSize: 13, fontWeight: '700' },
  date: { fontSize: 11, color: '#94A3B8' },
  fab: { position: 'absolute', bottom: 24, right: 22, backgroundColor: '#073EBD', width: 58, height: 58, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#073EBD', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 8 },
});