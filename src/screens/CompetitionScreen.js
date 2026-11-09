// src/screens/CompetitionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

// 🔑 Remplacez par votre clé API personnelle (gratuite sur football-data.org)
const API_TOKEN = '0463238f41e8420bad2ff6a819853b24';
const TEAM_ID = 86; // Real Madrid

export default function CompetitionScreen({ route }) {
  const { competitionCode, title } = route.params;
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Mémorisation de fetchFixtures avec useCallback
  const fetchFixtures = useCallback(async () => {
    setLoading(true);
    try {
      const url = `https://api.football-data.org/v4/teams/${TEAM_ID}/matches?competitions=${competitionCode}`;
      const response = await fetch(url, {
        headers: { 'X-Auth-Token': API_TOKEN },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      const matches = data.matches || [];
      setFixtures(matches);
      setError(null);
    } catch (err) {
      setError(err.message);
      Alert.alert('Erreur', `Impossible de charger les matchs : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [competitionCode]); // ✅ Dépendance : competitionCode

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]); // ✅ Dépendance : fetchFixtures (stable grâce à useCallback)

  const renderItem = ({ item }) => {
    const homeTeam = item.homeTeam?.name || '?';
    const awayTeam = item.awayTeam?.name || '?';
    const scoreHome = item.score?.fullTime?.homeTeam ?? '-';
    const scoreAway = item.score?.fullTime?.awayTeam ?? '-';
    const date = new Date(item.utcDate).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const status = item.status || 'SCHEDULED';

    return (
      <View style={styles.card}>
        <View style={styles.matchHeader}>
          <Text style={styles.competition}>{title}</Text>
          <Text style={styles.status}>
            {status === 'FINISHED' ? 'Terminé' : status === 'IN_PLAY' ? 'En direct' : 'À venir'}
          </Text>
        </View>
        <View style={styles.matchRow}>
          <Text style={styles.team}>{homeTeam}</Text>
          <Text style={styles.score}>
            {scoreHome} - {scoreAway}
          </Text>
          <Text style={styles.team}>{awayTeam}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9B2C2D" />
        <Text style={styles.loadingText}>Chargement des matchs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (fixtures.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aucun match trouvé pour cette compétition. En attente du programme.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{fixtures.length} matchs</Text>
      </View>
      <FlatList
        data={fixtures}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... styles inchangés ...

  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  competition: { fontSize: 12, color: '#666' },
  status: { fontSize: 12, color: '#9B2C2D', fontWeight: '600' },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  team: { fontSize: 16, fontWeight: '600', flex: 2 },
  score: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  date: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4 },
});