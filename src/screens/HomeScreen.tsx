import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
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
              color={favoriteStrains.includes(item.id) ? "#FF4081" : "#FFFFFF"} 
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearch}
      />
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
      
      <Text style={styles.sectionTitle}>Recent Reviews</Text>
      {mockReviews.map((item) => (
        <React.Fragment key={item.id}>
          {renderReviewCard({ item })}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Changed from pure black to a softer dark color
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  strainListContainer: {
    position: 'relative',
    marginBottom: 24,
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
  strainCard: {
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#1E1E1E', // Darker card background to match theme
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Increased shadow offset
    shadowOpacity: 0.5, // Increased shadow opacity
    shadowRadius: 10, // Increased shadow radius
    elevation: 8, // Increased elevation for Android
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', // Slightly more visible border
    height: 280,
    overflow: 'visible', // Ensure shadow is visible
  },
  strainImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Adding a subtle border to make photo boundaries clearer
  },
  strainInfo: {
    padding: 12,
  },
  strainNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  strainName: {
    fontSize: 20, // Increased from 18
    fontWeight: '700', // Increased from 600
    color: '#FFFFFF', // Changed to white for better contrast
    flex: 1,
  },
  strainType: {
    fontSize: 14,
    color: '#A0A0A0', // Lighter gray for secondary text
    marginTop: 4,
  },
  percentages: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  thc: {
    fontSize: 12,
    color: '#10b981', // Matching the tab bar active color
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Semi-transparent background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cbd: {
    fontSize: 12,
    color: '#A78BFA', // Changed from #7C3AED to a lighter purple (#A78BFA)
    backgroundColor: 'rgba(167, 139, 250, 0.15)', // Updated semi-transparent background to match new color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewList: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: '#1E1E1E', // Darker card background to match theme
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', // Light gray border for contrast
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
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
  },
  reviewHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Changed to white for better contrast
  },
  strainReviewed: {
    fontSize: 14,
    color: '#A0A0A0', // Lighter gray for secondary text
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)', // Semi-transparent background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: '#FFB800',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: '#E0E0E0', // Light gray for better readability
    lineHeight: 20,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  readMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  readMoreText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
}); 