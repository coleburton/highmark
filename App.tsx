import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Navigation } from './src/navigation';
import { SplashScreen } from './src/screens/SplashScreen';
import { AgeVerificationScreen } from './src/screens/AgeVerificationScreen';
import { AuthScreen } from './src/screens/AuthScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'ageVerification' | 'auth' | 'main'>('splash');

  const handleSplashFinish = () => {
    setCurrentScreen('ageVerification');
  };

  const handleAgeVerified = () => {
    setCurrentScreen('auth');
  };

  const handleAuthenticated = () => {
    setCurrentScreen('main');
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
      {currentScreen === 'main' && (
        <Navigation />
      )}
    </>
  );
} 