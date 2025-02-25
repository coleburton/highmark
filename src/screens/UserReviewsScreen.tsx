import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

  const renderReviewItem = ({ item }: { item: ExtendedReview }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => navigation.navigate('Review', { reviewId: item.id })}
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
      <Text style={styles.reviewText} numberOfLines={3}>
        {item.review_text}
      </Text>
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

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