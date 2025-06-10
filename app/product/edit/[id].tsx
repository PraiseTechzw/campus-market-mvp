import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: 'new' | 'used';
  specifications: Record<string, string>;
}

const CATEGORY_FIELDS: Record<string, Array<{key: string, label: string, placeholder: string, required?: boolean}>> = {
  'Electronics': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g., Apple, Samsung', required: true },
    { key: 'model', label: 'Model', placeholder: 'e.g., iPhone 13, Galaxy S21' },
    { key: 'color', label: 'Color', placeholder: 'e.g., Space Gray, White' },
    { key: 'storage', label: 'Storage', placeholder: 'e.g., 128GB, 256GB' },
    { key: 'processor', label: 'Processor', placeholder: 'e.g., A15 Bionic, Snapdragon' },
    { key: 'ram', label: 'RAM', placeholder: 'e.g., 8GB, 12GB' },
    { key: 'screenSize', label: 'Screen Size', placeholder: 'e.g., 6.1", 6.7"' },
    { key: 'operatingSystem', label: 'OS', placeholder: 'e.g., iOS 15, Android 12' },
  ],
  'Books': [
    { key: 'author', label: 'Author', placeholder: 'Book author name', required: true },
    { key: 'isbn', label: 'ISBN', placeholder: 'ISBN number' },
    { key: 'edition', label: 'Edition', placeholder: 'e.g., 5th Edition' },
    { key: 'subject', label: 'Subject', placeholder: 'e.g., Mathematics, Physics' },
    { key: 'year', label: 'Publication Year', placeholder: 'e.g., 2023' },
  ],
  'Fashion': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g., Nike, Adidas' },
    { key: 'size', label: 'Size', placeholder: 'e.g., M, L, XL, 32, 34', required: true },
    { key: 'color', label: 'Color', placeholder: 'e.g., Black, Blue, Red' },
    { key: 'material', label: 'Material', placeholder: 'e.g., Cotton, Polyester' },
  ],
  'Furniture': [
    { key: 'material', label: 'Material', placeholder: 'e.g., Wood, Metal, Plastic' },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g., 120x60x75 cm' },
    { key: 'color', label: 'Color', placeholder: 'e.g., Brown, White, Black' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g., 15kg, 25kg' },
  ],
  'Sports': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g., Nike, Adidas, Wilson' },
    { key: 'size', label: 'Size', placeholder: 'e.g., M, L, One Size' },
    { key: 'color', label: 'Color', placeholder: 'e.g., Red, Blue, Black' },
    { key: 'material', label: 'Material', placeholder: 'e.g., Leather, Synthetic' },
  ],
  'Beauty': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g., L\'Oreal, Maybelline' },
    { key: 'color', label: 'Shade/Color', placeholder: 'e.g., Natural, Fair, Medium' },
    { key: 'size', label: 'Size/Volume', placeholder: 'e.g., 50ml, 100ml' },
  ],
};

export default function EditProductScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'used',
    specifications: {},
  });
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if user is the seller
      if (data.seller_id !== user?.id) {
        Toast.show({
          type: 'error',
          text1: 'Unauthorized',
          text2: 'You can only edit your own products',
        });
        router.back();
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        condition: data.condition as 'new' | 'used',
        specifications: data.specifications || {},
      });
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load product details',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please allow access to your photo library',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please allow access to your camera',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    
    // Validate category-specific required fields
    const categoryFields = CATEGORY_FIELDS[formData.category] || [];
    categoryFields.forEach(field => {
      if (field.required && !formData.specifications[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });
    
    if (images.length === 0) {
      newErrors.images = 'Please add at least one image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    
    try {
      // For demo purposes, we'll use placeholder images from Pexels
      // In a real app, you'd upload the images to storage first
      const productImages = images.length > 0 ? images : [
        'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400'
      ];

      // Update product
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          category: formData.category,
          condition: formData.condition,
          images: productImages,
          specifications: formData.specifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Product Updated',
        text2: 'Your product has been updated successfully',
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update product',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setSaving(true);
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Toast.show({
                type: 'success',
                text1: 'Product Deleted',
                text2: 'Your product has been deleted successfully',
              });

              router.replace('/(tabs)');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.message || 'Failed to delete product',
              });
              setSaving(false);
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Product</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Basic Information */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Product Title *"
                placeholder="What are you selling?"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                error={errors.title}
                leftIcon={<Ionicons name="text\" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Description *"
                placeholder="Describe your product in detail"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                error={errors.description}
                leftIcon={<Ionicons name="document-text\" size={20} color={colors.textTertiary} />}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            </View>
          </Card>

          {/* Category & Condition */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category & Condition
            </Text>
            
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: formData.category === category ? colors.primary : colors.surface,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text style={[
                        styles.categoryText,
                        {
                          color: formData.category === category ? '#FFFFFF' : colors.text
                        }
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.category && (
                  <Text style={[styles.error, { color: colors.error }]}>
                    {errors.category}
                  </Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Condition *</Text>
                <View style={styles.conditionButtons}>
                  {(['new', 'used'] as const).map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      style={[
                        styles.conditionButton,
                        {
                          backgroundColor: formData.condition === condition ? colors.primary : colors.surface,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => setFormData({ ...formData, condition })}
                    >
                      <Ionicons 
                        name={condition === 'new' ? 'sparkles' : 'time'} 
                        size={20} 
                        color={formData.condition === condition ? '#FFFFFF' : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.conditionText,
                        {
                          color: formData.condition === condition ? '#FFFFFF' : colors.text
                        }
                      ]}>
                        {condition === 'new' ? 'Brand New' : 'Used'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Card>

          {/* Pricing & Specifications */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pricing & Specifications
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Price ($) *"
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
                error={errors.price}
                leftIcon={<Ionicons name="cash\" size={20} color={colors.textTertiary} />}
              />

              {formData.category && CATEGORY_FIELDS[formData.category] && (
                <>
                  <Text style={[styles.specificationsTitle, { color: colors.text }]}>
                    {formData.category} Specifications
                  </Text>
                  {CATEGORY_FIELDS[formData.category].map((field) => (
                    <Input
                      key={field.key}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      placeholder={field.placeholder}
                      value={formData.specifications[field.key] || ''}
                      onChangeText={(text) => setFormData({
                        ...formData,
                        specifications: {
                          ...formData.specifications,
                          [field.key]: text
                        }
                      })}
                      error={errors[field.key]}
                    />
                  ))}
                </>
              )}
            </View>
          </Card>

          {/* Product Images */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Product Images
            </Text>
            
            <View style={styles.form}>
              <View style={styles.imageSection}>
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={pickImage}
                  >
                    <Ionicons name="images" size={24} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                      Gallery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={24} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                      Camera
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {images.length > 0 && (
                  <View style={styles.imagePreview}>
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri }} style={styles.image} />
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: colors.error }]}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {errors.images && (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.images}
                </Text>
              )}
            </View>
          </Card>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  form: {
    gap: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  specificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  imageSection: {
    gap: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    marginBottom: 40,
  },
});