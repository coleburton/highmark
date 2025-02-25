import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabStackParamList } from '../navigation';
import type { Review, User } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type ProfileScreenProps = BottomTabScreenProps<TabStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen({ route }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  useEffect(() => {
    fetchUserProfile();
    fetchUserReviews();
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserReviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            strains (
              name,
              type
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setReviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }

  const renderReviewItem = ({ item }: { item: any }) => (
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.bio}>{user?.bio || 'No bio yet'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Lists</Text>
        </View>
      </View>

      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reviews yet</Text>
          }
        />
      </View>
    </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  reviewsList: {
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
  },
}); 