import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabStackParamList } from '../navigation';
import type { Review, User } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { mockUsers, mockReviews, mockStrains, mockFavorites, mockFollows } from '../data/mockData';
import { getStrainImage } from '../utils/imageUtils';

type ProfileScreenProps = BottomTabScreenProps<TabStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define a type for the strain data from favorites
interface FavoriteStrain {
  id: string;
  name: string;
  type: string;
  image_url?: string;
}

// Extended Review type that includes the strain data
interface ExtendedReview extends Review {
  id: string;
  user_id: string;
  strain_id: string;
  rating: number;
  content: string;
  created_at: string;
  strains?: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
}

export default function ProfileScreen({ route }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [favorites, setFavorites] = useState<FavoriteStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  // Use a mock current user ID
  const currentUserId = 'user-1'; // Using JaneGreen as the current user

  useEffect(() => {
    fetchUserProfile();
    fetchUserReviews();
    fetchUserFavorites();
    fetchFollowCounts();
  }, []);

  async function fetchUserProfile() {
    try {
      setLoading(true);
      
      // Use mock data instead of Supabase
      const user = mockUsers.find(u => u.id === currentUserId);
      
      if (user) {
        setUser(user);
      } else {
        setError('User not found in mock data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      setLoading(false);
    }
  }

  async function fetchUserReviews() {
    try {
      // Use mock data instead of Supabase
      const userReviews = mockReviews
        .filter(review => review.user_id === currentUserId)
        .map(review => {
          return {
            id: review.id,
            user_id: review.user_id,
            strain_id: review.strain_id,
            rating: review.rating,
            content: review.review_text,
            created_at: review.created_at,
            strains: {
              id: review.strains.id,
              name: review.strains.name,
              type: review.strains.type,
              image_url: review.strains.image_url
            }
          } as ExtendedReview;
        });
      
      setReviews(userReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }

  async function fetchUserFavorites() {
    try {
      // Use mock data instead of Supabase
      const userFavorites = mockFavorites
        .filter(fav => fav.user_id === currentUserId)
        .map(fav => {
          const strain = mockStrains.find(s => s.id === fav.strain_id);
          if (strain) {
            return {
              id: strain.id,
              name: strain.name,
              type: strain.type,
              image_url: strain.image_url
            } as FavoriteStrain;
          }
          return null;
        })
        .filter((strain): strain is FavoriteStrain => strain !== null);
      
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  async function fetchFollowCounts() {
    try {
      // Get follower count from mock data
      const followerCount = mockFollows.filter(
        follow => follow.following_id === currentUserId
      ).length;
      
      // Get following count from mock data
      const followingCount = mockFollows.filter(
        follow => follow.follower_id === currentUserId
      ).length;
      
      setFollowerCount(followerCount);
      setFollowingCount(followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  }

  const renderReviewItem = ({ item }: { item: ExtendedReview }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.strain_id })}
    >
      <View style={styles.reviewHeader}>
        <Text style={styles.strainName}>{item.strains?.name || 'Unknown Strain'}</Text>
        <Text style={styles.strainType}>{item.strains?.type || 'Unknown Type'}</Text>
      </View>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={[styles.star, star <= item.rating ? styles.filledStar : {}]}>
            ★
          </Text>
        ))}
      </View>
      <Text style={styles.reviewText} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderFavoriteItem = ({ item }: { item: FavoriteStrain }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
        style={styles.favoriteImage}
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'User not found'}</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => console.log('Login button pressed')}
        >
          <Text style={styles.editProfileText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.bio}>{user?.bio || 'No bio yet'}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsButton}>
              <Feather name="settings" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statNumber}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('UserFavorites', { userId: user?.id || '' })}
        >
          <Text style={styles.statNumber}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statNumber}>{followerCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* Favorites Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserFavorites', { userId: user?.id || '' })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoritesList}
          />
        ) : (
          <Text style={styles.emptyText}>No favorites yet</Text>
        )}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserReviews', { userId: user?.id || '' })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {reviews.length > 0 ? (
          <FlatList
            data={reviews.slice(0, 3)}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.reviewsList}
          />
        ) : (
          <Text style={styles.emptyText}>No reviews yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bio: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 6,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesList: {
    paddingBottom: 8,
  },
  favoriteCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  favoriteInfo: {
    padding: 8,
  },
  favoriteName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  favoriteType: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  reviewsList: {
    paddingBottom: 8,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  strainType: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  star: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 16,
    marginRight: 2,
  },
  filledStar: {
    color: '#10B981',
  },
  reviewText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  reviewDate: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#FF4040',
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 16,
  },
}); 