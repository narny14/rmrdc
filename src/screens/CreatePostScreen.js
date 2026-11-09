// src/screens/CreatePostScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://byteatomeneons.com/rmcf/apis';

export default function CreatePostScreen({ navigation, route }) {
  // États pour le post
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  
  // États pour les communautés
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  
  // ID utilisateur (récupéré depuis AsyncStorage)
  const [userId, setUserId] = useState(null);

  // Charger l'ID utilisateur et les communautés rejointes
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Récupérer ou générer l'ID utilisateur
        let uid = await AsyncStorage.getItem('rmcf_user_id');
        if (!uid) {
          uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          await AsyncStorage.setItem('rmcf_user_id', uid);
        }
        setUserId(uid);

        // Charger les communautés rejointes
        const res = await fetch(`${API_BASE}/get_communities.php?user_id=${uid}`);
        const data = await res.json();
        if (data.success) {
          const joined = data.communities.filter(c => c.user_joined == 1);
          setCommunities(joined);
          if (joined.length > 0) {
            setSelectedCommunity(joined[0].id);
          }
        }
      } catch (error) {
        Alert.alert('Erreur', error.message);
      } finally {
        setLoadingCommunities(false);
      }
    };
    loadUserData();
  }, []);

  // Fonction pour sélectionner une image
  const pickImage = (source) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: false,
    };

    const callback = (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Erreur', response.errorMessage || 'Impossible de choisir la photo');
        return;
      }
      if (response.assets && response.assets[0]) {
        setImage(response.assets[0].uri);
      }
    };

    if (source === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  // Publier le post
  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('Erreur', 'Veuillez sélectionner une photo');
      return;
    }
    if (!selectedCommunity) {
      Alert.alert('Erreur', 'Veuillez sélectionner une communauté');
      return;
    }
    if (!userId) {
      Alert.alert('Erreur', 'Utilisateur non identifié');
      return;
    }

    setLoading(true);
    try {
      // Préparer les données
      const postData = {
        user_id: userId,
        community_id: selectedCommunity,
        content: caption,
        image_url: image, // Pour l'instant, on envoie l'URI locale ; le PHP devra télécharger l'image
      };

      const response = await fetch(`${API_BASE}/create_post.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('✅ Succès', 'Photo publiée !', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        if (route.params?.onRefresh) route.params.onRefresh();
      } else {
        Alert.alert('Erreur', data.error || 'Impossible de publier la photo');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du sélecteur de communauté
  const renderCommunitySelector = () => {
    if (loadingCommunities) {
      return <ActivityIndicator size="small" color="#FFD700" />;
    }
    if (communities.length === 0) {
      return (
        <Text style={styles.noCommunityText}>
          Vous n'avez rejoint aucune communauté. Rejoignez-en une dans l'onglet "Communautés".
        </Text>
      );
    }
    return (
      <>
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
                <Text style={styles.modalTitle}>Choisir une communauté</Text>
                <TouchableOpacity onPress={() => setShowPickerModal(false)}>
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
                      selectedCommunity === item.id && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCommunity(item.id);
                      setShowPickerModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedCommunity === item.id && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedCommunity === item.id && (
                      <Ionicons name="checkmark" size={20} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Aucune communauté disponible</Text>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle publication</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Text style={styles.submitButton}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sélecteur de communauté */}
        <View style={styles.communitySection}>
          <Text style={styles.label}>Communauté</Text>
          {renderCommunitySelector()}
        </View>

        {/* Image */}
        <View style={styles.content}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.changeImageBtn} onPress={() => setImage(null)}>
                <Text style={styles.changeImageText}>Changer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage('camera')}>
                <Ionicons name="camera" size={40} color="#FFD700" />
                <Text style={styles.pickerText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage('gallery')}>
                <Ionicons name="images" size={40} color="#FFD700" />
                <Text style={styles.pickerText}>Choisir dans la galerie</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Légende */}
          <TextInput
            style={styles.captionInput}
            placeholder="Ajouter une légende..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 17, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#092D75' },
  submitButton: { fontSize: 15, fontWeight: '800', color: '#073EBD' },
  communitySection: { padding: 17, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  label: { color: '#475569', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  noCommunityText: { color: '#64748B', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 12, lineHeight: 21 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F7F9FD', borderWidth: 1, borderColor: '#DCE5F3', borderRadius: 14, padding: 14 },
  pickerButtonText: { color: '#14213D', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(12,31,66,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8EDF5', paddingBottom: 12 },
  modalTitle: { color: '#092D75', fontSize: 18, fontWeight: '800' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F3F8' },
  modalOptionSelected: { backgroundColor: '#EEF4FF', borderRadius: 9 },
  modalOptionText: { color: '#334155', fontSize: 15 },
  modalOptionTextSelected: { color: '#073EBD', fontWeight: '800' },
  emptyText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 20 },
  content: { flex: 1, padding: 17 },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, gap: 12 },
  pickerBtn: { alignItems: 'center', padding: 19, backgroundColor: '#FFFFFF', borderRadius: 17, flex: 0.45, borderWidth: 1, borderColor: '#E1E9F5', elevation: 2 },
  pickerText: { marginTop: 9, fontSize: 13, color: '#334155', fontWeight: '600', textAlign: 'center' },
  imageContainer: { alignItems: 'center', marginVertical: 12 },
  imagePreview: { width: '100%', height: 300, borderRadius: 17, resizeMode: 'cover', backgroundColor: '#EAF1FC' },
  changeImageBtn: { marginTop: 9, padding: 9, backgroundColor: '#EEF4FF', borderRadius: 10 },
  changeImageText: { color: '#073EBD', fontSize: 14, fontWeight: '700' },
  captionInput: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, fontSize: 15, minHeight: 125, textAlignVertical: 'top', marginTop: 13, color: '#14213D', borderWidth: 1, borderColor: '#DCE5F3' },
  charCount: { textAlign: 'right', marginTop: 6, color: '#94A3B8', fontSize: 12 },
});