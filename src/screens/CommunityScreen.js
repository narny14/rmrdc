// src/screens/CommunityScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // ✅ Importer useNavigation

const { width } = Dimensions.get('window');
const API_BASE = 'https://byteatomeneons.com/rmcf/apis';

export default function CommunityScreen() {
  const navigation = useNavigation(); // ✅ Récupérer la navigation
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const getUserId = useCallback(async () => {
    try {
      let id = await AsyncStorage.getItem('rmcf_user_id');
      if (!id) {
        id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('rmcf_user_id', id);
      }
      return id;
    } catch (error) {
      console.error('Erreur AsyncStorage:', error);
      return 'anonymous_' + Date.now();
    }
  }, []);

  const fetchCommunities = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true);
    try {
      const uid = await getUserId();
      setUserId(uid);
      const url = `${API_BASE}/get_communities.php?user_id=${encodeURIComponent(uid)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCommunities(data.communities);
      } else {
        Alert.alert('Erreur', data.error || 'Impossible de charger les communautés');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getUserId]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleJoin = async (communityId) => {
    if (!userId) {
      Alert.alert('Erreur', 'Utilisateur non identifié');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/join_community.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, community_id: communityId }),
      });
      const data = await response.json();

      if (data.success) {
        setCommunities(prev =>
          prev.map(c => {
            if (c.id === communityId) {
              const action = data.action === 'joined' ? 1 : -1;
              const joined = data.action === 'joined' ? 1 : 0;
              return {
                ...c,
                members_count: (c.members_count || 0) + action,
                user_joined: joined,
              };
            }
            return c;
          })
        );
        Alert.alert(
          'Succès',
          data.action === 'joined'
            ? 'Vous avez rejoint la communauté ! 🤝'
            : 'Vous avez quitté la communauté.'
        );
      } else {
        Alert.alert('Erreur', data.error || 'Action impossible');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunities(true);
  };

  const handleSeeAll = () => {
    Alert.alert('Tous les groupes', 'Fonctionnalité à venir...');
  };

  // ✅ Rendu d'une carte avec navigation vers les membres
  const renderCommunity = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CommunityMembers', {
        communityId: item.id,
        communityName: item.name
      })}
    >
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/400x200/1a1a2e/FFD700?text=Real+Madrid' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.membersContainer}>
            <Ionicons name="people" size={14} color="#FFD700" />
            <Text style={styles.membersText}>{item.members_count || 0}</Text>
          </View>
        </View>
        <Text style={styles.locationText}>
          <Ionicons name="location-outline" size={12} color="#999" /> {item.location || 'RDC'}
        </Text>
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description || 'Rejoignez la communauté des Madridistas !'}
        </Text>
        <TouchableOpacity
          style={[styles.joinButton, item.user_joined && styles.joinedButton]}
          onPress={() => handleJoin(item.id)}
        >
          <Text style={[styles.joinButtonText, item.user_joined && styles.joinedButtonText]}>
            {item.user_joined ? 'Quitter' : 'Rejoindre'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Chargement des communautés...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌍 Communautés</Text>
        <Text style={styles.headerSubtitle}>Rejoins les fans du Real Madrid en RDC</Text>
      </View>

      <FlatList
        data={communities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCommunity}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFD700']}
            tintColor="#FFD700"
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune communauté trouvée</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
        <Text style={styles.seeAllText}>VOIR TOUS LES GROUPES</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFD700" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles (inchangés, gardez ceux que vous aviez)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#ccc', fontSize: 14 },
  emptyText: { color: '#999', fontSize: 16 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', textShadowColor: 'rgba(255,215,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: 14, color: '#ccc', marginTop: 4 },
  list: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: { width: '100%', height: 140, backgroundColor: '#1a1a2e' },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  membersContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  membersText: { fontSize: 12, color: '#FFD700', marginLeft: 4 },
  locationText: { fontSize: 13, color: '#999', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#ccc', lineHeight: 20, marginBottom: 12 },
  joinButton: { backgroundColor: '#FFD700', paddingVertical: 10, borderRadius: 25, alignItems: 'center', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  joinedButton: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: '#FFD700' },
  joinButtonText: { color: '#0A0A0A', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  joinedButtonText: { color: '#FFD700' },
  seeAllButton: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: '#FFD700', borderRadius: 30, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  seeAllText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});