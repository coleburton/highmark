import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mockUsers } from '../data/mockData';

type UserReviewsScreenProps = NativeStackScreenProps<RootStackParamList, 'UserReviews'>;
type UserReviewsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extended Review type that includes the strain data
interface ExtendedReview {
  id: string;
  user_id: string;
  strain_id: string;
  rating: number;
  review_text: string;
  effects: string[];
  flavors: string[];
  created_at: string;
  strains?: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
}

export default function UserReviewsScreen({ route }: UserReviewsScreenProps) {
  const { userId } = route.params;
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const navigation = useNavigation<UserReviewsNavigationProp>();

  useEffect(() => {
    fetchUserReviews();
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

  async function fetchUserReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          strains (
            id,
            name,
            type,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderReviewItem = ({ item }: { item: ExtendedReview }) => {
    // State to track if the review is expanded
    const [expanded, setExpanded] = React.useState(false);
    
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
          numberOfLines={expanded ? undefined : 3}
        >
          {item.review_text}
        </Text>
        {isLongReview && (
          <TouchableOpacity 
            onPress={() => setExpanded(!expanded)} 
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {expanded ? 'Show Less' : 'Read More'}
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {username ? `${username}'s Reviews` : 'User Reviews'}
        </Text>
        <Text style={styles.reviewCount}>
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </Text>
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reviews yet</Text>
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
  reviewCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  reviewsList: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
  reviewDate: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
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