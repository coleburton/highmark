import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SearchBar } from '../components/SearchBar';
import { mockStrains, mockReviews, mockUsers } from '../data/mockData';
import { getStrainImageSync } from '../utils/imageUtils';
import { Strain, Review } from '../types';

// Extended review type to match the actual structure in mockData
interface ExtendedReview extends Review {
  title?: string;
  content?: string;
  likes?: number;
  comments?: Array<any>;
  strains: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
}

type RootStackParamList = {
  Strain: { strainId: string };
  Review: { reviewId: string };
  UserProfile: { userId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ExploreScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'trending' | 'popular' | 'new'>('trending');

  // Get trending strains (for demo, just use first 5 strains)
  const trendingStrains = mockStrains.slice(0, 5);
  
  // Get popular reviews (for demo, just use first 3 reviews)
  const popularReviews = mockReviews.slice(0, 3);
  
  // Get new strains (for demo, use different strains)
  const newStrains = mockStrains.slice(5, 10);

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // In a real app, you would implement search functionality
  };

  const renderStrainCard = ({ item }: { item: Strain }) => (
    <TouchableOpacity 
      style={styles.strainCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image 
        source={getStrainImageSync(item.id)} 
        style={styles.strainImage} 
        resizeMode="cover"
      />
      <View style={styles.strainOverlay}>
        <Text style={styles.strainName}>{item.name}</Text>
        <View style={styles.strainMeta}>
          <Text style={styles.strainType}>{item.type}</Text>
          <View style={styles.thcBadge}>
            <Text style={styles.thcText}>THC: {item.thc_percentage}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReviewCard = ({ item }: { item: ExtendedReview }) => {
    const reviewer = mockUsers.find(user => user.id === item.user_id);
    
    // If reviewer is undefined, return null
    if (!reviewer) return null;
    
    return (
      <TouchableOpacity 
        style={styles.reviewCard}
        onPress={() => navigation.navigate('Review', { reviewId: item.id })}
      >
        <View style={styles.reviewHeader}>
          <TouchableOpacity 
            style={styles.reviewerContainer}
            onPress={() => navigation.navigate('UserProfile', { userId: reviewer.id })}
          >
            <Image 
              source={{ uri: reviewer.avatar_url }} 
              style={styles.reviewerAvatar} 
            />
            <Text style={styles.reviewerName}>{reviewer.username}</Text>
          </TouchableOpacity>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        
        {/* Use review_text as the title if title is not available */}
        <Text style={styles.reviewTitle}>{item.title || item.review_text}</Text>
        <Text style={styles.reviewStrain}>{item.strains.name} • {item.strains.type}</Text>
        
        {/* Use review_text as the content if content is not available */}
        <Text style={styles.reviewContent} numberOfLines={3}>
          {item.content || item.review_text}
        </Text>
        
        <View style={styles.reviewFooter}>
          <View style={styles.reviewStat}>
            <Feather name="thumbs-up" size={14} color="#9CA3AF" />
            <Text style={styles.reviewStatText}>{item.likes || 0}</Text>
          </View>
          <View style={styles.reviewStat}>
            <Feather name="message-square" size={14} color="#9CA3AF" />
            <Text style={styles.reviewStatText}>{item.comments?.length || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>
            Discover new strains and experiences
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            placeholder="Search strains, reviews, users..."
          />
        </View>
        
        {/* Category Tabs */}
        <View style={styles.categoryTabWrapper}>
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                activeCategory === 'trending' && styles.activeCategoryTab
              ]}
              onPress={() => setActiveCategory('trending')}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  activeCategory === 'trending' && styles.activeCategoryText
                ]}
              >
                Trending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                activeCategory === 'popular' && styles.activeCategoryTab
              ]}
              onPress={() => setActiveCategory('popular')}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  activeCategory === 'popular' && styles.activeCategoryText
                ]}
              >
                Popular Reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                activeCategory === 'new' && styles.activeCategoryTab
              ]}
              onPress={() => setActiveCategory('new')}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  activeCategory === 'new' && styles.activeCategoryText
                ]}
              >
                New Arrivals
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content based on active category */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeCategory === 'trending' && (
            <>
              <Text style={styles.sectionTitle}>Trending Strains</Text>
              <FlatList
                data={trendingStrains}
                renderItem={renderStrainCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
              
              <Text style={styles.sectionTitle}>Featured Collections</Text>
              <View style={styles.featuredCollections}>
                <TouchableOpacity style={styles.collectionCard}>
                  <MaterialCommunityIcons name="cannabis" size={24} color="#10B981" />
                  <Text style={styles.collectionTitle}>Top Indica Strains</Text>
                  <Text style={styles.collectionCount}>12 strains</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.collectionCard}>
                  <MaterialCommunityIcons name="cannabis" size={24} color="#3B82F6" />
                  <Text style={styles.collectionTitle}>Best for Sleep</Text>
                  <Text style={styles.collectionCount}>8 strains</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.collectionCard}>
                  <MaterialCommunityIcons name="cannabis" size={24} color="#EC4899" />
                  <Text style={styles.collectionTitle}>Creative Boost</Text>
                  <Text style={styles.collectionCount}>10 strains</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {activeCategory === 'popular' && (
            <>
              <Text style={styles.sectionTitle}>Popular Reviews</Text>
              {popularReviews.map(review => (
                <View key={review.id}>
                  {renderReviewCard({ item: review })}
                </View>
              ))}
            </>
          )}
          
          {activeCategory === 'new' && (
            <>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <FlatList
                data={newStrains}
                renderItem={renderStrainCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
              
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <FlatList
                data={newStrains.slice().reverse()}
                renderItem={renderStrainCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </>
          )}
        </ScrollView>
      </View>
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
    backgroundColor: '#121212',
    padding: 16,
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 20,
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
    marginBottom: 14,
  },
  categoryTabWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeCategoryTab: {
    backgroundColor: '#2D2D2D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 14,
    marginTop: 6,
  },
  horizontalList: {
    paddingBottom: 24,
  },
  strainCard: {
    width: 180,
    height: 240,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  strainImage: {
    width: '100%',
    height: '100%',
  },
  strainOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
    color: '#9CA3AF',
  },
  thcBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  thcText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  featuredCollections: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  collectionCard: {
    width: '31%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  collectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  collectionCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reviewStrain: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  reviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reviewStatText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});

export default ExploreScreen; 