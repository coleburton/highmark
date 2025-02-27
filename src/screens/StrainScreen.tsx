import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Animated, Modal, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockStrains, mockReviews, mockUsers, mockLists } from '../data/mockData';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { getAllStrainImages, hasMultipleImages, getStrainImage } from '../utils/imageUtils';
import { ListModal } from '../components/ListModal';
import { List, Strain, Review } from '../types';
import { supabase } from '../lib/supabase';
// Import shared cache from HomeScreen
import { strainCache, reviewCache } from '../screens/HomeScreen';

type RootStackParamList = {
  Home: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
  AddReview: { strainId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Strain'>;

type RatingCounts = {
  [K in 1|2|3|4|5]: number;
};

// Simple Rating component
const Rating = ({ value, size = 16, readonly = false }: { value: number, size?: number, readonly?: boolean }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <MaterialCommunityIcons
        key={i}
        name={i <= value ? 'star' : 'star-outline'}
        size={size}
        color={i <= value ? '#F59E0B' : '#6B7280'}
      />
    );
  }
  return <View style={{ flexDirection: 'row' }}>{stars}</View>;
};

// Format date helper function
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const StrainScreen = ({ route, navigation }: Props) => {
  const { strainId } = route.params;
  const [loading, setLoading] = useState(true);
  const [strain, setStrain] = useState<Strain | undefined>(strainCache.get(strainId));
  const [strainReviews, setStrainReviews] = useState<Review[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [listModalVisible, setListModalVisible] = useState(false);
  
  // In a real app, this would come from the authenticated user
  const currentUserId = 'u1';
  
  // Fetch data function - now optimized with caching
  const fetchData = useCallback(async () => {
    // If we already have the strain in cache and it's set in state, skip loading
    if (strainCache.has(strainId) && strain) {
      // Just fetch reviews if needed
      if (!reviewCache.has(strainId)) {
        await fetchReviews();
      }
      setLoading(false);
      return;
    }
    
    try {
      // First try to get the strain from Supabase
      const { data: supabaseStrain, error } = await supabase
        .from('strains')
        .select('*')
        .eq('id', strainId)
        .single();
      
      if (supabaseStrain) {
        console.log(`Found strain in Supabase: ${supabaseStrain.name}`);
        const typedStrain = supabaseStrain as Strain;
        setStrain(typedStrain);
        strainCache.set(strainId, typedStrain);
        
        // Get strain reviews from Supabase
        await fetchReviews();
      } else {
        // Fallback to mock data if not found in Supabase
        console.log(`Strain not found in Supabase, trying mock data...`);
        const foundStrain = mockStrains.find((s) => s.id === strainId);
        
        if (foundStrain) {
          console.log(`Found strain in mock data: ${foundStrain.name}`);
          setStrain(foundStrain);
          strainCache.set(strainId, foundStrain);
          
          // Get strain reviews from mock data
          const reviews = mockReviews.filter((r) => r.strain_id === strainId);
          setStrainReviews(reviews);
          reviewCache.set(strainId, reviews);
        } else {
          console.warn(`Strain not found with ID: ${strainId}`);
          console.warn(`Available strain IDs: ${mockStrains.map(s => s.id).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error fetching strain:', error);
      
      // Fallback to mock data on error
      const foundStrain = mockStrains.find((s) => s.id === strainId);
      if (foundStrain) {
        setStrain(foundStrain);
        strainCache.set(strainId, foundStrain);
        
        const reviews = mockReviews.filter((r) => r.strain_id === strainId);
        setStrainReviews(reviews);
        reviewCache.set(strainId, reviews);
      }
    } finally {
      setLoading(false);
    }
  }, [strainId, strain]);
  
  // Separate function to fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Make sure strain is defined before accessing its id
      if (!strain) {
        console.error('Strain is undefined');
        return;
      }
      
      // Check if the strain ID is a mock ID (starts with "strain-")
      const isMockId = strain.id.startsWith('strain-');
      
      if (isMockId) {
        console.log('Using mock data for strain reviews with ID:', strain.id);
        // Get strain reviews from mock data
        const reviews = mockReviews.filter((r) => r.strain_id === strain.id);
        setStrainReviews(reviews);
        reviewCache.set(strain.id, reviews);
        return;
      }
      
      // If it's a real UUID, use Supabase
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('strain_id', strain.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      console.log('Fetched reviews:', data);
      setStrainReviews(data || []);
    } catch (error) {
      console.error('Error in fetchReviews:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Get all available images for this strain
  const strainImages = useMemo(() => {
    if (!strain) return [];
    // If the strain has an image_url, use it
    if (strain.image_url) {
      return [{ uri: strain.image_url }];
    }
    // Otherwise fall back to the legacy function
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

  // If loading, show a loading indicator
  if (loading) {
    // If we have the strain in cache, show a partial UI with skeleton loaders
    if (strain) {
      return (
        <View style={styles.container}>
          <ScrollView>
            <View style={styles.heroSection}>
              <Image 
                source={strain.image_url ? { uri: strain.image_url } : getAllStrainImages(strain.id)[0]} 
                style={styles.heroImage} 
                resizeMode="cover"
              />
              
              <View style={styles.heroContent}>
                <Text style={styles.name}>{strain.name}</Text>
                <Text style={styles.type}>{strain.type}</Text>
                
                {/* Skeleton for action buttons */}
                <View style={styles.actionButtons}>
                  {[1, 2, 3].map((_, index) => (
                    <View key={index} style={[styles.actionButton, styles.skeletonItem]} />
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.content}>
              {/* Skeleton for stats */}
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
              
              {/* Skeleton for content sections */}
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.section}>
                  <View style={[styles.skeletonItem, { width: '40%', height: 24, marginBottom: 16 }]} />
                  <View style={[styles.skeletonItem, { width: '100%', height: 100 }]} />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }
    
    // Otherwise show the full loading screen
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading strain details...</Text>
      </View>
    );
  }

  // If strain not found, show the not found screen
  if (!strain) {
    return (
      <View style={styles.container}>
        <View style={styles.notFoundContainer}>
          <MaterialCommunityIcons name="cannabis" size={64} color="#10B981" style={styles.notFoundIcon} />
          <Text style={styles.notFoundTitle}>Strain not found</Text>
          <Text style={styles.notFoundText}>
            The strain you're looking for doesn't exist or may have been removed.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderReviewItem = ({ item }: { item: Review }) => {
    // Get the user profile from the review
    const userProfile = item.profiles;
    
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={
                userProfile?.avatar_url 
                  ? { uri: userProfile.avatar_url } 
                  : require('../../assets/images/avatar-placeholder.png')
              } 
              style={styles.userAvatar} 
            />
            <View>
              <Text style={styles.userName}>
                {userProfile?.username || mockUsers.find(user => user.id === item.user_id)?.username || 'Unknown User'}
              </Text>
              <View style={styles.ratingContainer}>
                <Rating 
                  value={item.rating} 
                  size={16} 
                  readonly 
                />
                <Text style={styles.reviewDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => console.log('More options')}
          >
            <Feather name="more-vertical" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.reviewText}>{item.review_text}</Text>
        
        {item.effects && item.effects.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Effects:</Text>
            <View style={styles.tagsList}>
              {item.effects.map((effect, index) => (
                <View key={`effect-${index}`} style={styles.tagItem}>
                  <Text style={styles.tagText}>{effect}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {item.flavors && item.flavors.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Flavors:</Text>
            <View style={styles.tagsList}>
              {item.flavors.map((flavor, index) => (
                <View key={`flavor-${index}`} style={styles.tagItem}>
                  <Text style={styles.tagText}>{flavor}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.reviewActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('Like review')}
          >
            <Feather name="thumbs-up" size={18} color="#9CA3AF" />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('Comment on review')}
          >
            <Feather name="message-circle" size={18} color="#9CA3AF" />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('Share review')}
          >
            <Feather name="share-2" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          
          {/* Rating overlay on image */}
          {reviewStats.totalReviews > 0 && (
            <View style={styles.ratingOverlay}>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={18} color="#10B981" />
                <Text style={styles.ratingText}>
                  {reviewStats.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>
                  ({reviewStats.totalReviews})
                </Text>
              </View>
            </View>
          )}
          
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
              {strain.effects.map((effect: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{effect}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flavors</Text>
            <View style={styles.tags}>
              {strain.flavors.map((flavor: string, index: number) => (
                <View key={index} style={styles.flavorTag}>
                  <Text style={styles.flavorTagText}>{flavor}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ratings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RATINGS</Text>
            <View style={styles.ratingsContainer}>
              <View style={styles.ratingScoreContainer}>
                <Text style={styles.ratingScoreText}>{reviewStats.averageRating.toFixed(1)}</Text>
                <View style={styles.ratingStars}>
                  {renderStars(reviewStats.averageRating)}
                </View>
              </View>
              
              <View style={styles.histogramContainer}>
                {([5, 4, 3, 2, 1] as const).map(rating => renderHistogramBar(rating, reviewStats.ratingCounts[rating]))}
              </View>
            </View>
            
            <Text style={styles.totalReviewsText}>
              Based on {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => {
                navigation.navigate('AddReview', { strainId: strain.id });
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
                      source={{ uri: (review.profiles?.avatar_url || mockUsers.find(user => user.id === review.user_id)?.avatar_url || 'https://via.placeholder.com/40') }}
                      style={styles.avatar}
                    />
                    <View style={styles.reviewHeaderText}>
                      <Text style={styles.username}>
                        {review.profiles?.username || mockUsers.find(user => user.id === review.user_id)?.username || 'Unknown User'}
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

          {/* Related Strains Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Strains</Text>
            <FlatList
              horizontal
              data={mockStrains
                .filter(s => s.id !== strain.id && s.type === strain.type)
                .slice(0, 5)}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                // Prefetch related strain data
                if (!strainCache.has(item.id)) {
                  // We don't await this - it's a background prefetch
                  (async () => {
                    try {
                      const { data } = await supabase
                        .from('strains')
                        .select('*')
                        .eq('id', item.id)
                        .single();
                        
                      if (data) strainCache.set(item.id, data as Strain);
                    } catch (error) {
                      console.log('Error prefetching related strain:', error);
                    }
                  })();
                }
                
                return (
                  <TouchableOpacity 
                    style={styles.relatedStrainCard}
                    onPress={() => {
                      // Navigate to the strain without resetting the screen
                      navigation.push('Strain', { strainId: item.id });
                    }}
                  >
                    <Image 
                      source={item.image_url ? { uri: item.image_url } : getStrainImage(item.id)} 
                      style={styles.relatedStrainImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.relatedStrainContent}>
                      <Text style={styles.relatedStrainName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.relatedStrainType}>{item.type}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.relatedStrainsContainer}
            />
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
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  tagText: {
    color: '#10B981',
    fontSize: 14,
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
  description: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  effectsContainer: {
    marginBottom: 24,
  },
  effectsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  effectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  effectItem: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  effectText: {
    color: '#10B981',
    fontSize: 14,
  },
  flavorsContainer: {
    marginBottom: 24,
  },
  flavorsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  flavorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flavorItem: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  flavorText: {
    color: '#F97316',
    fontSize: 14,
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  reviewsCount: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  reviewsSummary: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewsRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsRatingScore: {
    marginRight: 16,
  },
  ratingScoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  histogramContainer: {
    flex: 1,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  histogramLabel: {
    width: 20,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  histogramBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  histogramBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  histogramCount: {
    width: 30,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  writeReviewButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  writeReviewText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsList: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 8,
  },
  moreButton: {
    padding: 4,
  },
  reviewText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsTitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  histogramBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  histogramRatingNumber: {
    width: 20,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  histogramBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  histogramBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  imageIndicatorActive: {
    backgroundColor: '#ffffff',
  },
  addToListButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  modalListItemText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createListButton: {
    marginTop: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createListButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#4B5563',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkIcon: {
    marginLeft: 8,
    opacity: 0.7,
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
  activeActionButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
  statDivider: {
    width: 1,
    backgroundColor: '#27272A',
    marginHorizontal: 16,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
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
  ratingsContainer: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  ratingScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    marginRight: 24,
  },
  totalReviewsText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  relatedStrainsContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  relatedStrainCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 12,
  },
  relatedStrainImage: {
    width: '100%',
    height: 120,
    opacity: 0.8,
  },
  relatedStrainContent: {
    padding: 12,
  },
  relatedStrainName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  relatedStrainType: {
    color: '#10B981',
    fontSize: 14,
  },
  skeletonItem: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    overflow: 'hidden',
    opacity: 0.7,
  },
  ratingOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 4,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundIcon: {
    fontSize: 48,
    color: '#666',
    marginBottom: 10,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notFoundText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  flavorTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  flavorTagText: {
    color: '#333',
    fontSize: 14,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
}); 