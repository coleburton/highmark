# Strain Images

This directory contains images for cannabis strains used in the Highmark application.

## Directory Structure

```
assets/images/strains/
├── s1/                      # Blue Dream strain images
│   ├── blue_dream_1.jpg
│   ├── blue_dream_2.jpg
│   └── blue_dream_3.jpg
├── s2/                      # OG Kush strain images
│   ├── og_kush_1.jpg
│   └── og_kush_2.jpg
├── s3/                      # Sour Diesel strain images
│   └── sour_diesel_1.jpg
└── ...                      # Additional strain directories
```

## Adding New Strain Images

1. Create a directory for the strain using its ID (e.g., `s4/` for a new strain with ID 's4')
2. Add image files to the directory with descriptive names
3. Update the `strainImages` mapping in `src/utils/imageUtils.ts` to include the new strain and its image filenames (without extension)
4. Add a new case in the `switch` statement in the `getStrainImage` function to handle the new image

Example:
```typescript
// Step 3: Update the strainImages mapping
export const strainImages: Record<string, string[]> = {
  // Existing strains...
  's4': ['purple_haze_1', 'purple_haze_2'],
};

// Step 4: Add cases for the new images in getStrainImage function
switch (`${strainId}/${imageName}`) {
  // Existing cases...
  case 's4/purple_haze_1':
    image = require('../../assets/images/strains/s4/purple_haze_1.jpg');
    break;
  case 's4/purple_haze_2':
    image = require('../../assets/images/strains/s4/purple_haze_2.jpg');
    break;
}
```

## Default Images

For strains without specific images, the application uses a placeholder image from placehold.co. This is defined in the `imageUtils.ts` file:

```typescript
const DEFAULT_STRAIN_IMAGE = { uri: 'https://placehold.co/400x400/10B981/FFFFFF/png?text=Strain' };
```

## Important Note About React Native Images

React Native requires local images to be loaded using `require()` with a static string path. This is why we need to explicitly handle each image in the `getStrainImage` function. Dynamic paths like `require(dynamicPath)` are not supported in React Native.

## Image Recommendations

- Primary images should be high quality and clearly show the strain
- Use consistent aspect ratios (recommended: 3:2 or 16:9)
- Optimal resolution: 1200x800px or similar
- File format: JPG or PNG
- Keep file sizes under 500KB for optimal performance

## Usage in Code

The application uses utility functions from `src/utils/imageUtils.ts` to access strain images:

```typescript
// Get the primary image for a strain (returns a require'd module, not a string path)
const primaryImage = getStrainImage('s1');

// Use in an Image component
<Image source={getStrainImage('s1')} style={styles.image} />

// Get all images for a strain
const allImages = getAllStrainImages('s1');

// Check if a strain has multiple images
const hasMultiple = hasMultipleImages('s1');
``` 