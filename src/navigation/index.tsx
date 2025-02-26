import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { StrainScreen } from '../screens/StrainScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { AddReviewScreen } from '../screens/AddReviewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import UserReviewsScreen from '../screens/UserReviewsScreen';
import UserFavoritesScreen from '../screens/UserFavoritesScreen';
import { ListsScreen } from '../screens/ListsScreen';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Define the type for the root stack navigator
export type RootStackParamList = {
  MainTabs: undefined;
  Strain: { strainId: string };
  Review: { reviewId: string };
  AddReview: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  UserReviews: { userId: string };
  UserFavorites: { userId: string };
  ListDetail: { listId: string };
};

// Define the type for the bottom tab navigator
export type TabStackParamList = {
  Home: undefined;
  Diary: undefined;
  Add: undefined;
  Lists: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabStackParamList>();

// Placeholder screen for Lists
// const ListsScreen = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
//     <Text style={{ color: '#fff', fontSize: 18 }}>Lists Coming Soon</Text>
//   </View>
// );

// Placeholder screen for Diary
const DiaryScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: '#fff', fontSize: 18 }}>Diary Coming Soon</Text>
  </View>
);

// Placeholder screen for ListDetail
const ListDetailScreen = ({ route }: { route: RouteProp<RootStackParamList, 'ListDetail'> }) => {
  const { listId } = route.params;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>List Details Coming Soon</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>List ID: {listId}</Text>
    </View>
  );
};

const MainTabs = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#10b981', // emerald-500 equivalent
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={DiaryScreen} // Placeholder component, will be overridden by the button
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#10b981',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5,
              }}
              onPress={() => navigation.navigate('AddReview')}
            >
              <Feather name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#121212',
          },
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Strain"
          component={StrainScreen}
          options={{
            title: '',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{
            title: 'Review Details',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{
            title: 'User Profile',
          }}
        />
        <Stack.Screen
          name="UserReviews"
          component={UserReviewsScreen}
          options={{
            title: 'User Reviews',
          }}
        />
        <Stack.Screen
          name="UserFavorites"
          component={UserFavoritesScreen}
          options={{
            title: 'User Favorites',
          }}
        />
        <Stack.Screen
          name="AddReview"
          component={AddReviewScreen}
          options={{
            title: 'Add Review',
          }}
        />
        <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 