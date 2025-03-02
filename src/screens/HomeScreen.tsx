import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, StatusBar, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Strain, Review } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getStrainImage, getStrainImageSync, DEFAULT_STRAIN_IMAGE } from '../utils/imageUtils';
import { SearchBar } from '../components/SearchBar';
import { getFeaturedStrains, getRecentReviews, getUserFavoriteStrains, toggleFavoriteStrain, ExtendedReview as BaseExtendedReview } from '../services/supabaseService';

// Fallback to mock data if needed
import { mockStrains, mockReviews, mockUsers } from '../data/mockData';

// Import the strain cache from StrainScreen or create a shared cache utility
import { supabase } from '../lib/supabase';

// Create a shared cache that can be used across screens
export const strainCache = new Map<string, Strain>();
export const reviewCache = new Map<string, Review[]>();

type RootStackParamList = {
  Home: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extend the ExtendedReview interface to include user property
interface ExtendedReview extends Review {
  strains: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.65; // Make cards take up 65% of screen width
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for data
  const [strains, setStrains] = useState<Strain[]>([]);
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [favoriteStrains, setFavoriteStrains] = useState<string[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  
  // Loading states
  const [loadingStrains, setLoadingStrains] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch all data
  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStrains(),
      fetchReviews(),
      fetchFavorites()
    ]);
    setRefreshing(false);
  };

  // Fetch strains from Supabase
  const fetchStrains = async () => {
    setLoadingStrains(true);
    try {
      const data = await getFeaturedStrains();
      setStrains(data || []);
    } catch (error) {
      console.error('Error fetching strains:', error);
      setStrains([]);
    } finally {
      setLoadingStrains(false);
    }
  };

  // Fetch reviews from Supabase
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await getRecentReviews();
      if (data.length > 0) {
        setReviews(data);
      } else {
        // Fallback to mock data if no data from Supabase
        setReviews(mockReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews(mockReviews); // Fallback to mock data
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch user's favorite strains
  const fetchFavorites = async () => {
    try {
      const favoriteStrainIds = await getUserFavoriteStrains();
      setFavoriteStrains(favoriteStrainIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Toggle favorite status for a strain
  const handleToggleFavorite = async (strainId: string) => {
    try {
      // Optimistically update UI
      setFavoriteStrains(prev => 
        prev.includes(strainId) 
          ? prev.filter(id => id !== strainId) 
          : [...prev, strainId]
      );
      
      // Update in database
      const success = await toggleFavoriteStrain(strainId);
      
      if (!success) {
        // Revert if failed
        setFavoriteStrains(prev => 
          prev.includes(strainId) 
            ? prev.filter(id => id !== strainId) 
            : [...prev, strainId]
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Toggle expanded status for a review
  const toggleExpandedReview = (reviewId: string) => {
    setExpandedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId) 
        : [...prev, reviewId]
    );
  };

  // In a real implementation, this would filter data based on the search query
  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // Here you would implement the actual search functionality with Supabase
  };

  // Prefetch strain data when user hovers or when the component renders
  const prefetchStrainData = async (strainId: string) => {
    // Skip if already in cache
    if (strainCache.has(strainId)) return;
    
    try {
      // Fetch strain data in background
      const { data: strainData } = await supabase
        .from('strains')
        .select('*')
        .eq('id', strainId)
        .single();
        
      if (strainData) {
        // Store in cache for quick access when navigating
        strainCache.set(strainId, strainData as Strain);
        
        // Also prefetch reviews in background
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('strain_id', strainId);
          
        if (reviewsData && reviewsData.length > 0) {
          reviewCache.set(strainId, reviewsData as Review[]);
        }
      }
    } catch (error) {
      console.log('Error prefetching strain:', error);
      // Silently fail - this is just optimization
    }
  };

  const renderStrainCard = ({ item }: { item: Strain }) => {
    // Prefetch data when rendering the card
    prefetchStrainData(item.id);
    
    // Get the image source for the strain using the synchronous version
    const imageSource = getStrainImageSync(item);
    
    // Format THC and CBD percentages with fallbacks for null/undefined values
    const thcPercentage = item.thc_percentage !== null && item.thc_percentage !== undefined 
      ? `${item.thc_percentage}%` 
      : 'N/A';
    
    const cbdPercentage = item.cbd_percentage !== null && item.cbd_percentage !== undefined 
      ? `${item.cbd_percentage}%` 
      : 'N/A';
    
    // Check if this strain is in the user's favorites
    const isFavorite = favoriteStrains.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.strainCard, { width: cardWidth }]}
        onPress={() => {
          // Log the strain ID for debugging
          console.log(`Navigating to strain with ID: ${item.id}`);
          navigation.navigate('Strain', { strainId: item.id });
        }}
        // Prefetch on long press as well
        onLongPress={() => prefetchStrainData(item.id)}
      >
        <Image 
          source={imageSource}
          style={styles.strainImage} 
          resizeMode="cover"
          // Log errors but don't show them to the user
          onError={(e) => {
            console.log(`Image loading error for strain ${item.id}:`, e.nativeEvent.error);
          }}
        />
        {/* Add a solid background for the overlay */}
        <View style={styles.overlayBackground} />
        <View style={styles.strainOverlay}>
          <Text style={styles.strainName}>{item.name}</Text>
          <View style={styles.strainMeta}>
            <Text style={styles.strainType}>{item.type}</Text>
            <View style={styles.cannabinoidBadges}>
              <View style={styles.thcBadge}>
                <Text style={styles.thcText}>THC: {thcPercentage}</Text>
              </View>
              <View style={styles.cbdBadge}>
                <Text style={styles.cbdText}>CBD: {cbdPercentage}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={[
            styles.favoriteButton,
            isFavorite ? styles.favoriteButtonActive : {}
          ]} 
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFavorite(item.id);
          }}
        >
          <MaterialCommunityIcons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#F87171" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderReviewCard = ({ item }: { item: ExtendedReview }) => {
    // Check if the review is expanded using the expandedReviews state
    const isExpanded = expandedReviews.includes(item.id);
    
    // Check if the review text is long enough to need expansion
    const isLongReview = item.review_text.length > 80;
    
    // Get the user data
    const user = item.user;
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('UserProfile', { userId: item.user_id })}
            style={styles.userContainer}
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.initialsAvatar, { backgroundColor: getRandomColor(item.user_id) }]}>
                <Text style={styles.initialsText}>
                  {user?.username?.substring(0, 2).toUpperCase() || '??'}
                </Text>
              </View>
            )}
            <View style={styles.reviewHeaderText}>
              <Text style={styles.username}>{user?.username || 'Unknown User'}</Text>
              <Text style={styles.strainReviewed}>{item.strains.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.rating}>
            <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Review', { reviewId: item.id })}>
          <Text 
            style={styles.reviewText} 
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.review_text}
          </Text>
          {isLongReview && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                toggleExpandedReview(item.id);
              }} 
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>
                {isExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
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

  // Render loading indicator
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
            colors={['#10B981']}
            tintColor="#10B981"
            progressBackgroundColor="#121212"
          />
        }
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
          />
        </View>
        
        {/* Featured Strains Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Featured Strains</Text>
          {loadingStrains ? (
            renderLoading()
          ) : (
            <View style={styles.strainListContainer}>
              <FlatList
                data={strains}
                renderItem={renderStrainCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.strainList}
                contentContainerStyle={styles.strainListContent}
                snapToInterval={cardWidth + 12} // Snap to each card + margin
                decelerationRate="fast"
                // Show a bit of the next card to indicate scrollability
                contentInset={{ right: 40 }}
                contentOffset={{ x: 0, y: 0 }}
                nestedScrollEnabled={true}
              />
              {/* Add a fade effect on the right edge to indicate more content */}
              <View style={styles.fadeEffect} />
            </View>
          )}
        </View>
        
        {/* Recent Reviews Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {loadingReviews ? (
            renderLoading()
          ) : (
            reviews.map((item) => (
              <React.Fragment key={item.id}>
                {renderReviewCard({ item })}
              </React.Fragment>
            ))
          )}
        </View>
        
        {/* Bottom padding to ensure content doesn't get cut off */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Changed from pure black to a softer dark color
    padding: 16,
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  searchSection: {
    marginTop: 12,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 32,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  strainListContainer: {
    position: 'relative',
  },
  strainList: {
    overflow: 'visible',
  },
  strainListContent: {
    paddingRight: 40, // Add extra padding to show part of the next card
  },
  fadeEffect: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: '100%',
    backgroundColor: 'transparent',
    // Create a gradient effect from transparent to the background color
    shadowColor: '#121212',
    shadowOffset: { width: -20, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  bottomPadding: {
    height: 24,
  },
  strainCard: {
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    height: 240, // Add fixed height to match explore page
    position: 'relative', // Ensure proper positioning context for absolute elements
  },
  strainImage: {
    width: '100%',
    height: '100%', // Make image take full height
  },
  overlayBackground: {
    position: 'absolute',
    bottom: 0,
    left: -5, // Use a larger negative margin
    right: -5, // Use a larger negative margin
    height: 100, // Cover approximately the bottom third of the card
    backgroundColor: 'rgba(0, 26, 18, 0.7)', // More transparent dark green background
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  strainOverlay: {
    position: 'absolute',
    bottom: 0, // Position at bottom
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent', // Make transparent since we have a background now
    zIndex: 2, // Ensure overlay is above the image
  },
  strainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  strainMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strainType: {
    fontSize: 14,
    color: '#D1D5DB', // Lighter color for better contrast against dark background
    fontWeight: '500', // Slightly bolder
  },
  cannabinoidBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Add spacing between badges
    marginTop: 4, // Add a bit more space from the strain type
  },
  thcBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Slightly more opaque
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)', // More visible border
  },
  thcText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  cbdBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)', // Slightly more opaque
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.4)', // More visible border
  },
  cbdText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  reviewList: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewHeaderText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  strainReviewed: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB800',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 