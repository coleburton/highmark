import { User, Strain, Review, List } from '../types';
import { getStrainImage } from '../utils/imageUtils';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'JaneGreen',
    email: 'jane@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Jane+Green&background=10B981&color=fff',
    bio: 'Cannabis enthusiast and reviewer. Love exploring new strains! 🌿',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'MikeBlaze',
    email: 'mike@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Blaze&background=7C3AED&color=fff',
    bio: 'Medicinal cannabis advocate. Sharing honest reviews.',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'user-3',
    username: 'CannabisQueen',
    email: 'sarah@example.com',
    avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
    bio: 'Cannabis educator and advocate. I believe in the healing power of this amazing plant.',
    created_at: '2023-03-10T00:00:00.000Z'
  },
  {
    id: 'user-4',
    username: 'HerbExplorer',
    email: 'alex@example.com',
    avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
    bio: 'Recreational user with a passion for discovering unique terpene profiles.',
    created_at: '2023-04-05T00:00:00.000Z'
  },
  {
    id: 'user-5',
    username: 'GreenThumb',
    email: 'taylor@example.com',
    avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg',
    bio: 'Home grower and cannabis connoisseur. Ask me about my latest harvest!',
    created_at: '2023-05-12T00:00:00.000Z'
  }
];

export const mockStrains: Strain[] = [
  {
    id: 'strain-1',
    name: 'Blue Dream',
    type: 'Hybrid',
    THC_percentage: 18,
    CBD_percentage: 0.5,
    effects: ['Relaxed', 'Happy', 'Euphoric', 'Creative'],
    flavors: ['Berry', 'Sweet', 'Earthy'],
    images: ['assets/images/strains/s1/blue_dream_1.jpg'],
    image_url: 'assets/images/strains/s1/blue_dream_1.jpg',
    description: 'A legendary hybrid strain known for its balanced effects. Blue Dream delivers a gentle cerebral invigoration alongside full-body relaxation, making it perfect for daytime use.',
    created_at: '2024-01-01T00:00:00Z',
    submitted_by: 'user-1',
    approved: true,
    is_featured: true,
  },
  {
    id: 'strain-2',
    name: 'OG Kush',
    type: 'Indica',
    THC_percentage: 23,
    CBD_percentage: 0.3,
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Pine', 'Woody', 'Earthy'],
    images: ['assets/images/strains/s2/og_kush_1.jpg'],
    image_url: 'assets/images/strains/s2/og_kush_1.jpg',
    description: 'A classic indica strain with powerful effects. OG Kush is known for its strong pine and woody aroma, delivering deep relaxation and stress relief.',
    created_at: '2024-01-02T00:00:00Z',
    submitted_by: 'user-2',
    approved: true,
    is_featured: true,
  },
  {
    id: 'strain-3',
    name: 'Sour Diesel',
    type: 'Sativa',
    THC_percentage: 20,
    CBD_percentage: 0.2,
    effects: ['Energetic', 'Focused', 'Creative'],
    flavors: ['Diesel', 'Citrus', 'Earthy'],
    images: ['assets/images/strains/s3/sour_diesel_1.jpg'],
    image_url: 'assets/images/strains/s3/sour_diesel_1.jpg',
    description: 'A fast-acting sativa with energizing effects. Sour Diesel features a pungent fuel-like aroma and provides a dreamy cerebral effect perfect for creative pursuits.',
    created_at: '2024-01-03T00:00:00Z',
    submitted_by: 'user-1',
    approved: true,
    is_featured: true,
  },
  {
    id: 'strain-4',
    name: 'Northern Lights',
    type: 'Indica',
    THC_percentage: 21,
    CBD_percentage: 0.4,
    effects: ['Relaxed', 'Sleepy', 'Happy', 'Pain Relief'],
    flavors: ['Sweet', 'Spicy', 'Earthy'],
    images: [],
    image_url: 'assets/images/strains/s4/northern_lights_1.png',
    description: 'A pure indica strain beloved for its resinous buds and resilience. Northern Lights delivers a deeply relaxing experience with dreamy euphoria that melts away stress and pain.',
    created_at: '2024-01-04T00:00:00Z',
    submitted_by: 'user-2',
    approved: true,
    is_featured: true,
  },
  {
    id: 'strain-5',
    name: 'Jack Herer',
    type: 'Sativa',
    THC_percentage: 19,
    CBD_percentage: 0.1,
    effects: ['Energetic', 'Creative', 'Focused', 'Uplifted'],
    flavors: ['Pine', 'Woody', 'Citrus'],
    images: [],
    image_url: 'assets/images/strains/s5/jack_herer_1.png',
    description: 'A sativa-dominant strain named after the cannabis activist. Jack Herer offers a clear-headed, creative experience with a spicy pine scent.',
    created_at: '2024-01-05T00:00:00Z',
    submitted_by: 'user-4',
    approved: true,
  },
  {
    id: 'strain-6',
    name: 'Pineapple Express',
    type: 'Hybrid',
    THC_percentage: 17,
    CBD_percentage: 0.3,
    effects: ['Happy', 'Uplifted', 'Creative', 'Energetic'],
    flavors: ['Pineapple', 'Tropical', 'Sweet'],
    images: [],
    image_url: 'assets/images/strains/s6/pineapple_express_1.png',
    description: 'A tropical-flavored hybrid with a balanced high. Pineapple Express delivers a long-lasting energetic buzz perfect for productive afternoons.',
    created_at: '2024-01-06T00:00:00Z',
    submitted_by: 'user-5',
    approved: true,
  },
  {
    id: 'strain-7',
    name: 'Girl Scout Cookies',
    type: 'Hybrid',
    THC_percentage: 25,
    CBD_percentage: 0.2,
    effects: ['Relaxed', 'Euphoric', 'Happy', 'Creative'],
    flavors: ['Sweet', 'Earthy', 'Dessert'],
    images: [],
    image_url: 'assets/images/strains/s7/gsc_1.png',
    description: 'A popular hybrid strain known for its sweet and earthy aroma. Girl Scout Cookies provides a powerful euphoric high combined with full-body relaxation.',
    created_at: '2024-01-07T00:00:00Z',
    submitted_by: 'user-3',
    approved: true,
  },
  {
    id: 'strain-8',
    name: 'Granddaddy Purple',
    type: 'Indica',
    THC_percentage: 17,
    CBD_percentage: 0.1,
    effects: ['Relaxed', 'Sleepy', 'Happy', 'Hungry'],
    flavors: ['Grape', 'Berry', 'Sweet'],
    images: [],
    image_url: 'assets/images/strains/s8/gdp_1.png',
    description: 'A famous indica strain with deep purple buds. Granddaddy Purple delivers a powerful blend of cerebral euphoria and physical relaxation.',
    created_at: '2024-01-08T00:00:00Z',
    submitted_by: 'user-2',
    approved: true,
  }
];

// Define a type for the extended review with strain info
interface StrainInfo {
  id: string;
  name: string;
  type: string;
  image_url?: string;
}

type ExtendedReview = Review & { 
  strains: StrainInfo;
};

export const mockReviews: ExtendedReview[] = [
  {
    id: 'review-1',
    user_id: 'user-1',
    strain_id: 'strain-1',
    rating: 4.5,
    review_text: 'Perfect balance of relaxation and creativity. Great for afternoon use!',
    effects: ['Relaxed', 'Creative', 'Happy'],
    flavors: ['Berry', 'Sweet'],
    created_at: '2024-01-10T00:00:00Z',
    strains: {
      id: 'strain-1',
      name: 'Blue Dream',
      type: 'Hybrid',
      image_url: 'assets/images/strains/s1/blue_dream_1.jpg'
    }
  },
  {
    id: 'review-2',
    user_id: 'user-2',
    strain_id: 'strain-2',
    rating: 5,
    review_text: 'Classic OG Kush. Amazing for stress relief and sleep.',
    effects: ['Relaxed', 'Sleepy'],
    flavors: ['Pine', 'Woody'],
    created_at: '2024-01-11T00:00:00Z',
    strains: {
      id: 'strain-2',
      name: 'OG Kush',
      type: 'Indica',
      image_url: 'assets/images/strains/s2/og_kush_1.jpg'
    }
  },
  {
    id: 'review-3',
    user_id: 'user-1',
    strain_id: 'strain-3',
    rating: 4.5,
    review_text: 'This strain helped me relax after a long day. Great for evening use.',
    effects: ['Relaxed', 'Creative', 'Euphoric'],
    flavors: ['Diesel', 'Citrus'],
    created_at: '2023-08-03T00:00:00.000Z',
    strains: {
      id: 'strain-3',
      name: 'Sour Diesel',
      type: 'Sativa',
      image_url: 'assets/images/strains/s3/sour_diesel_1.jpg'
    }
  },
  {
    id: 'review-4',
    user_id: 'user-2',
    strain_id: 'strain-4',
    rating: 5,
    review_text: 'Absolutely amazing for pain relief. My go-to strain when my back is acting up.',
    effects: ['Relaxed', 'Pain Relief', 'Sleepy'],
    flavors: ['Sweet', 'Spicy'],
    created_at: '2023-08-04T00:00:00.000Z',
    strains: {
      id: 'strain-4',
      name: 'Northern Lights',
      type: 'Indica',
      image_url: 'assets/images/strains/s4/northern_lights_1.png'
    }
  },
  {
    id: 'review-5',
    user_id: 'user-2',
    strain_id: 'strain-5',
    rating: 3.5,
    review_text: 'Decent strain but not my favorite. The effects were mild and short-lasting.',
    effects: ['Energetic', 'Focused'],
    flavors: ['Pine', 'Citrus'],
    created_at: '2023-08-05T00:00:00.000Z',
    strains: {
      id: 'strain-5',
      name: 'Jack Herer',
      type: 'Sativa',
      image_url: 'assets/images/strains/s5/jack_herer_1.png'
    }
  },
  {
    id: 'review-6',
    user_id: 'user-3',
    strain_id: 'strain-6',
    rating: 4,
    review_text: 'Great for creativity! I use this when I need inspiration for my art projects.',
    effects: ['Creative', 'Happy', 'Uplifted'],
    flavors: ['Pineapple', 'Tropical'],
    created_at: '2023-08-06T00:00:00.000Z',
    strains: {
      id: 'strain-6',
      name: 'Pineapple Express',
      type: 'Hybrid',
      image_url: 'assets/images/strains/s6/pineapple_express_1.png'
    }
  },
  {
    id: 'review-7',
    user_id: 'user-3',
    strain_id: 'strain-7',
    rating: 4.5,
    review_text: 'Excellent flavor profile with citrus notes. The effects are balanced and pleasant.',
    effects: ['Euphoric', 'Relaxed', 'Creative'],
    flavors: ['Sweet', 'Earthy', 'Mint'],
    created_at: '2023-08-07T00:00:00.000Z',
    strains: {
      id: 'strain-7',
      name: 'Girl Scout Cookies',
      type: 'Hybrid',
      image_url: 'assets/images/strains/s7/gsc_1.png'
    }
  },
  {
    id: 'review-8',
    user_id: 'user-4',
    strain_id: 'strain-8',
    rating: 5,
    review_text: 'This strain changed my life! Perfect for my anxiety and helps me sleep better.',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Grape', 'Berry'],
    created_at: '2023-08-08T00:00:00.000Z',
    strains: {
      id: 'strain-8',
      name: 'Granddaddy Purple',
      type: 'Indica',
      image_url: 'assets/images/strains/s8/gdp_1.png'
    }
  },
  {
    id: 'review-9',
    user_id: 'user-4',
    strain_id: 'strain-1',
    rating: 3,
    review_text: 'Not bad, but I expected more based on the hype. Effects were underwhelming for me.',
    effects: ['Relaxed', 'Mild'],
    flavors: ['Berry', 'Sweet'],
    created_at: '2023-08-09T00:00:00.000Z',
    strains: {
      id: 'strain-1',
      name: 'Blue Dream',
      type: 'Hybrid',
      image_url: 'assets/images/strains/s1/blue_dream_1.jpg'
    }
  },
  {
    id: 'review-10',
    user_id: 'user-5',
    strain_id: 'strain-2',
    rating: 4,
    review_text: 'Solid strain for social situations. Makes me talkative without paranoia.',
    effects: ['Happy', 'Talkative', 'Relaxed'],
    flavors: ['Pine', 'Woody'],
    created_at: '2023-08-10T00:00:00.000Z',
    strains: {
      id: 'strain-2',
      name: 'OG Kush',
      type: 'Indica',
      image_url: 'assets/images/strains/s2/og_kush_1.jpg'
    }
  },
  {
    id: 'review-11',
    user_id: 'user-5',
    strain_id: 'strain-3',
    rating: 4.5,
    review_text: 'One of my favorites! Great taste and perfect effects for relaxing at home.',
    effects: ['Energetic', 'Creative', 'Focused'],
    flavors: ['Diesel', 'Citrus'],
    created_at: '2023-08-11T00:00:00.000Z',
    strains: {
      id: 'strain-3',
      name: 'Sour Diesel',
      type: 'Sativa',
      image_url: 'assets/images/strains/s3/sour_diesel_1.jpg'
    }
  },
  {
    id: 'review-12',
    user_id: 'user-1',
    strain_id: 'strain-4',
    rating: 3.5,
    review_text: 'Good but not great. The effects were nice but didn\'t last as long as I\'d like.',
    effects: ['Relaxed', 'Pain Relief'],
    flavors: ['Sweet', 'Spicy'],
    created_at: '2023-08-12T00:00:00.000Z',
    strains: {
      id: 'strain-4',
      name: 'Northern Lights',
      type: 'Indica',
      image_url: 'assets/images/strains/s4/northern_lights_1.png'
    }
  }
];

// Define types for favorites and follows
interface Favorite {
  id: string;
  user_id: string;
  strain_id: string;
  created_at: string;
}

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Mock favorites data for each user
export const mockFavorites: Favorite[] = [
  { id: 'fav-1', user_id: 'user-1', strain_id: 'strain-1', created_at: '2023-06-01T00:00:00.000Z' },
  { id: 'fav-2', user_id: 'user-1', strain_id: 'strain-3', created_at: '2023-06-02T00:00:00.000Z' },
  { id: 'fav-3', user_id: 'user-2', strain_id: 'strain-2', created_at: '2023-06-04T00:00:00.000Z' },
  { id: 'fav-4', user_id: 'user-3', strain_id: 'strain-1', created_at: '2023-06-06T00:00:00.000Z' },
  { id: 'fav-5', user_id: 'user-3', strain_id: 'strain-2', created_at: '2023-06-07T00:00:00.000Z' }
];

// Mock follows data
export const mockFollows: Follow[] = [
  { id: 'follow-1', follower_id: 'user-1', following_id: 'user-2', created_at: '2023-07-01T00:00:00.000Z' },
  { id: 'follow-2', follower_id: 'user-1', following_id: 'user-3', created_at: '2023-07-02T00:00:00.000Z' },
  { id: 'follow-3', follower_id: 'user-2', following_id: 'user-1', created_at: '2023-07-03T00:00:00.000Z' },
  { id: 'follow-4', follower_id: 'user-3', following_id: 'user-1', created_at: '2023-07-05T00:00:00.000Z' },
  { id: 'follow-5', follower_id: 'user-3', following_id: 'user-2', created_at: '2023-07-06T00:00:00.000Z' }
];

// Mock lists data
export const mockLists: List[] = [
  {
    id: 'list-1',
    user_id: 'user-1',
    title: 'My Favorite Strains',
    description: 'A collection of my all-time favorite cannabis strains',
    is_public: true,
    strains: ['strain-1', 'strain-3'],
    created_at: '2024-01-25T00:00:00Z',
  },
  {
    id: 'list-2',
    user_id: 'user-2',
    title: 'Best for Pain Relief',
    description: 'Strains that have helped me manage chronic pain',
    is_public: true,
    strains: ['strain-2'],
    created_at: '2024-01-26T00:00:00Z',
  },
  {
    id: 'list-3',
    user_id: 'user-3',
    title: 'Creative Boost',
    description: 'My go-to strains for creative work and inspiration',
    is_public: true,
    strains: ['strain-3', 'strain-1'],
    created_at: '2024-01-27T00:00:00Z',
  }
];

// Mock list followers data
export interface ListFollow {
  id: string;
  user_id: string;
  list_id: string;
  created_at: string;
}

export const mockListFollowers: ListFollow[] = [
  { id: 'listfollow-1', user_id: 'user-2', list_id: 'list-1', created_at: '2024-01-30T00:00:00Z' },
  { id: 'listfollow-2', user_id: 'user-3', list_id: 'list-1', created_at: '2024-01-31T00:00:00Z' },
  { id: 'listfollow-3', user_id: 'user-4', list_id: 'list-1', created_at: '2024-02-01T00:00:00Z' },
  { id: 'listfollow-4', user_id: 'user-1', list_id: 'list-2', created_at: '2024-02-02T00:00:00Z' },
  { id: 'listfollow-5', user_id: 'user-3', list_id: 'list-2', created_at: '2024-02-03T00:00:00Z' },
  { id: 'listfollow-6', user_id: 'user-1', list_id: 'list-3', created_at: '2024-02-04T00:00:00Z' },
  { id: 'listfollow-7', user_id: 'user-2', list_id: 'list-3', created_at: '2024-02-05T00:00:00Z' }
]; 