import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet, Animated } from 'react-native';
import { Navigation } from './src/navigation';
import { SplashScreen } from './src/screens/SplashScreen';
import { AgeVerificationScreen } from './src/screens/AgeVerificationScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { UserOnboardingScreen } from './src/screens/UserOnboardingScreen';
import { ProductPreferencesScreen } from './src/screens/ProductPreferencesScreen';
import { FavoriteStrainsScreen } from './src/screens/FavoriteStrainsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppScreen = 
  | 'splash' 
  | 'ageVerification' 
  | 'auth' 
  | 'userOnboarding'
  | 'productPreferences' 
  | 'favoriteStrains' 
  | 'main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Check if user has completed onboarding before
    const checkOnboardingStatus = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        if (hasCompletedOnboarding === 'true') {
          setIsFirstLogin(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Handle transition to main app
  useEffect(() => {
    if (currentScreen === 'main') {
      // Preload the navigation component
      const timer = setTimeout(() => {
        setIsNavigationReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Reset animation when not on main screen
      fadeAnim.setValue(0);
      setIsNavigationReady(false);
    }
  }, [currentScreen, fadeAnim]);

  const handleSplashFinish = () => {
    setCurrentScreen('ageVerification');
  };

  const handleAgeVerified = () => {
    setCurrentScreen('auth');
  };

  const handleAuthenticated = () => {
    if (isFirstLogin) {
      setCurrentScreen('userOnboarding');
    } else {
      setCurrentScreen('main');
    }
  };

  const handleUserOnboardingComplete = () => {
    setCurrentScreen('productPreferences');
  };

  const handleProductPreferencesComplete = () => {
    setCurrentScreen('favoriteStrains');
  };

  const handleFavoriteStrainsComplete = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setCurrentScreen('main');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setCurrentScreen('main');
    }
  };

  const renderMainContent = () => {
    if (currentScreen === 'main') {
      return (
        <View style={styles.mainContainer}>
          {/* Transition background to prevent flash */}
          <View style={styles.transitionBackground} />
          
          {/* Fade in the navigation */}
          <Animated.View style={[styles.navigationContainer, { opacity: fadeAnim }]}>
            {isNavigationReady && <Navigation />}
          </Animated.View>
        </View>
      );
    }
    
    return null;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}
      {currentScreen === 'ageVerification' && (
        <AgeVerificationScreen onVerified={handleAgeVerified} />
      )}
      {currentScreen === 'auth' && (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      )}
      {currentScreen === 'userOnboarding' && (
        <UserOnboardingScreen onComplete={handleUserOnboardingComplete} />
      )}
      {currentScreen === 'productPreferences' && (
        <ProductPreferencesScreen onComplete={handleProductPreferencesComplete} />
      )}
      {currentScreen === 'favoriteStrains' && (
        <FavoriteStrainsScreen onComplete={handleFavoriteStrainsComplete} />
      )}
      {renderMainContent()}
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  transitionBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
  },
  navigationContainer: {
    flex: 1,
  },
}); 