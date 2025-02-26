import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AgeVerificationProps {
  onVerified: () => void;
}

export const AgeVerificationScreen = ({ onVerified }: AgeVerificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleYes = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onVerified();
    }, 500);
  };

  const handleNo = () => {
    Alert.alert(
      "Age Restriction",
      "You must be 21 or older to use this application.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Feather name="shield" size={60} color="#10b981" style={styles.icon} />
        <Text style={styles.title}>Age Verification</Text>
        <Text style={styles.description}>
          You must be 21 years or older to use HighMark.
        </Text>
        <Text style={styles.question}>Are you 21 or older?</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleNo}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>No</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.yesButton,
              isAnimating && styles.buttonPressed
            ]}
            onPress={handleYes}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  yesButton: {
    backgroundColor: '#10b981',
  },
  noButton: {
    backgroundColor: '#374151',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
}); 