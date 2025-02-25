import { User, Strain, Review, List } from '../types';
import { getStrainImage } from '../utils/imageUtils';

export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'JaneGreen',
    email: 'jane@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Jane+Green',
    bio: 'Cannabis enthusiast and reviewer. Love exploring new strains! 🌿',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    username: 'MikeBlaze',
    email: 'mike@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Blaze',
    bio: 'Medicinal cannabis advocate. Sharing honest reviews.',
    created_at: '2024-01-02T00:00:00Z',
  },
];

export const mockStrains: Strain[] = [
  {
    id: 's1',
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
    submitted_by: 'u1',
    approved: true,
  },
  {
    id: 's2',
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
    submitted_by: 'u2',
    approved: true,
  },
  {
    id: 's3',
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
    submitted_by: 'u1',
    approved: true,
  },
];

export const mockReviews: (Review & { strains: { name: string; type: string } })[] = [
  {
    id: 'r1',
    user_id: 'u1',
    strain_id: 's1',
    rating: 4.5,
    review_text: 'Perfect balance of relaxation and creativity. Great for afternoon use!',
    effects: ['Relaxed', 'Creative', 'Happy'],
    flavors: ['Berry', 'Sweet'],
    created_at: '2024-01-10T00:00:00Z',
    strains: {
      name: 'Blue Dream',
      type: 'Hybrid',
    },
  },
  {
    id: 'r2',
    user_id: 'u2',
    strain_id: 's2',
    rating: 5,
    review_text: 'Classic OG Kush. Amazing for stress relief and sleep.',
    effects: ['Relaxed', 'Sleepy'],
    flavors: ['Pine', 'Woody'],
    created_at: '2024-01-11T00:00:00Z',
    strains: {
      name: 'OG Kush',
      type: 'Indica',
    },
  },
  {
    id: 'r3',
    user_id: 'u1',
    strain_id: 's3',
    rating: 4,
    review_text: 'Great for morning use. Really helps with focus and creativity.',
    effects: ['Energetic', 'Focused'],
    flavors: ['Diesel', 'Citrus'],
    created_at: '2024-01-12T00:00:00Z',
    strains: {
      name: 'Sour Diesel',
      type: 'Sativa',
    },
  },
];

export const mockUserProfiles: Record<string, { username: string; avatar_url: string }> = {
  u1: {
    username: 'JaneGreen',
    avatar_url: 'https://ui-avatars.com/api/?name=Jane+Green',
  },
  u2: {
    username: 'MikeBlaze',
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Blaze',
  },
};

// Mock lists data
export const mockLists: List[] = [
  {
    id: 'l1',
    user_id: 'u1',
    title: 'Favorites',
    description: 'My all-time favorite strains',
    is_public: true,
    strains: ['s1'],
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'l2',
    user_id: 'u1',
    title: 'To Try',
    description: 'Strains I want to try next',
    is_public: true,
    strains: ['s2'],
    created_at: '2024-01-16T00:00:00Z',
  },
  {
    id: 'l3',
    user_id: 'u2',
    title: 'Sleep Aid',
    description: 'Best strains for sleep',
    is_public: true,
    strains: ['s2'],
    created_at: '2024-01-17T00:00:00Z',
  },
]; 