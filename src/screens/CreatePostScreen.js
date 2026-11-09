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
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
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
    color: '#FFFFFF',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  communitySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.1)',
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  noCommunityText: {
    color: '#FFD700',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 12,
    padding: 14,
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  pickerBtn: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    flex: 0.45,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  pickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#1a1a2e',
  },
  changeImageBtn: {
    marginTop: 8,
    padding: 8,
  },
  changeImageText: {
    color: '#FFD700',
    fontSize: 14,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginTop: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    color: '#999',
    fontSize: 12,
  },
});