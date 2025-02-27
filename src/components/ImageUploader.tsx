import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  images, 
  onImagesChange,
  maxImages = 5
}) => {
  // Pick an image from the gallery
  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  // Set a photo as the primary (first) image
  const setPrimaryPhoto = (index: number) => {
    if (index === 0) return; // Already primary
    
    const newImages = [...images];
    const primaryImage = newImages.splice(index, 1)[0];
    newImages.unshift(primaryImage);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Feather name="image" size={24} color="#fff" />
          <Text style={styles.photoButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.photoButton, { marginRight: 0 }]} onPress={takePhoto}>
          <Feather name="camera" size={24} color="#fff" />
          <Text style={styles.photoButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>
      
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {images.map((image, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: image }} style={styles.photo} />
              <View style={styles.photoActions}>
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={() => removePhoto(index)}
                >
                  <Feather name="trash-2" size={16} color="#fff" />
                </TouchableOpacity>
                
                {index !== 0 && (
                  <TouchableOpacity 
                    style={styles.photoActionButton}
                    onPress={() => setPrimaryPhoto(index)}
                  >
                    <Feather name="star" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>Primary</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      
      <Text style={styles.helperText}>
        {images.length === 0 
          ? 'Add photos of the strain to help others identify it' 
          : `${images.length}/${maxImages} images added (first image is primary)`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  photoButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexDirection: 'row',
    flex: 1,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  imageScroll: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photoActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    backgroundColor: 'rgba(16,185,129,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
}); 