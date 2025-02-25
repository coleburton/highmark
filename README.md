# HighMark - Cannabis Strain Review Platform

HighMark is a mobile application for tracking and reviewing cannabis strains and products. Think of it as Letterboxd, but for cannabis experiences.

## Features

- User authentication and profiles
- Comprehensive strain/product database
- Review and rating system
- Social features (follows, likes, lists)
- Search and discovery tools

## Tech Stack

- React Native (Expo)
- Supabase (Backend & Authentication)
- TypeScript
- React Navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Supabase account

### Environment Setup

1. Create a `.env` file in the root directory with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/highmark.git
cd highmark
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npx expo start
```

### Supabase Setup

1. Create a new Supabase project
2. Run the following SQL commands in your Supabase SQL editor to set up the database schema:

```sql
-- Create enum types
CREATE TYPE strain_type AS ENUM ('Indica', 'Sativa', 'Hybrid', 'Other');

-- Create tables
CREATE TABLE strains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type strain_type NOT NULL,
  THC_percentage DECIMAL,
  CBD_percentage DECIMAL,
  effects TEXT[] NOT NULL,
  flavors TEXT[] NOT NULL,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  submitted_by UUID REFERENCES auth.users(id),
  approved BOOLEAN DEFAULT false
);

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  strain_id UUID REFERENCES strains(id) NOT NULL,
  rating DECIMAL NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  effects TEXT[] NOT NULL,
  flavors TEXT[] NOT NULL,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  strains UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_strains_name ON strains(name);
CREATE INDEX idx_reviews_strain_id ON reviews(strain_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_lists_user_id ON lists(user_id);

-- Set up RLS policies
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Strains policies
CREATE POLICY "Public strains are viewable by everyone" ON strains
  FOR SELECT USING (approved = true);

CREATE POLICY "Users can insert strains" ON strains
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Lists policies
CREATE POLICY "Public lists are viewable by everyone" ON lists
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 