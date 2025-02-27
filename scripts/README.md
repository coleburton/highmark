# Strain Image Upload Tool

This command-line tool allows you to upload and manage strain images in the Supabase storage bucket and link them to specific strains in the database.

## Prerequisites

- Node.js installed
- Access to the Supabase project
- Environment variables properly configured (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)

## Installation

1. Make sure you have the required dependencies:

```bash
npm install commander dotenv base64-arraybuffer
```

2. Make the script executable:

```bash
chmod +x scripts/upload-strain-images.ts
```

## Usage

### Compile and Run

Since this is a TypeScript file, you'll need to compile it before running or use `ts-node`:

```bash
# Using ts-node
npx ts-node scripts/upload-strain-images.ts [command] [options]

# Or compile and run
npx tsc scripts/upload-strain-images.ts
node scripts/upload-strain-images.js [command] [options]
```

### Available Commands

#### Upload a Single Image

```bash
npx ts-node scripts/upload-strain-images.ts upload -s <strain-id> -f <file-path> [-p]
```

Options:
- `-s, --strain-id <id>`: ID of the strain to link the image to (required)
- `-f, --file <path>`: Path to the image file (required)
- `-p, --primary`: Set as the primary image for the strain (optional)

Example:
```bash
npx ts-node scripts/upload-strain-images.ts upload -s 123e4567-e89b-12d3-a456-426614174000 -f ./images/blue_dream.jpg -p
```

#### Upload Multiple Images

```bash
npx ts-node scripts/upload-strain-images.ts upload-batch -s <strain-id> -d <directory-path> [-p <index>]
```

Options:
- `-s, --strain-id <id>`: ID of the strain to link the images to (required)
- `-d, --directory <path>`: Directory containing images to upload (required)
- `-p, --primary-index <index>`: Index of the image to set as primary (0-based, defaults to 0)

Example:
```bash
npx ts-node scripts/upload-strain-images.ts upload-batch -s 123e4567-e89b-12d3-a456-426614174000 -d ./strain_images/blue_dream -p 2
```

#### Set Primary Image

```bash
npx ts-node scripts/upload-strain-images.ts set-primary -s <strain-id> -i <image-index>
```

Options:
- `-s, --strain-id <id>`: ID of the strain (required)
- `-i, --image-index <index>`: Index of the image to set as primary (0-based) (required)

Example:
```bash
npx ts-node scripts/upload-strain-images.ts set-primary -s 123e4567-e89b-12d3-a456-426614174000 -i 1
```

#### List Strain Images

```bash
npx ts-node scripts/upload-strain-images.ts list -s <strain-id>
```

Options:
- `-s, --strain-id <id>`: ID of the strain (required)

Example:
```bash
npx ts-node scripts/upload-strain-images.ts list -s 123e4567-e89b-12d3-a456-426614174000
```

## Tips

1. Use the `list` command to see all images for a strain and their indices before setting a primary image.
2. When uploading a batch of images, the first image (index 0) will be set as primary by default unless specified otherwise.
3. Image files should be in JPG, JPEG, PNG, or GIF format.
4. The uploaded images will be stored in the `assets/images/strains` bucket in Supabase storage. 