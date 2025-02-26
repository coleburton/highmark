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
  strain_id: string;
  name: string;
  type: string;
  image_url?: string;
  thc_percentage?: number;
  cbd_percentage?: number;
  avg_rating?: number;
  favorite_id: string;
  created_at: string;
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
      setLoading(true);
      
      // Try to use the stored function defined in supabase_instructions.md
      try {
        const { data, error } = await supabase
          .rpc('get_user_favorites', { user_uuid: userId });
          
        if (error) throw error;
        
        if (data) {
          setFavorites(data);
          return; // Exit early if successful
        }
      } catch (rpcError) {
        console.error('RPC function not available:', rpcError);
        // Continue to fallback
      }
      
      // Fallback: Fetch favorites and join with strains manually
      // First, get the favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, strain_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (favoritesError) throw favoritesError;
      
      if (favoritesData && favoritesData.length > 0) {
        // Get all strain IDs from favorites
        const strainIds = favoritesData.map(fav => fav.strain_id);
        
        // Fetch strain details for these IDs
        const { data: strainsData, error: strainsError } = await supabase
          .from('strains')
          .select('id, name, type, image_url, thc_percentage, cbd_percentage')
          .in('id', strainIds);
          
        if (strainsError) throw strainsError;
        
        if (strainsData) {
          // Create a map of strain data by ID for easy lookup
          const strainsMap = new Map(
            strainsData.map(strain => [strain.id, strain])
          );
          
          // Combine favorites with strain data
          const combinedData: FavoriteStrain[] = favoritesData.map(fav => {
            const strain = strainsMap.get(fav.strain_id);
            return {
              favorite_id: fav.id,
              strain_id: fav.strain_id,
              created_at: fav.created_at,
              name: strain?.name || 'Unknown Strain',
              type: strain?.type || 'Unknown',
              image_url: strain?.image_url,
              thc_percentage: strain?.thc_percentage,
              cbd_percentage: strain?.cbd_percentage
            };
          });
          
          setFavorites(combinedData);
        }
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
        
      if (error) throw error;
      
      // Update the UI by removing the deleted favorite
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => fav.favorite_id !== favoriteId)
      );
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteStrain }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.strain_id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.strainImage}
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainType}>{item.type}</Text>
        <View style={styles.percentages}>
          {item.thc_percentage !== undefined && (
            <Text style={styles.percentage}>THC: {item.thc_percentage}%</Text>
          )}
          {item.cbd_percentage !== undefined && (
            <Text style={styles.percentage}>CBD: {item.cbd_percentage}%</Text>
          )}
          {item.avg_rating !== undefined && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)}</Text>
              <Text style={styles.ratingIcon}>★</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.favorite_id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
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
          keyExtractor={(item) => item.favorite_id}
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
    position: 'relative',
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
    alignItems: 'center',
  },
  percentage: {
    color: '#10B981',
    fontSize: 12,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginRight: 2,
  },
  ratingIcon: {
    color: '#FFD700',
    fontSize: 12,
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
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 