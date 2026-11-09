// src/screens/CommunityMembersScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'https://byteatomeneons.com/rmcf/apis';

export default function CommunityMembersScreen({ route }) {
  const { communityId, communityName } = route.params;
  const navigation = useNavigation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_community_members.php?community_id=${communityId}`);
        const data = await res.json();
        if (data.success) {
          setMembers(data.members);
        } else {
          Alert.alert('Erreur', data.error || 'Impossible de charger les membres');
        }
      } catch (error) {
        Alert.alert('Erreur réseau', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [communityId]); // ✅ dépendance : communityId (se recharge si l'ID change)

  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <Image
        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user_id)}&background=FFD700&color=000&size=50` }}
        style={styles.avatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user_id}</Text>
        <Text style={styles.memberDate}>Rejoint le {new Date(item.joined_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{communityName}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucun membre dans cette communauté</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#ccc', fontSize: 14 },
  emptyText: { color: '#999', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },
  list: { padding: 16 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  memberDate: { fontSize: 12, color: '#999', marginTop: 2 },
});