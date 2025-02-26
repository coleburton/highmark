import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Platform,
  Alert,
  SafeAreaView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { mockStrains } from '../data/mockData';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddReview'>;

// Predefined lists of effects and flavors
const EFFECTS = [
  'Relaxed', 'Happy', 'Euphoric', 'Uplifted', 'Creative',
  'Energetic', 'Focused', 'Hungry', 'Talkative', 'Giggly',
  'Sleepy', 'Tingly', 'Pain Relief', 'Aroused', 'Dry Eyes',
  'Dry Mouth', 'Anxious', 'Paranoid', 'Dizzy', 'Headache'
];

const FLAVORS = [
  'Earthy', 'Sweet', 'Citrus', 'Fruity', 'Pine',
  'Berry', 'Woody', 'Spicy', 'Herbal', 'Pungent',
  'Diesel', 'Cheese', 'Floral', 'Tropical', 'Blueberry',
  'Grape', 'Lemon', 'Mango', 'Mint', 'Skunk'
];

export const AddReviewScreen = ({ navigation, route }: Props) => {
  // Add navigation options
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Home',
    });
  }, [navigation]);

  // State for the review form
  const [selectedStrainId, setSelectedStrainId] = useState<string | null>(route.params?.strainId || null);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const searchInputRef = React.useRef<View>(null);
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [selectedStrainDetails, setSelectedStrainDetails] = useState<any>(null);
  const [filteredStrains, setFilteredStrains] = useState(mockStrains.map(strain => ({
    label: strain.name,
    value: strain.id,
    type: strain.type
  })));
  const [scaleAnim] = useState(new Animated.Value(1));
  const dropdownRef = React.useRef<View>(null);

  // Initialize the strain name if a strainId was passed
  useEffect(() => {
    if (route.params?.strainId) {
      // Pre-select the strain if it was passed in the route params
      setSelectedStrainId(route.params.strainId);
      
      // You might want to fetch the strain details here if needed
      // For now, we'll just use the mockStrains data
      const strain = mockStrains.find(s => s.id === route.params.strainId);
      if (strain) {
        setSearchQuery(strain.name);
      }
    }
  }, [route.params?.strainId]);

  // Filter strains based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStrains(mockStrains.map(strain => ({
        label: strain.name,
        value: strain.id,
        type: strain.type
      })));
    } else {
      const filtered = mockStrains
        .filter(strain => 
          strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          strain.type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(strain => ({
          label: strain.name,
          value: strain.id,
          type: strain.type
        }));
      setFilteredStrains(filtered);
    }
  }, [searchQuery]);

  // Handle search focus animations
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
    setIsFocused(true);
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  // Clear search and hide results
  const clearSearch = () => {
    setSearchQuery('');
    setIsFocused(false);
  };

  // Hide results when clicking outside
  const hideResults = () => {
    setIsFocused(false);
  };

  // Handle strain selection
  const handleSelectStrain = (item: any) => {
    setSelectedStrainId(item.value);
    setSelectedStrainDetails(item);
    setSearchQuery(item.label);
    setIsFocused(false);
  };

  // Render the selected strain value
  const renderSelectedValue = () => {
    if (!selectedStrainDetails) return null;
    
    return (
      <View style={styles.selectedValueContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={selectedStrainDetails.type === 'Sativa' ? 'white-balance-sunny' : 
                  selectedStrainDetails.type === 'Indica' ? 'moon-waning-crescent' : 'circle-half-full'} 
            size={24} 
            color="#10B981" 
          />
        </View>
        <Text style={styles.selectedTextStyle}>{selectedStrainDetails.label}</Text>
      </View>
    );
  };

  // This function is now mainly used for validation
  const getStrainName = (strainId: string | null) => {
    if (!strainId) return '';
    const strain = mockStrains.find(s => s.id === strainId);
    return strain ? strain.name : '';
  };

  // Handle rating selection
  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  // Toggle effect selection
  const toggleEffect = (effect: string) => {
    if (selectedEffects.includes(effect)) {
      setSelectedEffects(selectedEffects.filter(e => e !== effect));
    } else {
      setSelectedEffects([...selectedEffects, effect]);
    }
  };

  // Toggle flavor selection
  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Submit the review
  const submitReview = () => {
    if (!selectedStrainId || searchQuery.trim() === '') {
      Alert.alert('Error', 'Please select a strain');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Please rate the strain');
      return;
    }

    // In a real app, we would send this data to an API
    const reviewData = {
      strain_id: selectedStrainId,
      rating,
      review_text: reviewText,
      effects: selectedEffects,
      flavors: selectedFlavors,
      photos,
    };

    console.log('Review submitted:', reviewData);
    Alert.alert('Success', 'Your review has been submitted!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  // Measure dropdown position
  const measureDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({ 
          x: pageX, 
          y: pageY + height 
        });
        setDropdownWidth(width);
      });
    }
  };

  // Measure dropdown position when focus changes or when layout changes
  useEffect(() => {
    if (isFocused) {
      // Small delay to ensure layout is complete
      setTimeout(measureDropdown, 100);
    }
  }, [isFocused]);

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (isFocused) {
        setIsFocused(false);
      } else {
        Keyboard.dismiss();
      }
    }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContainer}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isFocused}
          >
            <Text style={styles.title}>Add Review</Text>
            
            {/* Strain Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strain</Text>
              <View 
                style={styles.dropdownContainer}
                ref={dropdownRef}
                onLayout={() => {
                  if (isFocused) {
                    measureDropdown();
                  }
                }}
              >
                <TouchableOpacity 
                  style={[styles.dropdown, isFocused && { borderColor: '#10B981' }]}
                  onPress={() => setIsFocused(!isFocused)}
                >
                  {selectedStrainId ? (
                    renderSelectedValue()
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                      <TextInput
                        style={[styles.placeholderStyle, { flex: 1 }]}
                        placeholder="Search strains..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsFocused(true)}
                      />
                    </View>
                  )}
                  <Feather name={isFocused ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRatingPress(star)}
                  >
                    <MaterialCommunityIcons
                      name={star <= rating ? "star" : "star-outline"}
                      size={40}
                      color={star <= rating ? "#10B981" : "#4B5563"}
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Review Text */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience with this strain..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={5}
                value={reviewText}
                onChangeText={setReviewText}
              />
            </View>
            
            {/* Effects */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Effects</Text>
              <View style={styles.tagsContainer}>
                {EFFECTS.map(effect => (
                  <TouchableOpacity
                    key={effect}
                    style={[
                      styles.tag,
                      selectedEffects.includes(effect) && styles.tagSelected
                    ]}
                    onPress={() => toggleEffect(effect)}
                  >
                    <Text 
                      style={[
                        styles.tagText,
                        selectedEffects.includes(effect) && styles.tagTextSelected
                      ]}
                    >
                      {effect}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Flavors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavors</Text>
              <View style={styles.tagsContainer}>
                {FLAVORS.map(flavor => (
                  <TouchableOpacity
                    key={flavor}
                    style={[
                      styles.tag,
                      selectedFlavors.includes(flavor) && styles.tagSelected
                    ]}
                    onPress={() => toggleFlavor(flavor)}
                  >
                    <Text 
                      style={[
                        styles.tagText,
                        selectedFlavors.includes(flavor) && styles.tagTextSelected
                      ]}
                    >
                      {flavor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Photos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
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
              
              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* Spacer at the bottom to ensure content doesn't get hidden behind the button */}
            <View style={styles.buttonSpacer} />
          </ScrollView>
          
          {/* Modal for dropdown list */}
          <Modal
            visible={isFocused}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsFocused(false)}
            statusBarTranslucent={true}
          >
            <TouchableWithoutFeedback onPress={() => setIsFocused(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View 
                    style={[
                      styles.dropdownList, 
                      { 
                        width: dropdownWidth, 
                        left: dropdownPosition.x, 
                        top: dropdownPosition.y 
                      }
                    ]}
                  >
                    {filteredStrains.length > 0 ? (
                      <ScrollView 
                        style={styles.dropdownList}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                      >
                        {filteredStrains.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            onPress={() => handleSelectStrain(item)}
                            style={[
                              styles.dropdownItem,
                              selectedStrainId === item.value && styles.selectedItem
                            ]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.iconContainer}>
                              <MaterialCommunityIcons 
                                name={item.type === 'Sativa' ? 'white-balance-sunny' : 
                                      item.type === 'Indica' ? 'moon-waning-crescent' : 'circle-half-full'} 
                                size={24} 
                                color="#10B981" 
                              />
                            </View>
                            <View style={styles.itemTextContainer}>
                              <Text style={styles.itemText}>{item.label}</Text>
                              <Text style={styles.itemSubText}>
                                {item.type === 'Sativa' ? 'For energy and focus' : 
                                 item.type === 'Indica' ? 'For relaxation and sleep' : 
                                 'Balanced hybrid effects'}
                              </Text>
                            </View>
                            <Text style={styles.itemType}>{item.type}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>No strains found</Text>
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          
          {/* Fixed position Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
    zIndex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  dropdown: {
    height: 56,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#6B7280',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  iconContainer: {
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  itemType: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  searchIcon: {
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  starIcon: {
    marginHorizontal: 8,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  photoButton: {
    backgroundColor: '#10B981',
    borderRadius: 30,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: '48%',
    height: 56,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSpacer: {
    height: 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#121212',
    zIndex: 1000,
    elevation: 1000, // For Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedItem: {
    backgroundColor: '#2A2A2A',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownList: {
    maxHeight: 300,
  },
  selectedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}); 