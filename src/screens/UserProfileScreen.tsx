import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import type { Review, User, Strain } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { mockUsers, mockReviews, mockStrains, mockFavorites, mockFollows } from '../data/mockData';
import { getStrainImage } from '../utils/imageUtils';

type UserProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define a type for the strain data from favorites
interface FavoriteStrain {
  id: string;
  name: string;
  type: string;
  image_url?: string;
}

// Define a type for the favorites data returned from Supabase
interface FavoriteData {
  strain_id: string;
  strains: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
}

// Extended Review type that includes the strain data
interface ExtendedReview extends Review {
  strains?: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
}

export default function UserProfileScreen({ route }: UserProfileScreenProps) {
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [favorites, setFavorites] = useState<FavoriteStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const navigation = useNavigation<UserProfileNavigationProp>();

  useEffect(() => {
    fetchCurrentUser();
    fetchUserProfile();
    fetchUserReviews();
    fetchUserFavorites();
    checkIfFollowing();
  }, [userId]);

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  async function fetchUserProfile() {
    try {
      setLoading(true);
      
      // Use mock data instead of Supabase
      const user = mockUsers.find(u => u.id === userId);
      
      if (user) {
        setUser(user);
      } else {
        console.error('User not found in mock data');
      }
      
      // In a real app with Supabase:
      // const { data, error } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', userId)
      //   .single();
      //   
      // if (error) throw error;
      // setUser(data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
    }
  }

  async function fetchUserReviews() {
    try {
      // Use mock data instead of Supabase
      const userReviews = mockReviews
        .filter(review => review.user_id === userId)
        .map(review => {
          // Find the corresponding strain
          const strain = mockStrains.find(s => s.id === review.strain_id);
          // Return the review with the strain data in the expected format
          return {
            ...review,
            strains: strain ? {
              id: strain.id,
              name: strain.name,
              type: strain.type,
              image_url: strain.image_url
            } : null
          } as ExtendedReview;
        })
        .slice(0, 3); // Get only the first 3 reviews
      
      setReviews(userReviews);
      
      // In a real app with Supabase:
      // const { data, error } = await supabase
      //   .from('reviews')
      //   .select(`
      //     *,
      //     strains (
      //       id,
      //       name,
      //       type,
      //       image_url
      //     )
      //   `)
      //   .eq('user_id', userId)
      //   .order('created_at', { ascending: false })
      //   .limit(3);
      //   
      // if (error) throw error;
      // setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }

  async function fetchUserFavorites() {
    try {
      // Use mock data instead of Supabase
      const userFavorites = mockFavorites
        .filter(fav => fav.user_id === userId)
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
        .filter((strain): strain is FavoriteStrain => strain !== null)
        .slice(0, 3); // Get only the first 3 favorites
      
      setFavorites(userFavorites);
      
      // In a real app with Supabase:
      // const { data, error } = await supabase
      //   .from('favorites')
      //   .select(`
      //     *,
      //     strains (*)
      //   `)
      //   .eq('user_id', userId)
      //   .limit(3);
      //   
      // if (error) throw error;
      // 
      // const strainData = data?.map(item => item.strains) || [];
      // setFavorites(strainData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  async function checkIfFollowing() {
    if (!currentUserId) return;
    
    try {
      // Use mock data instead of Supabase
      const following = mockFollows.some(
        follow => follow.follower_id === currentUserId && follow.following_id === userId
      );
      
      setIsFollowing(following);
      
      // In a real app with Supabase:
      // const { data, error } = await supabase
      //   .from('follows')
      //   .select('*')
      //   .eq('follower_id', currentUserId)
      //   .eq('following_id', userId)
      //   .single();
      //   
      // if (error && error.code !== 'PGRST116') throw error;
      // setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }

  async function toggleFollow() {
    if (!currentUserId) {
      Alert.alert('Sign In Required', 'Please sign in to follow users.');
      return;
    }
    
    if (currentUserId === userId) {
      Alert.alert('Error', 'You cannot follow yourself.');
      return;
    }
    
    try {
      setIsFollowing(prev => !prev);
      
      // In a real app, we would update the database:
      // if (isFollowing) {
      //   // Unfollow
      //   const { error } = await supabase
      //     .from('follows')
      //     .delete()
      //     .eq('follower_id', currentUserId)
      //     .eq('following_id', userId);
      //   
      //   if (error) throw error;
      // } else {
      //   // Follow
      //   const { error } = await supabase
      //     .from('follows')
      //     .insert({
      //       follower_id: currentUserId,
      //       following_id: userId,
      //     });
      //   
      //   if (error) throw error;
      // }
      
      // For mock data, we're just toggling the state without updating any data
      console.log(`User ${isFollowing ? 'unfollowed' : 'followed'} successfully`);
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert state on error
      setIsFollowing(prev => !prev);
    }
  }

  // Toggle expanded status for a review
  const toggleExpandedReview = (reviewId: string) => {
    setExpandedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId) 
        : [...prev, reviewId]
    );
  };

  const renderReviewItem = ({ item }: { item: ExtendedReview }) => {
    // Check if the review is expanded using the expandedReviews state
    const isExpanded = expandedReviews.includes(item.id);
    
    // Check if the review text is long enough to need expansion
    const isLongReview = item.review_text.length > 80;
    
    // Get the user data for the avatar
    const reviewUser = mockUsers.find(user => user.id === item.user_id);
    
    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => navigation.navigate('Review', { reviewId: item.id })}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.reviewHeaderLeft}>
            {/* User avatar */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('UserProfile', { userId: item.user_id })}
              style={styles.avatarContainer}
            >
              {reviewUser?.avatar_url ? (
                <Image 
                  source={{ uri: reviewUser.avatar_url }} 
                  style={styles.reviewAvatar} 
                />
              ) : (
                <View style={[styles.initialsAvatar, { backgroundColor: getRandomColor(item.user_id) }]}>
                  <Text style={styles.initialsText}>
                    {reviewUser?.username?.substring(0, 2).toUpperCase() || '??'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.strainInfo}>
              <Text style={styles.strainName}>{item.strains?.name || 'Unknown Strain'}</Text>
              <Text style={styles.strainType}>{item.strains?.type || 'Unknown Type'}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text key={star} style={[styles.star, star <= item.rating ? styles.filledStar : {}]}>
                ★
              </Text>
            ))}
          </View>
        </View>
        <Text 
          style={styles.reviewText} 
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.review_text}
        </Text>
        {isLongReview && (
          <TouchableOpacity 
            onPress={() => toggleExpandedReview(item.id)} 
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Helper function to generate consistent colors based on user ID
  const getRandomColor = (userId: string) => {
    // Simple hash function to generate a color from user ID
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      '#10B981', // emerald
      '#7C3AED', // purple
      '#F59E0B', // amber
      '#EF4444', // red
      '#3B82F6', // blue
      '#EC4899', // pink
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteStrain }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image
        source={getStrainImage(item.id)}
        style={styles.strainImage}
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainType}>{item.type}</Text>
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

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.bio}>{user.bio || 'No bio yet'}</Text>
          
          {currentUserId && currentUserId !== userId && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing ? styles.followingButton : {}
              ]}
              onPress={toggleFollow}
            >
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserFavorites', { userId })}>
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserReviews', { userId })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reviewsList}
          />
        ) : (
          <Text style={styles.emptyText}>No reviews yet</Text>
        )}
      </View>
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
  errorText: {
    color: '#FF4040',
    fontSize: 16,
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
  followButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followingButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  strainImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  favoriteInfo: {
    padding: 8,
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
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  reviewAvatar: {
    width: '100%',
    height: '100%',
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  strainInfo: {
    flex: 1,
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
    lineHeight: 20,
  },
  readMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  readMoreText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewDate: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 16,
  },
}); 