import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ProductPreferencesProps {
  onComplete: () => void;
}

interface ProductType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const ProductPreferencesScreen = ({ onComplete }: ProductPreferencesProps) => {
  const productTypes: ProductType[] = [
    {
      id: 'flower',
      name: 'Flower',
      icon: 'feather',
      description: 'Traditional cannabis buds for smoking or vaporizing',
    },
    {
      id: 'vape',
      name: 'Vape',
      icon: 'battery',
      description: 'Cartridges and pens for vaporizing cannabis oil',
    },
    {
      id: 'edible',
      name: 'Edibles',
      icon: 'coffee',
      description: 'Food and beverages infused with cannabis',
    },
    {
      id: 'concentrate',
      name: 'Concentrates',
      icon: 'droplet',
      description: 'Potent extracts like wax, shatter, and live resin',
    },
    {
      id: 'topical',
      name: 'Topicals',
      icon: 'thermometer',
      description: 'Creams, balms, and patches applied to the skin',
    },
    {
      id: 'tincture',
      name: 'Tinctures',
      icon: 'flask',
      description: 'Liquid cannabis extracts taken under the tongue',
    },
    {
      id: 'preroll',
      name: 'Pre-rolls',
      icon: 'paperclip',
      description: 'Ready-to-smoke joints and blunts',
    },
  ];

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleContinue = () => {
    // In a real app, you would save these preferences to user profile
    console.log('Selected products:', selectedProducts);
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What do you enjoy?</Text>
        <Text style={styles.subtitle}>
          Select the cannabis products you're interested in
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.productsGrid}>
          {productTypes.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard,
                selectedProducts.includes(product.id) && styles.selectedCard,
              ]}
              onPress={() => toggleProduct(product.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Feather
                  name={product.icon as any}
                  size={28}
                  color={selectedProducts.includes(product.id) ? '#FFFFFF' : '#10b981'}
                />
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              {selectedProducts.includes(product.id) && (
                <View style={styles.checkmark}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectionCount}>
          {selectedProducts.length} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedProducts.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selectedProducts.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#10b981',
    backgroundColor: '#0D3229',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 