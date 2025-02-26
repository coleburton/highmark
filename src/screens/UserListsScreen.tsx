import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mockLists, mockUsers, mockStrains, mockListFollowers } from '../data/mockData';
import { List } from '../types';

type UserListsScreenProps = NativeStackScreenProps<RootStackParamList, 'UserLists'>;
type UserListsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extended list type with strain count
interface ExtendedList {
  id: string;
  title: string;
  description?: string;
  strainCount: number;
  followerCount: number;
}

export default function UserListsScreen({ route }: UserListsScreenProps) {
  const { userId } = route.params;
  const [lists, setLists] = useState<ExtendedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const navigation = useNavigation<UserListsNavigationProp>();

  useEffect(() => {
    fetchUserLists();
    fetchUsername();
  }, [userId]);

  async function fetchUsername() {
    try {
      // Use mock data instead of Supabase
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        setUsername(user.username);
      }
      
      // In a real app with Supabase:
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('username')
      //   .eq('id', userId)
      //   .single();
      //   
      // if (error) throw error;
      // if (data) {
      //   setUsername(data.username);
      // }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  }

  async function fetchUserLists() {
    try {
      setLoading(true);
      
      // Use mock data instead of Supabase
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        setUsername(user.username);
      }
      
      const userLists = mockLists
        .filter(list => list.user_id === userId && list.is_public)
        .map(list => {
          // Count followers for this list
          const followerCount = mockListFollowers.filter(
            follow => follow.list_id === list.id
          ).length;
          
          return {
            id: list.id,
            title: list.title,
            description: list.description,
            strainCount: list.strains.length,
            followerCount: followerCount
          };
        });
      
      setLists(userLists);
      setLoading(false);
      
      // In a real app with Supabase:
      // const { data: userData, error: userError } = await supabase
      //   .from('users')
      //   .select('username')
      //   .eq('id', userId)
      //   .single();
      //
      // if (userError) throw userError;
      // if (userData) {
      //   setUsername(userData.username);
      // }
      //
      // const { data, error } = await supabase
      //   .from('lists')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .eq('is_public', true)
      //   .order('created_at', { ascending: false });
      //
      // if (error) throw error;
      //
      // if (data) {
      //   const listsWithCounts = await Promise.all(data.map(async list => {
      //     // Get follower count
      //     const { count: followerCount } = await supabase
      //       .from('list_followers')
      //       .select('*', { count: 'exact' })
      //       .eq('list_id', list.id);
      //
      //     return {
      //       id: list.id,
      //       title: list.title,
      //       description: list.description,
      //       strainCount: list.strains.length,
      //       followerCount: followerCount || 0
      //     };
      //   }));
      //   setLists(listsWithCounts);
      // }
      //
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching lists:', error);
      setLoading(false);
    }
  }

  const renderListItem = ({ item }: { item: ExtendedList }) => (
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
          <View style={styles.listMetaItem}>
            <MaterialCommunityIcons name="cannabis" size={16} color="#10B981" />
            <Text style={styles.listMetaText}>
              {item.strainCount} {item.strainCount === 1 ? 'strain' : 'strains'}
            </Text>
          </View>
          <View style={styles.listMetaItem}>
            <MaterialCommunityIcons name="account-group" size={16} color="#3B82F6" />
            <Text style={styles.listMetaText}>
              {item.followerCount} {item.followerCount === 1 ? 'follower' : 'followers'}
            </Text>
          </View>
          <View style={styles.publicBadge}>
            <MaterialCommunityIcons name="eye" size={14} color="#FFFFFF" />
            <Text style={styles.publicText}>Public</Text>
          </View>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading lists...</Text>
      </View>
    );
  }

  if (lists.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {username ? `${username}'s Lists` : 'User Lists'}
          </Text>
          <Text style={styles.listCount}>
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </Text>
        </View>
        
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  // Empty state with a more friendly message
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {username ? `${username}'s Lists` : 'User Lists'}
        </Text>
      </View>
      
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="playlist-remove" size={48} color="rgba(255, 255, 255, 0.2)" />
        <Text style={styles.emptyTitle}>No lists to show</Text>
        <Text style={styles.emptyText}>
          {username} hasn't created any public lists yet.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  listCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
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
    flexWrap: 'wrap',
  },
  listMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  listMetaText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 