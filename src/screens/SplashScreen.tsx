import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  // Create rotation interpolation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    // Start animations after a half-second delay
    const delay = setTimeout(() => {
      // Fade in and scale up the logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Start the spinning animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, 500);

    // Set timeout to finish splash screen after 5 seconds
    const finishTimeout = setTimeout(() => {
      onFinish();
    }, 5000);

    // Clean up timeouts
    return () => {
      clearTimeout(delay);
      clearTimeout(finishTimeout);
    };
  }, [fadeAnim, scaleAnim, spinAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={styles.logoText}>HighMark</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Feather name="check-circle" size={40} color="#10b981" style={styles.icon} />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
        Your Cannabis Journal
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 10,
  },
  icon: {
    marginLeft: 5,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
  },
}); 