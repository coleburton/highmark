import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { List, Strain } from '../types';
import { getStrainImageSync } from '../utils/imageUtils';
import { useAuth } from '../hooks/useAuth';

type RootStackParamList = {
  ListDetail: { listId: string };
  Strain: { strainId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ListDetail'>;

export const ListDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { listId } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [list, setList] = useState<List | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  
  // Get the current user from auth context
  const { user } = useAuth();
  const authUserId = user?.id;
  
  // Fetch list details
  const fetchListDetails = useCallback(async () => {
    if (!listId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch the list
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*, users:user_id(id, auth_id)')
        .eq('id', listId)
        .single();
      
      if (listError) throw listError;
      
      if (!listData) {
        Alert.alert('Error', 'List not found');
        navigation.goBack();
        return;
      }
      
      // Check if the current user is the owner of the list
      if (authUserId && listData.users && listData.users.auth_id === authUserId) {
        setIsOwner(true);
      } else {
        // If the list is private and the user is not the owner, show an error
        if (!listData.is_public && !isOwner) {
          Alert.alert('Error', 'This list is private');
          navigation.goBack();
          return;
        }
      }
      
      // Set the list data
      setList({
        id: listData.id,
        user_id: listData.user_id,
        title: listData.title,
        description: listData.description,
        is_public: listData.is_public,
        strains: [],
        created_at: listData.created_at,
      });
      
      // Fetch the strains in the list
      const { data: listStrains, error: listStrainsError } = await supabase
        .from('list_strains')
        .select('strain_id')
        .eq('list_id', listId);
      
      if (listStrainsError) throw listStrainsError;
      
      if (!listStrains || listStrains.length === 0) {
        setStrains([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch the strain details
      const strainIds = listStrains.map(item => item.strain_id);
      const { data: strainsData, error: strainsError } = await supabase
        .from('strains')
        .select('*')
        .in('id', strainIds);
      
      if (strainsError) throw strainsError;
      
      setStrains(strainsData || []);
      
      // Update the list with the strain IDs
      setList(prevList => {
        if (!prevList) return null;
        return {
          ...prevList,
          strains: strainIds,
        };
      });
    } catch (error) {
      console.error('Error fetching list details:', error);
      Alert.alert('Error', 'Failed to load list details');
    } finally {
      setIsLoading(false);
    }
  }, [listId, authUserId, navigation]);
  
  // Load data when the component mounts
  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);
  
  // Share the list
  const handleShare = async () => {
    if (!list) return;
    
    try {
      const result = await Share.share({
        title: list.title,
        message: `Check out this cannabis list: ${list.title}\n\n${list.description || ''}`,
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Error sharing list:', error);
      Alert.alert('Error', 'Failed to share list');
    }
  };
  
  // Render a strain item
  const renderStrainItem = ({ item }: { item: Strain }) => (
    <TouchableOpacity 
      style={styles.strainCard}
      onPress={() => navigation.navigate('Strain', { strainId: item.id })}
    >
      <Image 
        source={item.image_url ? { uri: item.image_url } : getStrainImageSync(item)} 
        style={styles.strainImage} 
        resizeMode="cover"
        onError={(e) => console.error('Image loading error in ListDetailScreen:', e.nativeEvent.error)}
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
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cannabis" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Strains in This List</Text>
      <Text style={styles.emptyText}>
        This list doesn't have any strains yet
      </Text>
    </View>
  );
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading list details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!list) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>List Not Found</Text>
          <Text style={styles.errorText}>
            The list you're looking for doesn't exist or has been deleted
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.container}>
        {/* List Header */}
        <View style={styles.listHeader}>
          <View style={styles.listHeaderContent}>
            <Text style={styles.listTitle}>{list.title}</Text>
            {list.description && (
              <Text style={styles.listDescription}>{list.description}</Text>
            )}
            <View style={styles.listMeta}>
              <MaterialCommunityIcons name="cannabis" size={16} color="#10B981" />
              <Text style={styles.listMetaText}>
                {strains.length} {strains.length === 1 ? 'strain' : 'strains'}
              </Text>
              {list.is_public ? (
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
          
          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Feather name="share-2" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Strains List */}
        <Text style={styles.sectionTitle}>Strains in this List</Text>
        <FlatList
          data={strains}
          renderItem={renderStrainItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listHeaderContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  listDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 12,
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
  shareButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
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
}); 