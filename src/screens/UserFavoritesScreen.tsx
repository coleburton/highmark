import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type UserFavoritesScreenProps = NativeStackScreenProps<RootStackParamList, 'UserFavorites'>;
type UserFavoritesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define a type for the strain data from favorites
interface FavoriteStrain {
  id: string;
  name: string;
  type: string;
  image_url?: string;
  THC_percentage?: number;
  CBD_percentage?: number;
}

export default function UserFavoritesScreen({ route }: UserFavoritesScreenProps) {
  const { userId } = route.params;
  const [favorites, setFavorites] = useState<FavoriteStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const navigation = useNavigation<UserFavoritesNavigationProp>();

  useEffect(() => {
    fetchUserFavorites();
    fetchUsername();
  }, [userId]);

  async function fetchUsername() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      if (data) {
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  }

  async function fetchUserFavorites() {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          strain_id,
          strains (
            id,
            name,
            type,
            image_url,
            THC_percentage,
            CBD_percentage
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Extract the strain data from the favorites
      if (data) {
        // Use any type to bypass TypeScript checking for this complex nested structure
        const strainData: FavoriteStrain[] = (data as any[]).map(item => ({
          id: item.strains.id,
          name: item.strains.name,
          type: item.strains.type,
          image_url: item.strains.image_url,
          THC_percentage: item.strains.THC_percentage,
          CBD_percentage: item.strains.CBD_percentage
        }));
        setFavorites(strainData);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderFavoriteItem = ({ item }: { item: FavoriteStrain }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.strainImage}
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainType}>{item.type}</Text>
        <View style={styles.percentages}>
          {item.THC_percentage !== undefined && (
            <Text style={styles.percentage}>THC: {item.THC_percentage}%</Text>
          )}
          {item.CBD_percentage !== undefined && (
            <Text style={styles.percentage}>CBD: {item.CBD_percentage}%</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {username ? `${username}'s Favorites` : 'User Favorites'}
        </Text>
        <Text style={styles.favoriteCount}>
          {favorites.length} {favorites.length === 1 ? 'strain' : 'strains'}
        </Text>
      </View>
      
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.favoritesList}
          numColumns={2}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorites yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  favoriteCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  favoritesList: {
    padding: 8,
  },
  favoriteCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '47%',
  },
  strainImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  favoriteInfo: {
    padding: 12,
  },
  strainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  strainType: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 8,
  },
  percentages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  percentage: {
    color: '#10B981',
    fontSize: 12,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
}); 