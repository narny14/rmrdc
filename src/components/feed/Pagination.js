// src/components/Pagination.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Pagination({ dots = 3, activeIndex = 0 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: dots }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4F7CFF',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});