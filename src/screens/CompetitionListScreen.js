// src/screens/CompetitionListScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const competitions = [
  { id: 'PD', title: 'La Liga', icon: 'football' },
  { id: 'CL', title: 'Ligue des Champions', icon: 'trophy' },
  { id: 'CDR', title: 'Coupe du Roi', icon: 'ribbon' },
  { id: 'SDC', title: 'Supercoupe d\'Espagne', icon: 'star' },
  { id: 'SUC', title: 'Supercoupe d\'Europe', icon: 'globe' },
];

export default function CompetitionListScreen() {
  const navigation = useNavigation();

  const handlePress = (item) => {
    navigation.navigate('CompetitionDetail', {
      competitionCode: item.id,
      title: item.title,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
      <Ionicons name={item.icon} size={28} color="#9B2C2D" />
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={competitions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    color: '#1a1a1a',
  },
});