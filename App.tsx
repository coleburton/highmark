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
import { useAuth } from './src/hooks/useAuth';

type AppScreen = 
  | 'splash' 
  | 'ageVerification' 
  | 'auth' 
  | 'userOnboarding'
  | 'productPreferences' 
  | 'favoriteStrains' 
  | 'main';

export default function App() {
  const { user, isLoading: authLoading } = useAuth();
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

  // Check if user is already logged in and set appropriate screen
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is already logged in, skip splash and age verification
        if (isFirstLogin) {
          setCurrentScreen('userOnboarding');
        } else {
          setCurrentScreen('main');
        }
      }
    }
  }, [user, authLoading, isFirstLogin]);

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

  // Show loading screen while auth is being checked
  if (authLoading && currentScreen === 'splash') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <SplashScreen onFinish={() => {}} />
      </View>
    );
  }

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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
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