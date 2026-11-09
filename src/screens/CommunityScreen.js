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
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  header: { paddingHorizontal: 18, paddingVertical: 17, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  headerTitle: { fontSize: 23, fontWeight: '900', color: '#092D75' },
  headerSubtitle: { fontSize: 13, color: '#718096', marginTop: 5 },
  list: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 19, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E6ECF5', shadowColor: '#173B70', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardImage: { width: '100%', height: 150, backgroundColor: '#EAF1FC' },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#14213D', flex: 1, marginRight: 8 },
  membersContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF4FF', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  membersText: { fontSize: 12, color: '#073EBD', marginLeft: 5, fontWeight: '700' },
  locationText: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#64748B', lineHeight: 21, marginBottom: 13 },
  joinButton: { backgroundColor: '#073EBD', paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowColor: '#073EBD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  joinedButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#073EBD' },
  joinButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  joinedButtonText: { color: '#073EBD' },
  seeAllButton: { position: 'absolute', bottom: 18, left: 18, right: 18, backgroundColor: '#073EBD', borderRadius: 16, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5, shadowColor: '#073EBD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 7 },
  seeAllText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.7 },
});