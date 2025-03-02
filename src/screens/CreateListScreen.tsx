import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type RootStackParamList = {
  Lists: undefined;
  ListDetail: { listId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  
  // Get the current user from auth context
  const { user } = useAuth();
  const authUserId = user?.id;
  
  // Validate the form
  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setTitleError('');
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Please enter a title for your list');
      isValid = false;
    } else if (title.trim().length > 50) {
      setTitleError('Title must be less than 50 characters');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Create a new list
  const handleCreateList = async () => {
    // Validate form
    if (!validateForm()) return;
    
    // Check if user is authenticated
    if (!authUserId) {
      Alert.alert('Error', 'You must be logged in to create a list');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, get the database user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUserId)
        .single();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        Alert.alert('Error', 'Failed to fetch user information. Please try again.');
        setIsLoading(false);
        return;
      }
      
      if (!userData) {
        Alert.alert('Error', 'User account not found. Please complete the onboarding process.');
        setIsLoading(false);
        return;
      }
      
      const databaseUserId = userData.id;
      
      // Create the list
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert({
          user_id: databaseUserId,
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating list:', createError);
        
        if (createError.code === '42501') { // RLS policy violation
          Alert.alert('Permission Denied', 'You do not have permission to create lists. Please contact support.');
        } else {
          Alert.alert('Error', 'Failed to create list. Please try again.');
        }
        
        setIsLoading(false);
        return;
      }
      
      // Success! Navigate to the new list
      Alert.alert('Success', 'Your list has been created!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to the list detail screen
            navigation.navigate('ListDetail', { listId: newList.id });
          },
        },
      ]);
    } catch (error) {
      console.error('Error in list creation:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Create New List</Text>
            <Text style={styles.headerSubtitle}>
              Organize your favorite strains
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>List Title *</Text>
              <TextInput
                style={[styles.input, titleError ? styles.inputError : null]}
                placeholder="Enter list title"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              {titleError ? (
                <Text style={styles.errorText}>{titleError}</Text>
              ) : null}
              <Text style={styles.characterCount}>
                {title.length}/50 characters
              </Text>
            </View>
            
            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter list description"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={200}
              />
              <Text style={styles.characterCount}>
                {description.length}/200 characters
              </Text>
            </View>
            
            {/* Privacy Setting */}
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Make List Public</Text>
                <Text style={styles.switchDescription}>
                  Public lists can be viewed by other users
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#3A3A3C', true: 'rgba(16, 185, 129, 0.3)' }}
                thumbColor={isPublic ? '#10B981' : '#F4F3F4'}
                ios_backgroundColor="#3A3A3C"
              />
            </View>
            
            {/* Create Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateList}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="playlist-plus" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create List</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 