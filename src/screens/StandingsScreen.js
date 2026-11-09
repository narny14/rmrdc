// src/screens/StandingsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

// 🔑 Clé API
const API_TOKEN = '0463238f41e8420bad2ff6a819853b24';
const COMPETITION_CODE = 'PD'; // La Liga
const SEASON = '2026'; // Saison 2026-2027

export default function StandingsScreen() {
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'home', label: 'Domicile' },
    { id: 'away', label: 'Extérieur' },
    { id: 'scorers', label: 'Buteurs' },
  ];

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '';
      if (activeTab === 'scorers') {
        // Meilleurs buteurs de la saison 2026-2027
        url = `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/scorers?season=${SEASON}`;
      } else {
        // Classements avec standingType et saison
        const standingType = activeTab === 'home' ? 'HOME' : activeTab === 'away' ? 'AWAY' : 'TOTAL';
        url = `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/standings?standingType=${standingType}&season=${SEASON}`;
      }

      const response = await fetch(url, {
        headers: { 'X-Auth-Token': API_TOKEN },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();

      if (activeTab === 'scorers') {
        setScorers(data.scorers || []);
        setStandings([]);
      } else {
        const standingsData = data.standings?.[0]?.table || [];
        setStandings(standingsData);
        setScorers([]);
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Erreur', `Impossible de charger les données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  // Trouver la position du Real Madrid (équipe ID 86)
  const getRealMadridRow = () => {
    if (activeTab === 'scorers') {
      return scorers.filter((player) => player.team?.id === 86);
    }
    return standings.find((row) => row.team?.id === 86);
  };

  const realMadridData = getRealMadridRow();

  // Rendu des onglets
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Rendu du classement
  const renderStandings = () => {
    if (standings.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun classement disponible pour la saison 2026-2027.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={standings}
        keyExtractor={(item, index) => `${item.team?.id || index}`}
        renderItem={({ item }) => {
          const isReal = item.team?.id === 86;
          const position = item.position || item.pos || '-';
          const teamName = item.team?.name || '?';
          const playedGames = item.playedGames || item.games || '-';
          const wins = item.won || item.wins || '-';
          const draws = item.draw || item.draws || '-';
          const losses = item.lost || item.losses || '-';
          const goalsFor = item.goalsFor || item.for || '-';
          const goalsAgainst = item.goalsAgainst || item.against || '-';
          const points = item.points || item.pts || '-';

          return (
            <View style={[styles.standingsRow, isReal && styles.realMadridRow]}>
              <Text style={[styles.position, isReal && styles.highlightText]}>
                {position}
              </Text>
              <Text style={[styles.teamName, isReal && styles.highlightText]}>
                {teamName}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {playedGames}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {wins}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {draws}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {losses}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {goalsFor}
              </Text>
              <Text style={[styles.stats, isReal && styles.highlightText]}>
                {goalsAgainst}
              </Text>
              <Text style={[styles.points, isReal && styles.highlightText]}>
                {points}
              </Text>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>#</Text>
            <Text style={[styles.headerLabel, styles.teamHeader]}>Équipe</Text>
            <Text style={styles.headerLabel}>J</Text>
            <Text style={styles.headerLabel}>G</Text>
            <Text style={styles.headerLabel}>N</Text>
            <Text style={styles.headerLabel}>P</Text>
            <Text style={styles.headerLabel}>BP</Text>
            <Text style={styles.headerLabel}>BC</Text>
            <Text style={styles.headerLabel}>Pts</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    );
  };

  // Rendu des meilleurs buteurs
  const renderScorers = () => {
    if (scorers.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun buteur disponible pour la saison 2026-2027.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={scorers}
        keyExtractor={(item, index) => `${item.player?.id || index}`}
        renderItem={({ item }) => {
          const isReal = item.team?.id === 86;
          return (
            <View style={[styles.scorerRow, isReal && styles.realMadridRow]}>
              <Text style={[styles.position, isReal && styles.highlightText]}>
                {item.position || '-'}
              </Text>
              <Text style={[styles.playerName, isReal && styles.highlightText]}>
                {item.player?.name || '?'}
              </Text>
              <Text style={[styles.teamName, isReal && styles.highlightText]}>
                {item.team?.name || '?'}
              </Text>
              <Text style={[styles.goals, isReal && styles.highlightText]}>
                {item.goals || '-'}
              </Text>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>#</Text>
            <Text style={[styles.headerLabel, styles.playerHeader]}>Joueur</Text>
            <Text style={[styles.headerLabel, styles.teamHeader]}>Équipe</Text>
            <Text style={styles.headerLabel}>Buts</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9B2C2D" />
          <Text style={styles.loadingText}>Chargement des classements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Classement Liga 2026-2027</Text>
        {activeTab !== 'scorers' && realMadridData ? (
          <Text style={styles.realInfo}>
            Real Madrid : {realMadridData.position || '-'}ᵉ place · {realMadridData.points || '-'} pts
          </Text>
        ) : activeTab === 'scorers' && realMadridData?.length > 0 ? (
          <Text style={styles.realInfo}>
            Real Madrid : {realMadridData.length} buteurs
          </Text>
        ) : null}
      </View>

      {renderTabs()}

      <View style={styles.content}>
        {activeTab === 'scorers' ? renderScorers() : renderStandings()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  realInfo: { fontSize: 14, color: '#9B2C2D', fontWeight: '600', marginTop: 4 },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: { backgroundColor: '#9B2C2D' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#fff' },
  content: { flex: 1 },
  list: { padding: 8 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  headerLabel: { fontSize: 12, fontWeight: '700', color: '#666', flex: 1, textAlign: 'center' },
  teamHeader: { flex: 2 },
  playerHeader: { flex: 2 },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
  },
  realMadridRow: { backgroundColor: '#fce4e4', borderWidth: 1, borderColor: '#9B2C2D' },
  position: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  teamName: { flex: 2, fontSize: 14, paddingLeft: 8 },
  stats: { flex: 1, textAlign: 'center', fontSize: 13 },
  points: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#9B2C2D' },
  highlightText: { color: '#9B2C2D', fontWeight: '700' },
  scorerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
  },
  playerName: { flex: 2, fontSize: 14, paddingLeft: 8 },
  goals: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
});