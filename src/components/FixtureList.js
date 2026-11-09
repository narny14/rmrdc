// src/components/FixtureList.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const FixtureList = ({ fixtures }) => {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.competition}>{item.competition}</Text>
      <View style={styles.matchRow}>
        <Text style={styles.team}>{item.homeTeam}</Text>
        <Text style={styles.score}>{item.score || 'vs'}</Text>
        <Text style={styles.team}>{item.awayTeam}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.utcDate).toLocaleString()}</Text>
    </View>
  );

  return (
    <FlatList
      data={fixtures}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

// Styles (à adapter selon votre design)
const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 },
  competition: { fontSize: 12, color: '#666', marginBottom: 4 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  team: { fontSize: 16, fontWeight: '600', flex: 2 },
  score: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  date: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4 },
});

export default FixtureList;