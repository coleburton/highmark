import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockStrains, mockReviews, mockUsers, mockLists } from '../data/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllStrainImages, hasMultipleImages, getStrainImage } from '../utils/imageUtils';
import { ListModal } from '../components/ListModal';
import { List } from '../types';

type RootStackParamList = {
  Home: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Strain'>;

type RatingCounts = {
  [K in 1|2|3|4|5]: number;
};

export const StrainScreen = ({ route, navigation }: Props) => {
  const { strainId } = route.params;
  const strain = mockStrains.find((s) => s.id === strainId);
  const strainReviews = mockReviews.filter((r) => r.strain_id === strainId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [listModalVisible, setListModalVisible] = useState(false);
  
  // In a real app, this would come from the authenticated user
  const currentUserId = 'u1';
  
  // Get all available images for this strain
  const strainImages = useMemo(() => {
    if (!strain) return [];
    return getAllStrainImages(strain.id);
  }, [strain]);

  // Get user's lists
  const userLists = useMemo(() => {
    return mockLists.filter(list => list.user_id === currentUserId);
  }, [currentUserId]);

  // Check if strain is in any of the user's lists
  const isInAnyList = useMemo(() => {
    return userLists.some(list => list.strains.includes(strainId));
  }, [userLists, strainId]);

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    const totalReviews = strainReviews.length;
    const avgRating = totalReviews > 0 
      ? strainReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;
    
    const ratingCounts: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    strainReviews.forEach(r => {
      const rating = Math.round(r.rating) as keyof RatingCounts;
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating] += 1;
      }
    });

    const maxCount = Math.max(...Object.values(ratingCounts), 1); // Avoid division by zero

    return {
      averageRating: avgRating,
      totalReviews,
      ratingCounts,
      maxCount,
    };
  }, [strainReviews]);

  // Handle adding strain to a list
  const handleAddToList = (listId: string) => {
    // In a real app, this would make an API call
    console.log(`Adding strain ${strainId} to list ${listId}`);
    // For now, we'll just update our mock data
    const updatedLists = mockLists.map(list => {
      if (list.id === listId && !list.strains.includes(strainId)) {
        return {
          ...list,
          strains: [...list.strains, strainId]
        };
      }
      return list;
    });
    // In a real app, this would update the state or trigger a refetch
  };

  // Handle removing strain from a list
  const handleRemoveFromList = (listId: string) => {
    // In a real app, this would make an API call
    console.log(`Removing strain ${strainId} from list ${listId}`);
    // For now, we'll just update our mock data
    const updatedLists = mockLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          strains: list.strains.filter(id => id !== strainId)
        };
      }
      return list;
    });
    // In a real app, this would update the state or trigger a refetch
  };

  // Handle creating a new list
  const handleCreateNewList = (title: string) => {
    // In a real app, this would make an API call
    console.log(`Creating new list "${title}" with strain ${strainId}`);
    // For now, we'll just update our mock data
    const newList: List = {
      id: `l${mockLists.length + 1}`,
      user_id: currentUserId,
      title,
      is_public: true,
      strains: [strainId],
      created_at: new Date().toISOString(),
    };
    // In a real app, this would update the state or trigger a refetch
  };

  if (!strain) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Strain not found</Text>
      </View>
    );
  }

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

  const renderHistogramBar = (rating: number, count: number) => {
    const percentage = (count / reviewStats.maxCount) * 100;
    return (
      <View key={rating} style={styles.histogramRow}>
        <Text style={styles.histogramLabel}>{rating}</Text>
        <View style={styles.histogramBarContainer}>
          <View style={[styles.histogramBar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.histogramCount}>{count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.heroSection}>
          <Image 
            source={strainImages[activeImageIndex]} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
          
          {/* Image gallery dots indicator */}
          {strainImages.length > 1 && (
            <View style={styles.imageDots}>
              {strainImages.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.imageDot, 
                    index === activeImageIndex && styles.activeImageDot
                  ]} 
                />
              ))}
            </View>
          )}
          
          <View style={styles.heroContent}>
            <Text style={styles.name}>{strain.name}</Text>
            <Text style={styles.type}>{strain.type}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="eye" size={24} color="#10B981" />
                <Text style={styles.actionButtonText}>Try</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="heart" size={24} color="#10B981" />
                <Text style={styles.actionButtonText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  isInAnyList && styles.activeActionButton
                ]}
                onPress={() => setListModalVisible(true)}
              >
                <MaterialCommunityIcons 
                  name="playlist-plus" 
                  size={24} 
                  color={isInAnyList ? "#FFFFFF" : "#10B981"} 
                />
                <Text 
                  style={[
                    styles.actionButtonText,
                    isInAnyList && styles.activeActionButtonText
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Image gallery if multiple images exist */}
        {strainImages.length > 1 && (
          <View style={styles.imageGallery}>
            <FlatList
              horizontal
              data={strainImages}
              keyExtractor={(_, index) => `image-${index}`}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onPress={() => setActiveImageIndex(index)}
                  style={[
                    styles.thumbnailContainer,
                    index === activeImageIndex && styles.activeThumbnail
                  ]}
                >
                  <Image source={item} style={styles.thumbnail} resizeMode="cover" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.galleryContent}
            />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>THC</Text>
              <Text style={styles.statValue}>{strain.THC_percentage}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CBD</Text>
              <Text style={styles.statValue}>{strain.CBD_percentage}%</Text>
            </View>
          </View>

          {strain.description && (
            <View style={styles.section}>
              <Text style={styles.description}>{strain.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Effects</Text>
            <View style={styles.tags}>
              {strain.effects.map((effect, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{effect}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flavors</Text>
            <View style={styles.tags}>
              {strain.flavors.map((flavor, index) => (
                <View key={index} style={styles.flavorTag}>
                  <Text style={styles.flavorTagText}>{flavor}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            
            {/* Review Statistics */}
            <View style={styles.reviewStats}>
              <View style={styles.averageRating}>
                <Text style={styles.averageRatingNumber}>
                  {reviewStats.averageRating.toFixed(1)}
                </Text>
                {renderStars(reviewStats.averageRating)}
                <Text style={styles.totalReviews}>
                  {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
              
              <View style={styles.histogram}>
                {([5, 4, 3, 2, 1] as const).map(rating => 
                  renderHistogramBar(rating, reviewStats.ratingCounts[rating])
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => {
                // TODO: Navigate to add review screen
                console.log('Add review');
              }}
            >
              <Text style={styles.addReviewText}>Write a Review</Text>
            </TouchableOpacity>

            {strainReviews.map((review) => (
              <View
                key={review.id}
                style={styles.reviewCard}
              >
                <View style={styles.reviewHeader}>
                  <TouchableOpacity 
                    style={styles.userContainer}
                    onPress={() => navigation.navigate('UserProfile', { userId: review.user_id })}
                  >
                    <Image
                      source={{ uri: mockUsers.find(user => user.id === review.user_id)?.avatar_url || 'https://via.placeholder.com/40' }}
                      style={styles.avatar}
                    />
                    <View style={styles.reviewHeaderText}>
                      <Text style={styles.username}>
                        {mockUsers.find(user => user.id === review.user_id)?.username || 'Unknown User'}
                      </Text>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Review', { reviewId: review.id })}>
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {review.review_text}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* List Modal */}
      <ListModal
        visible={listModalVisible}
        onClose={() => setListModalVisible(false)}
        strainId={strainId}
        userLists={userLists}
        onAddToList={handleAddToList}
        onRemoveFromList={handleRemoveFromList}
        onCreateNewList={handleCreateNewList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  heroSection: {
    height: Dimensions.get('window').height * 0.5,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.75,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  type: {
    fontSize: 18,
    color: '#10B981',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activeActionButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  actionButtonText: {
    color: '#ffffff',
    marginTop: 4,
    fontSize: 12,
  },
  activeActionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#27272A',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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
  reviewStats: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  averageRating: {
    alignItems: 'center',
    marginBottom: 24,
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  totalReviews: {
    color: '#6B7280',
    marginTop: 8,
  },
  histogram: {
    gap: 8,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histogramLabel: {
    width: 24,
    color: '#6B7280',
  },
  histogramBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#27272A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  histogramBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  histogramCount: {
    width: 24,
    color: '#6B7280',
    textAlign: 'right',
  },
  addReviewButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  addReviewText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  imageDots: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeImageDot: {
    backgroundColor: '#10B981',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  imageGallery: {
    marginTop: 16,
    marginBottom: 8,
  },
  galleryContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#10B981',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
}); 