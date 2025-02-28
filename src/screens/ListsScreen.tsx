import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { mockLists, mockStrains, mockUsers } from '../data/mockData';
import { List, Strain } from '../types';
import { SearchBar } from '../components/SearchBar';
import { getStrainImage, getStrainImageSync } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';

type RootStackParamList = {
  Lists: undefined;
  ListDetail: { listId: string };
  Strain: { strainId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ListsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'lists' | 'try' | 'favorites'>('lists');
  const [searchQuery, setSearchQuery] = useState('');
  
  // In a real app, you would get the current user ID from authentication
  const currentUserId = 'user-1';
  
  // Get user's lists
  const userLists = useMemo(() => {
    return mockLists.filter(list => list.user_id === currentUserId);
  }, [currentUserId]);
  
  // Get strains marked as "try later"
  // In a real app, you would have a separate table or field for this
  // For now, we'll just use the first few strains as an example
  const tryLaterStrains = useMemo(() => {
    return mockStrains.slice(0, 3);
  }, []);
  
  // Get favorite strains
  // For this example, we'll use a different set of strains
  const favoriteStrains = useMemo(() => {
    return mockStrains.slice(3, 7);
  }, []);
  
  // Filter lists based on search query
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return userLists;
    
    const query = searchQuery.toLowerCase().trim();
    return userLists.filter(list => 
      list.title.toLowerCase().includes(query) || 
      (list.description && list.description.toLowerCase().includes(query))
    );
  }, [userLists, searchQuery]);
  
  // Filter try later strains based on search query
  const filteredTryLaterStrains = useMemo(() => {
    if (!searchQuery.trim()) return tryLaterStrains;
    
    const query = searchQuery.toLowerCase().trim();
    return tryLaterStrains.filter(strain => 
      strain.name.toLowerCase().includes(query) || 
      strain.type.toLowerCase().includes(query)
    );
  }, [tryLaterStrains, searchQuery]);
  
  // Filter favorites based on search query
  const filteredFavoriteStrains = useMemo(() => {
    if (!searchQuery.trim()) return favoriteStrains;
    
    const query = searchQuery.toLowerCase().trim();
    return favoriteStrains.filter(strain => 
      strain.name.toLowerCase().includes(query) || 
      strain.type.toLowerCase().includes(query)
    );
  }, [favoriteStrains, searchQuery]);
  
  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // In a real app, you might want to do something else here
  };
  
  const renderListItem = ({ item }: { item: List }) => {
    // Get the number of strains in the list
    const strainCount = item.strains.length;
    
    return (
      <TouchableOpacity 
        style={styles.listCard}
        onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
      >
        <View style={styles.listCardContent}>
          <Text style={styles.listTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.listMeta}>
            <MaterialCommunityIcons name="cannabis" size={16} color="#10B981" />
            <Text style={styles.listMetaText}>
              {strainCount} {strainCount === 1 ? 'strain' : 'strains'}
            </Text>
            {item.is_public ? (
              <View style={styles.publicBadge}>
                <MaterialCommunityIcons name="eye" size={14} color="#FFFFFF" />
                <Text style={styles.publicText}>Public</Text>
              </View>
            ) : (
              <View style={styles.privateBadge}>
                <MaterialCommunityIcons name="eye-off" size={14} color="#FFFFFF" />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color="#9CA3AF" 
          style={styles.listCardArrow}
        />
      </TouchableOpacity>
    );
  };
  
  const renderStrainItem = ({ item }: { item: Strain }) => (
    <TouchableOpacity 
      style={styles.strainCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image 
        source={getStrainImageSync(item)} 
        style={styles.strainImage} 
        resizeMode="cover"
        onError={(e) => console.error('Image loading error in ListsScreen:', e.nativeEvent.error)}
      />
      <View style={styles.strainInfo}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainType}>{item.type}</Text>
        <View style={styles.percentages}>
          <Text style={styles.thc}>THC: {item.THC_percentage}%</Text>
          <Text style={styles.cbd}>CBD: {item.CBD_percentage}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderEmptyLists = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="playlist-plus" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Lists Yet</Text>
      <Text style={styles.emptyText}>
        Create your first list to organize your favorite strains
      </Text>
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create New List</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderEmptyTryLater = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cannabis" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Strains to Try</Text>
      <Text style={styles.emptyText}>
        Mark strains as "Try Later" to save them for future reference
      </Text>
    </View>
  );
  
  const renderEmptyFavorites = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="heart" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Favorite Strains</Text>
      <Text style={styles.emptyText}>
        Mark strains as favorites to quickly access them here
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Lists</Text>
          <Text style={styles.headerSubtitle}>
            Organize your cannabis journey
          </Text>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'lists' && styles.activeTab
            ]}
            onPress={() => setActiveTab('lists')}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'lists' && styles.activeTabText
              ]}
            >
              My Lists
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'favorites' && styles.activeTab
            ]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'favorites' && styles.activeTabText
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'try' && styles.activeTab
            ]}
            onPress={() => setActiveTab('try')}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'try' && styles.activeTabText
              ]}
            >
              Try Later
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            placeholder={
              activeTab === 'lists' 
                ? "Search your lists..." 
                : activeTab === 'favorites'
                  ? "Search your favorites..."
                  : "Search strains to try..."
            }
          />
        </View>
        
        {/* Content */}
        {activeTab === 'lists' ? (
          <>
            {/* Lists Tab Content */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listCount}>
                {filteredLists.length} {filteredLists.length === 1 ? 'List' : 'Lists'}
              </Text>
              <TouchableOpacity style={styles.newListButton}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.newListText}>New List</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredLists}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyLists}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : activeTab === 'favorites' ? (
          <>
            {/* Favorites Tab Content */}
            <Text style={styles.listCount}>
              {filteredFavoriteStrains.length} {filteredFavoriteStrains.length === 1 ? 'Favorite' : 'Favorites'}
            </Text>
            
            <FlatList
              data={filteredFavoriteStrains}
              renderItem={renderStrainItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyFavorites}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <>
            {/* Try Later Tab Content */}
            <Text style={styles.listCount}>
              {filteredTryLaterStrains.length} {filteredTryLaterStrains.length === 1 ? 'Strain' : 'Strains'} to Try
            </Text>
            
            <FlatList
              data={filteredTryLaterStrains}
              renderItem={renderStrainItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyTryLater}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2D2D2D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchSection: {
    marginBottom: 20,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  newListText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  listCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listCardContent: {
    flex: 1,
  },
  listCardArrow: {
    marginLeft: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  listDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listMetaText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
    marginRight: 12,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  publicText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '600',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  privateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '600',
  },
  strainCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  strainImage: {
    width: 120,
    height: '100%',
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  strainInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  strainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 