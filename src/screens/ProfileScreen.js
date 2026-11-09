// src/screens/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_BASE = 'https://byteatomeneons.com/rmcf/apis';

export default function ProfileScreen() {
  // États
  const [userIdentifier, setUserIdentifier] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myCommunities, setMyCommunities] = useState([]);
  const [showPickerModal, setShowPickerModal] = useState(false);

  // Charger les communautés et les infos utilisateur
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let uid = await AsyncStorage.getItem('rmcf_user_id');
      if (!uid) {
        uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('rmcf_user_id', uid);
      }

      const res = await fetch(`${API_BASE}/get_communities.php?user_id=${uid}`);
      const data = await res.json();
      console.log('Réponse API:', data);
      if (data.success) {
        setCommunities(data.communities);
        const joined = data.communities.filter(c => c.user_joined == 1);
        setMyCommunities(joined);
        if (data.communities.length > 0 && !selectedCommunity) {
          setSelectedCommunity(data.communities[0].id);
        }
      } else {
        Alert.alert('Erreur', data.error || 'Impossible de charger les communautés');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCommunity]);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Rejoindre une communauté
  const handleJoin = async () => {
    if (!userIdentifier.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email ou numéro de téléphone');
      return;
    }
    if (!selectedCommunity) {
      Alert.alert('Erreur', 'Veuillez sélectionner une communauté');
      return;
    }

    setLoading(true);
    try {
      const uid = userIdentifier.trim();
      const response = await fetch(`${API_BASE}/join_community.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, community_id: selectedCommunity }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Succès', 'Vous avez rejoint la communauté !');
        await loadData();
        setUserIdentifier('');
      } else {
        Alert.alert('Erreur', data.error || 'Action impossible');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>👤 Profil</Text>

        {loading && !myCommunities.length ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <>
            {/* Section : Mes communautés */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mes communautés</Text>
              {myCommunities.length === 0 ? (
                <Text style={styles.emptyText}>
                  Vous n'avez rejoint aucune communauté.
                </Text>
              ) : (
                myCommunities.map((c) => (
                  <View key={c.id} style={styles.communityChip}>
                    <Text style={styles.communityChipText}>{c.name}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Section : Rejoindre une communauté */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rejoindre une communauté</Text>
              <Text style={styles.label}>Email ou numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: fan@email.com ou +243 812345678"
                placeholderTextColor="#999"
                value={userIdentifier}
                onChangeText={setUserIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Choisir une communauté</Text>

              {/* Sélecteur personnalisé avec Modal */}
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPickerModal(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedCommunity
                    ? communities.find((c) => c.id === selectedCommunity)?.name
                    : 'Choisir une communauté'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FFD700" />
              </TouchableOpacity>

              {/* Modal de sélection */}
              <Modal
                visible={showPickerModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPickerModal(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowPickerModal(false)}
                >
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        Choisir une communauté
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowPickerModal(false)}
                      >
                        <Ionicons name="close" size={24} color="#FFD700" />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={communities}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.modalOption,
                            selectedCommunity === item.id &&
                              styles.modalOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedCommunity(item.id);
                            setShowPickerModal(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionText,
                              selectedCommunity === item.id &&
                                styles.modalOptionTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {selectedCommunity === item.id && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color="#FFD700"
                            />
                          )}
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <Text style={styles.emptyText}>
                          Aucune communauté disponible
                        </Text>
                      }
                    />
                  </View>
                </TouchableOpacity>
              </Modal>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoin}
                disabled={loading}
              >
                <Text style={styles.joinButtonText}>
                  {loading ? 'Chargement...' : 'Rejoindre'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  content: { padding: 17, paddingBottom: 42 },
  title: { fontSize: 27, fontWeight: '900', color: '#092D75', marginBottom: 20 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 19, padding: 17, marginBottom: 17, borderWidth: 1, borderColor: '#E6ECF5', shadowColor: '#173B70', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 9, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#14213D', marginBottom: 12 },
  emptyText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  communityChip: { backgroundColor: '#EEF4FF', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 13, marginBottom: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#DCE8FF' },
  communityChipText: { color: '#073EBD', fontSize: 14, fontWeight: '700' },
  label: { color: '#475569', fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: '#DCE5F3', borderRadius: 14, padding: 14, color: '#14213D', fontSize: 15, marginBottom: 10 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: '#DCE5F3', borderRadius: 14, padding: 14, marginBottom: 10 },
  pickerButtonText: { color: '#14213D', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(12,31,66,0.38)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 23, borderTopRightRadius: 23, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8EDF5', paddingBottom: 13 },
  modalTitle: { color: '#092D75', fontSize: 18, fontWeight: '800' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F3F8' },
  modalOptionSelected: { backgroundColor: '#EEF4FF', borderRadius: 10 },
  modalOptionText: { color: '#334155', fontSize: 15 },
  modalOptionTextSelected: { color: '#073EBD', fontWeight: '800' },
  joinButton: { backgroundColor: '#073EBD', paddingVertical: 14, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 2 },
  joinButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
});