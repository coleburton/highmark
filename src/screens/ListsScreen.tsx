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
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { List, Strain } from '../types';
import { SearchBar } from '../components/SearchBar';
import { getStrainImage, getStrainImageSync } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type RootStackParamList = {
  Lists: undefined;
  ListDetail: { listId: string };
  Strain: { strainId: string };
  CreateList: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ListsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'lists' | 'try' | 'favorites'>('lists');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userLists, setUserLists] = useState<List[]>([]);
  const [favoriteStrains, setFavoriteStrains] = useState<Strain[]>([]);
  const [tryLaterStrains, setTryLaterStrains] = useState<Strain[]>([]);
  const [databaseUserId, setDatabaseUserId] = useState<string | null>(null);
  
  // Get the current user from auth context
  const { user } = useAuth();
  const authUserId = user?.id;
  
  // Get the database user ID that corresponds to the auth user ID
  const fetchDatabaseUserId = useCallback(async () => {
    if (!authUserId) return null;
    
    try {
      console.log('Fetching database user ID for auth ID:', authUserId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUserId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.warn('No user record found for auth ID:', authUserId);
          return null;
        }
        throw error;
      }
      
      if (!data) {
        console.warn('No user record found for auth ID:', authUserId);
        return null;
      }
      
      console.log('Found database user ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error fetching database user ID:', error);
      return null;
    }
  }, [authUserId]);
  
  // Fetch user's lists
  const fetchUserLists = useCallback(async () => {
    if (!databaseUserId) return;
    
    try {
      console.log('Fetching lists for user ID:', databaseUserId);
      
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', databaseUserId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setUserLists([]);
        return;
      }
      
      // For each list, fetch the strains
      const listsWithStrains = await Promise.all(
        data.map(async (list) => {
          try {
            const { data: listStrains, error: listStrainsError } = await supabase
              .from('list_strains')
              .select('strain_id')
              .eq('list_id', list.id);
            
            if (listStrainsError) {
              console.error('Error fetching strains for list:', list.id, listStrainsError);
              return {
                ...list,
                strains: []
              };
            }
            
            return {
              ...list,
              strains: (listStrains || []).map(item => item.strain_id)
            };
          } catch (err) {
            console.error('Error processing list:', list.id, err);
            return {
              ...list,
              strains: []
            };
          }
        })
      );
      
      setUserLists(listsWithStrains);
    } catch (error) {
      console.error('Error fetching user lists:', error);
      // Don't show alert for this error as it's not critical
      setUserLists([]);
    }
  }, [databaseUserId]);
  
  // Fetch user's favorite strains
  const fetchFavoriteStrains = useCallback(async () => {
    if (!databaseUserId) return;
    
    try {
      console.log('Fetching favorites for user ID:', databaseUserId);
      
      // First get the favorite strain IDs
      // Try to use is_favorite column if it exists
      let query = supabase
        .from('favorites')
        .select('strain_id')
        .eq('user_id', databaseUserId);
      
      // Try to add is_favorite filter if the column exists
      try {
        query = query.eq('is_favorite', true);
      } catch (e) {
        // If the column doesn't exist, just continue without the filter
        console.log('is_favorite column might not exist, continuing without filter');
      }
      
      const { data: favoriteIds, error: favoritesError } = await query;
      
      if (favoritesError) {
        // Check if the error is because the column doesn't exist
        if (favoritesError.message && favoritesError.message.includes('column "is_favorite" does not exist')) {
          console.log('The is_favorite column does not exist in the favorites table');
          // Just get all favorites without filtering
          const { data: allFavorites, error: allFavoritesError } = await supabase
            .from('favorites')
            .select('strain_id')
            .eq('user_id', databaseUserId);
          
          if (allFavoritesError) throw allFavoritesError;
          
          if (!allFavorites || allFavorites.length === 0) {
            setFavoriteStrains([]);
            return;
          }
          
          // Use these favorites
          const strainIds = allFavorites.map(fav => fav.strain_id);
          const { data: strains, error: strainsError } = await supabase
            .from('strains')
            .select('*')
            .in('id', strainIds);
          
          if (strainsError) throw strainsError;
          
          setFavoriteStrains(strains || []);
          return;
        }
        throw favoritesError;
      }
      
      if (!favoriteIds || favoriteIds.length === 0) {
        setFavoriteStrains([]);
        return;
      }
      
      // Then fetch the strain details
      const strainIds = favoriteIds.map(fav => fav.strain_id);
      const { data: strains, error: strainsError } = await supabase
        .from('strains')
        .select('*')
        .in('id', strainIds);
      
      if (strainsError) throw strainsError;
      
      setFavoriteStrains(strains || []);
    } catch (error) {
      console.error('Error fetching favorite strains:', error);
      // Don't show alert for this error as it's not critical
      setFavoriteStrains([]);
    }
  }, [databaseUserId]);
  
  // For "Try Later" functionality, we'll use the favorites table with a special flag
  // This is a workaround since there's no dedicated "try later" table and we're having RLS issues with lists
  const fetchTryLaterStrains = useCallback(async () => {
    if (!databaseUserId) return;
    
    try {
      console.log('Fetching try later strains for user ID:', databaseUserId);
      
      // We'll use the favorites table with a special flag for "try later"
      // First get the try later strain IDs
      const { data: tryLaterIds, error: tryLaterError } = await supabase
        .from('favorites')
        .select('strain_id')
        .eq('user_id', databaseUserId)
        .eq('is_try_later', true);
      
      if (tryLaterError) {
        // Check if the error is because the column doesn't exist
        if (tryLaterError.message && tryLaterError.message.includes('column "is_try_later" does not exist')) {
          console.log('The is_try_later column does not exist in the favorites table');
          // Fall back to an empty array
          setTryLaterStrains([]);
          
          // Show a message to the user
          Alert.alert(
            'Feature Not Available',
            'The "Try Later" feature is currently under development. Please check back later.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw tryLaterError;
      }
      
      if (!tryLaterIds || tryLaterIds.length === 0) {
        setTryLaterStrains([]);
        return;
      }
      
      // Then fetch the strain details
      const strainIds = tryLaterIds.map(item => item.strain_id);
      const { data: strains, error: strainsError } = await supabase
        .from('strains')
        .select('*')
        .in('id', strainIds);
      
      if (strainsError) throw strainsError;
      
      setTryLaterStrains(strains || []);
    } catch (error) {
      console.error('Error fetching try later strains:', error);
      // Don't show alert for this error as it's not critical
      setTryLaterStrains([]);
    }
  }, [databaseUserId]);
  
  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // First, get the database user ID
        if (authUserId) {
          const userId = await fetchDatabaseUserId();
          setDatabaseUserId(userId);
          
          // If we have a database user ID, fetch the data
          if (userId) {
            await Promise.all([
              fetchUserLists(),
              fetchFavoriteStrains(),
              fetchTryLaterStrains()
            ]);
          } else {
            // If no database user ID, reset all data
            setUserLists([]);
            setFavoriteStrains([]);
            setTryLaterStrains([]);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Errors are already handled in individual fetch functions
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [authUserId, fetchDatabaseUserId]);
  
  // Reload data when database user ID changes
  useEffect(() => {
    if (databaseUserId) {
      const loadDataForUser = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            fetchUserLists(),
            fetchFavoriteStrains(),
            fetchTryLaterStrains()
          ]);
        } catch (error) {
          console.error('Error loading data for user:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadDataForUser();
    }
  }, [databaseUserId, fetchUserLists, fetchFavoriteStrains, fetchTryLaterStrains]);
  
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
  
  const handleCreateList = () => {
    // Navigate to the CreateList screen
    navigation.navigate('CreateList');
  };
  
  const renderListItem = ({ item }: { item: List }) => {
    // Get the number of strains in the list
    const strainCount = item.strains ? item.strains.length : 0;
    
    // Skip the "Try Later" list in the lists tab
    if (item.title === 'Try Later') return null;
    
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
        source={item.image_url ? { uri: item.image_url } : getStrainImageSync(item)} 
        style={styles.strainImage} 
        resizeMode="cover"
        onError={(e) => console.error('Image loading error in ListsScreen:', e.nativeEvent.error)}
      />
      <View style={styles.strainInfo}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainType}>{item.type}</Text>
        <View style={styles.percentages}>
          <Text style={styles.thc}>THC: {item.thc_percentage || 0}%</Text>
          <Text style={styles.cbd}>CBD: {item.cbd_percentage || 0}%</Text>
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
      <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
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
  
  // Add a strain to the "Try Later" list
  const addToTryLater = async (strainId: string) => {
    if (!databaseUserId) {
      Alert.alert('Error', 'You must be logged in to add strains to your Try Later list');
      return;
    }
    
    try {
      // Check if the strain is already in favorites
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', databaseUserId)
        .eq('strain_id', strainId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }
      
      if (existingFavorite) {
        // Update the existing favorite to mark it as try later
        const { error: updateError } = await supabase
          .from('favorites')
          .update({ is_try_later: true })
          .eq('id', existingFavorite.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert a new favorite with try later flag
        const { error: insertError } = await supabase
          .from('favorites')
          .insert({
            user_id: databaseUserId,
            strain_id: strainId,
            is_try_later: true
          });
        
        if (insertError) {
          if (insertError.code === '42501') { // RLS policy violation
            Alert.alert('Permission Issue', 'You do not have permission to add strains to your Try Later list');
            return;
          }
          throw insertError;
        }
      }
      
      // Refresh the try later strains
      fetchTryLaterStrains();
      
      Alert.alert('Success', 'Strain added to your Try Later list');
    } catch (error) {
      console.error('Error adding strain to Try Later:', error);
      Alert.alert('Error', 'Failed to add strain to your Try Later list');
    }
  };
  
  // Remove a strain from the "Try Later" list
  const removeFromTryLater = async (strainId: string) => {
    if (!databaseUserId) return;
    
    try {
      // Find the favorite entry
      const { data: favorite, error: findError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', databaseUserId)
        .eq('strain_id', strainId)
        .eq('is_try_later', true)
        .single();
      
      if (findError) {
        if (findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw findError;
        }
        return; // Nothing to remove
      }
      
      if (!favorite) return; // Nothing to remove
      
      // Check if is_favorite exists and is true
      const isFavorite = favorite.is_favorite !== undefined && favorite.is_favorite === true;
      
      // If the entry is also a favorite, just update the is_try_later flag
      if (isFavorite) {
        const { error: updateError } = await supabase
          .from('favorites')
          .update({ is_try_later: false })
          .eq('id', favorite.id);
        
        if (updateError) throw updateError;
      } else {
        // If it's not a favorite, delete the entry
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favorite.id);
        
        if (deleteError) throw deleteError;
      }
      
      // Refresh the try later strains
      fetchTryLaterStrains();
    } catch (error) {
      console.error('Error removing strain from Try Later:', error);
      Alert.alert('Error', 'Failed to remove strain from your Try Later list');
    }
  };
  
  if (!authUserId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-alert" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Not Logged In</Text>
            <Text style={styles.emptyText}>
              Please log in to view and manage your lists
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show a message if the user is logged in but doesn't have a database record
  if (authUserId && !databaseUserId && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-alert" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Account Setup Incomplete</Text>
            <Text style={styles.emptyText}>
              Your account is not fully set up. Please complete the onboarding process or contact support.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
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
        
        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        ) : activeTab === 'lists' ? (
          <>
            {/* Lists Tab Content */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listCount}>
                {filteredLists.filter(list => list.title !== 'Try Later').length} {filteredLists.filter(list => list.title !== 'Try Later').length === 1 ? 'List' : 'Lists'}
              </Text>
              <TouchableOpacity style={styles.newListButton} onPress={handleCreateList}>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
}); 