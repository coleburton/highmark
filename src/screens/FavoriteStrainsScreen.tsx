import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FavoriteStrainsProps {
  onComplete: () => void;
}

interface Strain {
  id: string;
  name: string;
  type: 'indica' | 'sativa' | 'hybrid';
  thc: number;
  cbd: number;
  imageUrl?: string;
}

export const FavoriteStrainsScreen = ({ onComplete }: FavoriteStrainsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrains, setSelectedStrains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock strains data - in a real app, this would come from an API
  const popularStrains: Strain[] = [
    {
      id: '1',
      name: 'Blue Dream',
      type: 'hybrid',
      thc: 18,
      cbd: 0.1,
    },
    {
      id: '2',
      name: 'OG Kush',
      type: 'hybrid',
      thc: 23,
      cbd: 0.3,
    },
    {
      id: '3',
      name: 'Sour Diesel',
      type: 'sativa',
      thc: 20,
      cbd: 0.2,
    },
    {
      id: '4',
      name: 'Girl Scout Cookies',
      type: 'hybrid',
      thc: 25,
      cbd: 0.1,
    },
    {
      id: '5',
      name: 'Northern Lights',
      type: 'indica',
      thc: 16,
      cbd: 0.3,
    },
    {
      id: '6',
      name: 'Purple Haze',
      type: 'sativa',
      thc: 19,
      cbd: 0.1,
    },
    {
      id: '7',
      name: 'Granddaddy Purple',
      type: 'indica',
      thc: 17,
      cbd: 0.1,
    },
    {
      id: '8',
      name: 'Wedding Cake',
      type: 'hybrid',
      thc: 24,
      cbd: 0.1,
    },
    {
      id: '9',
      name: 'Durban Poison',
      type: 'sativa',
      thc: 20,
      cbd: 0.02,
    },
    {
      id: '10',
      name: 'Bubba Kush',
      type: 'indica',
      thc: 17,
      cbd: 0.1,
    },
    {
      id: '11',
      name: 'Jack Herer',
      type: 'sativa',
      thc: 18,
      cbd: 0.1,
    },
    {
      id: '12',
      name: 'Pineapple Express',
      type: 'hybrid',
      thc: 19,
      cbd: 0.1,
    },
  ];

  // Simulate a search/filter operation
  const filteredStrains = searchQuery
    ? popularStrains.filter(strain =>
        strain.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularStrains;

  const toggleStrainSelection = (strainId: string) => {
    setSelectedStrains(prev =>
      prev.includes(strainId)
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId]
    );
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // In a real app, you might want to debounce this and fetch from an API
  };

  const handleContinue = () => {
    // In a real app, you would save these preferences to user profile
    console.log('Selected strains:', selectedStrains);
    setIsLoading(true);
    
    // Simulate saving data
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 1000);
  };

  const getStrainTypeColor = (type: 'indica' | 'sativa' | 'hybrid') => {
    switch (type) {
      case 'indica':
        return '#9333ea'; // Purple
      case 'sativa':
        return '#f59e0b'; // Amber
      case 'hybrid':
        return '#10b981'; // Emerald
      default:
        return '#10b981';
    }
  };

  const renderStrainItem = ({ item }: { item: Strain }) => {
    const isSelected = selectedStrains.includes(item.id);
    const typeColor = getStrainTypeColor(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.strainCard,
          isSelected && styles.selectedStrainCard,
        ]}
        onPress={() => toggleStrainSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.strainContent}>
          <View style={[styles.strainTypeIndicator, { backgroundColor: typeColor }]} />
          <View style={styles.strainInfo}>
            <Text style={styles.strainName}>{item.name}</Text>
            <View style={styles.strainDetails}>
              <Text style={styles.strainType}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
              <Text style={styles.strainStats}>
                THC: {item.thc}% | CBD: {item.cbd}%
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Feather name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Strains</Text>
        <Text style={styles.subtitle}>
          Select strains you've enjoyed in the past
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search strains..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredStrains}
        renderItem={renderStrainItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.strainsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyStateText}>No strains found</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.selectionCount}>
          {selectedStrains.length} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedStrains.length === 0 || isLoading) && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selectedStrains.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Finish</Text>
              <Feather name="check" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  strainsList: {
    padding: 16,
    paddingTop: 8,
  },
  strainCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedStrainCard: {
    borderColor: '#10b981',
    backgroundColor: '#0D3229',
  },
  strainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  strainTypeIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  strainInfo: {
    flex: 1,
  },
  strainName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  strainDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strainType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  strainStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 