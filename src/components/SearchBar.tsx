import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search strains, effects, flavors...',
}) => {
  // Animation value for the tap effect
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // Handle touch events for animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%' }}
      >
        <Animated.View 
          style={[
            styles.searchContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {value.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
              <MaterialIcons name="clear" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525', // Slightly lighter background for better contrast
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5, // Increased border width for better visibility
    borderColor: 'rgba(255, 255, 255, 0.15)', // Increased opacity for better contrast
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
}); 