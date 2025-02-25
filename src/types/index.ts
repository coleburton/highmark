export type User = {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  created_at: string;
};

export type StrainType = 'Indica' | 'Sativa' | 'Hybrid' | 'Other';

export type Strain = {
  id: string;
  name: string;
  type: 'Indica' | 'Sativa' | 'Hybrid';
  THC_percentage: number;
  CBD_percentage: number;
  effects: string[];
  flavors: string[];
  images: string[];
  image_url?: string;
  description?: string;
  created_at: string;
  submitted_by: string;
  approved: boolean;
};

export type Review = {
  id: string;
  user_id: string;
  strain_id: string;
  rating: number;
  review_text: string;
  effects: string[];
  flavors: string[];
  created_at: string;
};

export type List = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  strains: string[];
  created_at: string;
}; 