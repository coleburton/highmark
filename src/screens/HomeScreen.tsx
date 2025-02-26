import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mockStrains, mockReviews, mockUsers } from '../data/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Strain, Review } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getStrainImage } from '../utils/imageUtils';
import { SearchBar } from '../components/SearchBar';

type RootStackParamList = {
  Home: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.65; // Make cards take up 65% of screen width
  const [searchQuery, setSearchQuery] = useState('');
  // Add state for favorite strains
  const [favoriteStrains, setFavoriteStrains] = useState<string[]>([]);
  // Add state for expanded reviews
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);

  // Toggle favorite status for a strain
  const toggleFavorite = (strainId: string) => {
    setFavoriteStrains(prev => 
      prev.includes(strainId) 
        ? prev.filter(id => id !== strainId) 
        : [...prev, strainId]
    );
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

  const renderStrainCard = ({ item }: { item: Strain }) => (
    <TouchableOpacity
      style={[styles.strainCard, { width: cardWidth }]}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image 
        source={getStrainImage(item.id)} 
        style={styles.strainImage} 
        resizeMode="cover"
      />
      <View style={styles.strainInfo}>
        <View style={styles.strainNameContainer}>
          <Text style={styles.strainName}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <MaterialCommunityIcons 
              name={favoriteStrains.includes(item.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={favoriteStrains.includes(item.id) ? "#E57CAA" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.strainType}>{item.type}</Text>
        <View style={styles.percentages}>
          <Text style={styles.thc}>THC: {item.THC_percentage}%</Text>
          <Text style={styles.cbd}>CBD: {item.CBD_percentage}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReviewCard = ({ item }: { item: Review & { strains: { name: string; type: string } } } ) => {
    // Check if the review is expanded using the expandedReviews state
    const isExpanded = expandedReviews.includes(item.id);
    
    // Check if the review text is long enough to need expansion
    const isLongReview = item.review_text.length > 80;
    
    // Get the user data
    const user = mockUsers.find(user => user.id === item.user_id);
    
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section - Visually heavy element at the top */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Highmark</Text>
          <Text style={styles.headerSubtitle}>Discover and track your cannabis journey</Text>
        </View>
        
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
          <View style={styles.strainListContainer}>
            <FlatList
              data={mockStrains}
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
        </View>
        
        {/* Recent Reviews Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {mockReviews.map((item) => (
            <React.Fragment key={item.id}>
              {renderReviewCard({ item })}
            </React.Fragment>
          ))}
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
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  searchSection: {
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
  },
  strainImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  strainInfo: {
    padding: 16,
  },
  strainNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  strainType: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  percentages: {
    flexDirection: 'row',
    marginTop: 4,
  },
  thc: {
    fontSize: 14,
    color: '#10B981',
    marginRight: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cbd: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
}); 