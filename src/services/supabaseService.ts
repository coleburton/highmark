import { supabase } from '../lib/supabase';
import { Strain, Review, User } from '../types';

// Type for the extended review with strain info
export interface ExtendedReview extends Review {
  strains: {
    id: string;
    name: string;
    type: string;
    image_url?: string;
  };
  profiles?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

/**
 * Fetch featured strains for the homepage
 * @param limit Number of strains to fetch
 * @returns Promise with array of strains
 */
export const getFeaturedStrains = async (limit = 8): Promise<Strain[]> => {
  try {
    // First try to get featured strains (strains with is_featured flag set to true)
    const { data, error } = await supabase
      .from('strains')
      .select('*')
      .eq('is_featured', true)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured strains:', error);
      return []; // Return empty array instead of mock data
    }

    // Log the strain IDs for debugging
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} featured strains from Supabase`);
      console.log(`First strain ID: ${data[0].id}`);
      return data;
    } else {
      console.log('No featured strains found in Supabase, trying to get recently approved strains');
      
      // If no featured strains, try to get recently approved strains
      const { data: recentData, error: recentError } = await supabase
        .from('strains')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (recentError) {
        console.error('Error fetching recent strains:', recentError);
        return []; // Return empty array instead of mock data
      }
      
      console.log(`Fetched ${recentData?.length || 0} recent strains from Supabase`);
      return recentData || [];
    }
  } catch (error) {
    console.error('Error in getFeaturedStrains:', error);
    return []; // Return empty array instead of mock data
  }
};

/**
 * Fetch recent reviews for the homepage
 * @param limit Number of reviews to fetch
 * @returns Promise with array of extended reviews
 */
export const getRecentReviews = async (limit = 5): Promise<ExtendedReview[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        strains (
          id,
          name,
          type,
          image_url
        ),
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent reviews:', error);
      return []; // Return empty array instead of mock data
    }

    // Transform the data to match the expected format
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} reviews from Supabase`);
      const transformedData = data.map(item => ({
        ...item,
        profiles: item.profiles,
      }));
      return transformedData as unknown as ExtendedReview[];
    } else {
      console.log('No reviews fetched from Supabase');
      return []; // Return empty array instead of mock data
    }
  } catch (error) {
    console.error('Error in getRecentReviews:', error);
    return []; // Return empty array instead of mock data
  }
};

/**
 * Check if a strain is favorited by the current user
 * @param strainId The strain ID to check
 * @returns Promise with boolean indicating if strain is favorited
 */
export const isStrainFavorited = async (strainId: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return false;

    const userId = session.session.user.id;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('strain_id', strainId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking if strain is favorited:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isStrainFavorited:', error);
    return false;
  }
};

/**
 * Toggle favorite status for a strain
 * @param strainId The strain ID to toggle favorite status for
 * @returns Promise with boolean indicating success
 */
export const toggleFavoriteStrain = async (strainId: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return false;

    const userId = session.session.user.id;

    // Check if the strain is already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('strain_id', strainId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing favorite:', checkError);
      return false;
    }

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return false;
      }
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, strain_id: strainId }]);

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in toggleFavoriteStrain:', error);
    return false;
  }
};

/**
 * Get user's favorite strains
 * @returns Promise with array of strain IDs
 */
export const getUserFavoriteStrains = async (): Promise<string[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return [];

    const userId = session.session.user.id;

    const { data, error } = await supabase
      .from('favorites')
      .select('strain_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user favorite strains:', error);
      return [];
    }

    return data?.map(item => item.strain_id) || [];
  } catch (error) {
    console.error('Error in getUserFavoriteStrains:', error);
    return [];
  }
};

/**
 * Get a single review by ID
 * @param reviewId The ID of the review to fetch
 * @returns Promise with the review data or null if not found
 */
export const getReviewById = async (reviewId: string): Promise<ExtendedReview | null> => {
  try {
    // Check if reviewId is a mock ID (like "review-1")
    const isMockId = reviewId.startsWith('review-');
    
    if (isMockId) {
      console.log('Using mock data for review with ID:', reviewId);
      // Find the review in mock data
      const mockReview = mockReviews.find(r => r.id === reviewId);
      if (mockReview) {
        const strain = mockStrains.find(s => s.id === mockReview.strain_id);
        const user = mockUsers.find(u => u.id === mockReview.user_id);
        return {
          ...mockReview,
          strains: strain ? {
            id: strain.id,
            name: strain.name,
            type: strain.type,
            image_url: strain.image_url
          } : undefined,
          profiles: user ? {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url
          } : null
        } as unknown as ExtendedReview;
      } else {
        console.log(`No mock review found with ID: ${reviewId}`);
        return null;
      }
    }
    
    // If it's a real UUID, use Supabase
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        strains (
          id,
          name,
          type,
          image_url
        ),
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('id', reviewId)
      .single();

    if (error) {
      console.error('Error fetching review by ID:', error);
      return null;
    }

    if (!data) {
      console.log(`No review found with ID: ${reviewId}`);
      return null;
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      profiles: data.profiles,
    };

    return transformedData as unknown as ExtendedReview;
  } catch (error) {
    console.error('Error in getReviewById:', error);
    return null;
  }
};

/**
 * Get user profile by ID
 * @param userId The ID of the user to fetch
 * @returns Promise with the user data or null if not found
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    // Check if userId is a mock ID (like "user-1")
    const isMockId = userId.startsWith('user-');
    
    if (isMockId) {
      console.log('Using mock data for user with ID:', userId);
      // Find the user in mock data
      const mockUser = mockUsers.find(u => u.id === userId);
      if (mockUser) {
        return mockUser;
      } else {
        console.log(`No mock user found with ID: ${userId}`);
        return null;
      }
    }
    
    // If it's a real UUID, use Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }

    if (!data) {
      console.log(`No user found with ID: ${userId}`);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

/**
 * Get user reviews by user ID
 * @param userId The ID of the user to fetch reviews for
 * @param limit Number of reviews to fetch
 * @returns Promise with array of extended reviews
 */
export const getUserReviews = async (userId: string, limit = 10): Promise<ExtendedReview[]> => {
  try {
    // Check if userId is a UUID (Supabase format) or a mock ID (like "user-1")
    const isMockId = userId.startsWith('user-');
    
    if (isMockId) {
      console.log('Using mock data for user reviews with ID:', userId);
      
      // Filter mock reviews for this user
      const userReviews = mockReviews
        .filter(review => review.user_id === userId)
        .map(review => {
          const strain = mockStrains.find(s => s.id === review.strain_id);
          return {
            ...review,
            strains: strain ? {
              id: strain.id,
              name: strain.name,
              type: strain.type,
              image_url: strain.image_url
            } : undefined,
            profiles: mockUsers.find(u => u.id === review.user_id)
          } as unknown as ExtendedReview;
        })
        .slice(0, limit);
      
      return userReviews;
    }
    
    // If it's a real UUID, use Supabase
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        strains (
          id,
          name,
          type,
          image_url
        ),
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }

    // Transform the data to match the expected format
    const transformedData = data?.map(item => ({
      ...item,
      profiles: item.profiles,
    })) || [];

    return transformedData as unknown as ExtendedReview[];
  } catch (error) {
    console.error('Error in getUserReviews:', error);
    return [];
  }
}; 