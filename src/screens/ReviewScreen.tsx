import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockStrains, mockUsers } from '../data/mockData';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { getStrainImageSync, DEFAULT_STRAIN_IMAGE } from '../utils/imageUtils';
import { getReviewById } from '../services/supabaseService';
import { ExtendedReview } from '../services/supabaseService';

type RootStackParamList = {
  Home: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export const ReviewScreen = ({ route, navigation }: Props) => {
  const { reviewId } = route.params;
  const [review, setReview] = useState<ExtendedReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        const reviewData = await getReviewById(reviewId);
        setReview(reviewData);
        if (!reviewData) {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching review:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={24}
          color={star <= rating ? "#10B981" : "#4B5563"}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (error || !review) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Review not found</Text>
      </View>
    );
  }

  const strain = review.strains;
  const user = mockUsers.find(u => u.id === review.user_id);

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const navigateToUserProfile = () => {
    navigation.navigate('UserProfile', { userId: review.user_id });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info and strain */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={navigateToUserProfile}
          >
            <Image 
              source={{ uri: user.avatar_url || 'https://via.placeholder.com/50' }} 
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.strainBadge}
            onPress={() => navigation.navigate('Strain', { strainId: strain?.id || '' })}
          >
            <Text style={styles.strainName}>{strain?.name}</Text>
            <Text style={styles.strainType}>{strain?.type}</Text>
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingValue}>{review.rating.toFixed(1)}</Text>
          {renderStars(review.rating)}
        </View>

        {/* Review text */}
        <View style={styles.reviewTextSection}>
          <Text style={styles.reviewText}>{review.review_text}</Text>
        </View>

        {/* Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effects Experienced</Text>
          <View style={styles.tags}>
            {review.effects && review.effects.map((effect, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{effect}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Flavors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flavors Noted</Text>
          <View style={styles.tags}>
            {review.flavors && review.flavors.map((flavor, index) => (
              <View key={index} style={styles.flavorTag}>
                <Text style={styles.flavorTagText}>{flavor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Photos section - now using our updated image utility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photosGrid}>
            <TouchableOpacity 
              onPress={() => strain && navigation.navigate('Strain', { strainId: strain.id })}
            >
              <Image 
                source={strain ? getStrainImageSync(strain.id) : DEFAULT_STRAIN_IMAGE} 
                style={styles.photo}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View style={styles.addPhotoButton}>
              <MaterialCommunityIcons name="camera-plus" size={32} color="#6B7280" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </View>
          </View>
        </View>

        {/* Notes section - placeholder for now */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Notes</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              {review.review_text.length > 100 
                ? "No additional notes added yet."
                : "This strain helped with my anxiety and was perfect for evening use. Would definitely try again."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Edit Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
          <MaterialCommunityIcons name="delete" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    justifyContent: 'center',
  },
  username: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  strainBadge: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  strainName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  strainType: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 4,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewTextSection: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  reviewText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    lineHeight: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  tagText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  flavorTag: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  flavorTagText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: Dimensions.get('window').width * 0.4,
    height: Dimensions.get('window').width * 0.4,
    borderRadius: 8,
  },
  addPhotoButton: {
    width: Dimensions.get('window').width * 0.4,
    height: Dimensions.get('window').width * 0.4,
    borderRadius: 8,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    color: '#6B7280',
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  noteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    backgroundColor: '#18181B',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 