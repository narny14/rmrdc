// src/screens/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  ImageBackground,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- Données des slides (texte ET image) ---
const slides = [
  {
    id: '1',
    title: 'Live the Game\nFeel the Action.',
    subtitle: 'Track every goal, every moment with real-time scores & in-depth match stats.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
    badge: '⚽ Live Scores',
  },
  {
    id: '2',
    title: 'Real-time Stats\nAt Your Fingertips.',
    subtitle: 'Get detailed match statistics, player performance, and live updates instantly.',
    image: 'https://images.unsplash.com/photo-1518091043644-c2c9ac3f5ed2?w=800&h=400&fit=crop',
    badge: '📊 Stats',
  },
  {
    id: '3',
    title: 'Connect with Fans\nShare the Passion.',
    subtitle: 'Join the community, post your photos, and interact with fellow Madridistas.',
    image: 'https://images.unsplash.com/photo-1518091043644-c2c9ac3f5ed2?w=800&h=400&fit=crop',
    badge: '🔥 Community',
  },
];

// --- Composant Pagination ---
const Pagination = ({ dots, activeIndex }) => {
  return (
    <View style={styles.paginationContainer}>
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
};

// --- ChallengeBadge (affiche le badge du slide actif) ---
const ChallengeBadge = ({ label }) => {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
};

// --- Écran principal ---
export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToSlide = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleSkip = () => {
    navigation.replace('MainTabs');
  };

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.1)',
            'rgba(0,0,0,0.3)',
            'rgba(0,0,0,0.7)',
            '#000',
          ]}
          style={styles.gradientOverlay}
        >
          <View style={styles.contentContainer}>
            <ChallengeBadge label={item.badge} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bas de page avec pagination + boutons */}
      <View style={styles.bottom}>
        <View style={styles.footer}>
          <View style={styles.leftGroup}>
            <Pagination dots={slides.length} activeIndex={currentIndex} />
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleNext}>
            <LinearGradient
              colors={['#4F7CFF', '#00C8FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: width,
    height: height,
  },
  imageBackground: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  textContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottom: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  paginationContainer: {
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
  skip: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.6,
    marginLeft: 10,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 35,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});