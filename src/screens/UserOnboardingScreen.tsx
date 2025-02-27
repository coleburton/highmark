import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface UserOnboardingScreenProps {
  onComplete: () => void;
}

export const UserOnboardingScreen = ({ onComplete }: UserOnboardingScreenProps) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (value.length > 30) {
      setUsernameError('Username must be less than 30 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateUsername(value);
  };

  const isFormValid = () => {
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      username.trim() !== '' &&
      usernameError === ''
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsLoading(true);
    
    try {
      // Check if username is already taken
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingUsers && existingUsers.length > 0) {
        setUsernameError('Username is already taken');
        setIsLoading(false);
        return;
      }
      
      // Update the user record
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          username,
          first_name: firstName,
          last_name: lastName,
          location: location.trim() !== '' ? location : null
        })
        .eq('auth_id', user?.id);
      
      if (updateUserError) throw updateUserError;
      
      // Also update the profiles table with the same information
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          username,
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user?.id);
      
      if (updateProfileError) throw updateProfileError;
      
      onComplete();
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert(
        'Error',
        'There was a problem saving your profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Feather name="user" size={50} color="#10b981" />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us a bit about yourself
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="at-sign" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
            />
          </View>
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}

          <View style={styles.inputContainer}>
            <Feather name="map-pin" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Location (Optional)"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 