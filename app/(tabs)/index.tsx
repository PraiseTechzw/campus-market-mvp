import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: 'new' | 'used';
  location: string;
  // Category-specific fields
  brand?: string;
  model?: string;
  year?: string;
  color?: string;
  size?: string;
  isbn?: string;
  author?: string;
  edition?: string;
  subject?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  storage?: string;
  processor?: string;
  ram?: string;
  screenSize?: string;
  operatingSystem?: string;
}

const CATEGORY_FIELDS: Record<string, Array<{key: keyof ProductFormData, label: string, placeholder: string, required?: boolean}>> = {
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

export default function CreateScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'used',
    location: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  const totalSteps = 4;

  useEffect(() => {
    // Pre-fill location if user has a university
    if (user?.university) {
      setFormData(prev => ({
        ...prev,
        location: user.university || ''
      }));
    }
  }, [user]);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Limit to 5 images total
      const newImages = [...images];
      result.assets.forEach(asset => {
        if (newImages.length < 5) {
          newImages.push(asset.uri);
        }
      });
      setImages(newImages);
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
      // Limit to 5 images total
      if (images.length < 5) {
        setImages([...images, result.assets[0].uri]);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Maximum Images',
          text2: 'You can only add up to 5 images',
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        } else if (formData.title.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        }
        
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        }
        
        if (!formData.location.trim()) {
          newErrors.location = 'Location is required';
        }
        break;
        
      case 2:
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        break;
        
      case 3:
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
          newErrors.price = 'Please enter a valid price';
        }
        
        // Validate category-specific required fields
        const categoryFields = CATEGORY_FIELDS[formData.category] || [];
        categoryFields.forEach(field => {
          if (field.required && !specifications[field.key]) {
            newErrors[field.key] = `${field.label} is required`;
          }
        });
        break;
        
      case 4:
        if (images.length === 0) {
          newErrors.images = 'Please add at least one image';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when moving to next step
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    // Scroll to top when moving to previous step
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!user) return;

    setLoading(true);
    setProgress(0);
    
    try {
      // For demo purposes, we'll use placeholder images from Pexels
      // In a real app, you'd upload the images to storage
      let productImages = images;
      
      if (images.length === 0) {
        // Use placeholder images if none provided
        productImages = [
          'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400'
        ];
      }

      // Simulate upload progress
      setUploading(true);
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setUploading(false);

      // Prepare specifications object
      const productSpecifications: Record<string, any> = {};
      const categoryFields = CATEGORY_FIELDS[formData.category] || [];
      categoryFields.forEach(field => {
        if (specifications[field.key]) {
          productSpecifications[field.key] = specifications[field.key];
        }
      });

      // Create product
      const { data, error } = await supabase
        .from('products')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          category: formData.category,
          category_id: formData.category.toLowerCase().replace(/\s+/g, '_'),
          condition: formData.condition,
          images: productImages,
          specifications: productSpecifications,
          seller_id: user.id,
          is_sold: false,
          location: formData.location,
          tags: generateTags(),
        })
        .select();

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Your product has been listed successfully.',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error creating product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create listing',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const generateTags = () => {
    const tags = [
      formData.title,
      formData.category,
      formData.condition,
      formData.location,
    ];
    
    // Add specifications to tags
    Object.values(specifications).forEach(value => {
      if (value) tags.push(value);
    });
    
    // Filter out empty values and return unique tags
    return [...new Set(tags.filter(tag => tag))];
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setSpecifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card style={styles.stepCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Basic Information
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Tell us about your product
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Product Title *"
                placeholder="What are you selling?"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                error={errors.title}
                leftIcon={<Ionicons name="text" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Description *"
                placeholder="Describe your product in detail"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                error={errors.description}
                leftIcon={<Ionicons name="document-text" size={20} color={colors.textTertiary} />}
                style={{ height: 100, textAlignVertical: 'top' }}
              />

              <Input
                label="Location *"
                placeholder="Where is the item located?"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                error={errors.location}
                leftIcon={<Ionicons name="location" size={20} color={colors.textTertiary} />}
              />
            </View>

            <View style={styles.tipContainer}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
                <Text style={[styles.tipTitle, { color: colors.text }]}>Listing Tips</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Use a clear, descriptive title{'\n'}
                • Include all relevant details in the description{'\n'}
                • Be honest about the condition{'\n'}
                • Mention any defects or issues
              </Text>
            </View>
          </Card>
        );

      case 2:
        return (
          <Card style={styles.stepCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Category & Condition
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Help buyers find your product
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

              <View style={styles.categoryInfoContainer}>
                <Text style={[styles.categoryInfoTitle, { color: colors.text }]}>
                  {formData.category ? `About ${formData.category}` : 'Select a Category'}
                </Text>
                <Text style={[styles.categoryInfoText, { color: colors.textSecondary }]}>
                  {getCategoryDescription(formData.category)}
                </Text>
              </View>
            </View>
          </Card>
        );

      case 3:
        const categoryFields = CATEGORY_FIELDS[formData.category] || [];
        return (
          <Card style={styles.stepCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Pricing & Specifications
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Set your price and add product details
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Price ($) *"
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
                error={errors.price}
                leftIcon={<Ionicons name="cash" size={20} color={colors.textTertiary} />}
              />

              {formData.category && categoryFields.length > 0 && (
                <>
                  <Text style={[styles.specificationsTitle, { color: colors.text }]}>
                    {formData.category} Specifications
                  </Text>
                  {categoryFields.map((field) => (
                    <Input
                      key={field.key}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      placeholder={field.placeholder}
                      value={specifications[field.key] || ''}
                      onChangeText={(text) => handleSpecificationChange(field.key, text)}
                      error={errors[field.key]}
                    />
                  ))}
                </>
              )}

              <View style={styles.pricingTipsContainer}>
                <View style={styles.tipHeader}>
                  <Ionicons name="pricetag" size={20} color={colors.primary} />
                  <Text style={[styles.tipTitle, { color: colors.text }]}>Pricing Tips</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  • Research similar items to set a competitive price{'\n'}
                  • Consider the condition when pricing{'\n'}
                  • Be open to negotiation{'\n'}
                  • Include any accessories in the price
                </Text>
              </View>
            </View>
          </Card>
        );

      case 4:
        return (
          <Card style={styles.stepCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Product Images
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Add photos to showcase your product
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
                
                {images.length > 0 ? (
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
                        {index === 0 && (
                          <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyImageContainer, { borderColor: colors.border }]}>
                    <Ionicons name="images" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyImageText, { color: colors.textSecondary }]}>
                      Add up to 5 images
                    </Text>
                    <Text style={[styles.emptyImageSubtext, { color: colors.textTertiary }]}>
                      The first image will be the cover image
                    </Text>
                  </View>
                )}
              </View>
              {errors.images && (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.images}
                </Text>
              )}

              <View style={styles.imageTipsContainer}>
                <View style={styles.tipHeader}>
                  <Ionicons name="camera" size={20} color={colors.info} />
                  <Text style={[styles.tipTitle, { color: colors.text }]}>Photo Tips</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  • Take photos in good lighting{'\n'}
                  • Show the item from multiple angles{'\n'}
                  • Include close-ups of any details or defects{'\n'}
                  • Use a neutral background
                </Text>
              </View>
            </View>
          </Card>
        );

      default:
        return null;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch(category) {
      case 'Electronics':
        return 'Phones, laptops, tablets, cameras, headphones, and other electronic devices.';
      case 'Books':
        return 'Textbooks, novels, academic materials, study guides, and other reading materials.';
      case 'Fashion':
        return 'Clothing, shoes, accessories, bags, and other fashion items.';
      case 'Services':
        return 'Tutoring, repairs, design work, and other services offered to fellow students.';
      case 'Furniture':
        return 'Desks, chairs, beds, shelves, and other furniture for dorms or apartments.';
      case 'Sports':
        return 'Sports equipment, gym gear, bicycles, and other athletic items.';
      case 'Beauty':
        return 'Cosmetics, skincare, haircare, and other beauty products.';
      case 'Food':
        return 'Meal plans, snacks, kitchen appliances, and other food-related items.';
      case 'Other':
        return 'Items that don\'t fit into the other categories.';
      default:
        return 'Select a category to see more information.';
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill, 
          { 
            backgroundColor: colors.primary, 
            width: `${(currentStep / totalSteps) * 100}%` 
          }
        ]} />
      </View>
      <View style={styles.progressSteps}>
        {[...Array(totalSteps)].map((_, index) => (
          <View 
            key={index}
            style={[
              styles.progressStep,
              { 
                backgroundColor: index < currentStep ? colors.primary : colors.border,
                width: index < currentStep ? 24 : 8
              }
            ]}
          />
        ))}
      </View>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[...Array(totalSteps)].map((_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        
        return (
          <TouchableOpacity 
            key={index}
            style={[
              styles.stepDot,
              { 
                backgroundColor: isActive || isCompleted ? colors.primary : colors.border,
                width: isActive ? 32 : 24,
                height: isActive ? 32 : 24,
              }
            ]}
            onPress={() => {
              // Allow going back to previous steps
              if (stepNumber < currentStep) {
                setCurrentStep(stepNumber);
              }
              // Allow going to completed steps
              else if (isCompleted) {
                setCurrentStep(stepNumber);
              }
            }}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumber}>{stepNumber}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderUploadProgress = () => (
    <View style={styles.uploadProgressContainer}>
      <Text style={[styles.uploadingText, { color: colors.text }]}>
        Uploading images...
      </Text>
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              backgroundColor: colors.primary,
              width: `${progress}%` 
            }
          ]} 
        />
      </View>
      <Text style={[styles.progressPercentage, { color: colors.textSecondary }]}>
        {progress}%
      </Text>
    </View>
  );

  const renderPreview = () => {
    if (currentStep !== 4) return null;
    
    return (
      <Card style={styles.previewCard}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>
          Preview
        </Text>
        
        <View style={styles.previewContent}>
          <View style={styles.previewImageContainer}>
            {images.length > 0 ? (
              <Image 
                source={{ uri: images[0] }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.previewImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image" size={32} color={colors.textTertiary} />
              </View>
            )}
            <View style={[styles.previewBadge, { backgroundColor: formData.condition === 'new' ? colors.success : colors.warning }]}>
              <Text style={styles.previewBadgeText}>
                {formData.condition === 'new' ? 'NEW' : 'USED'}
              </Text>
            </View>
          </View>
          
          <View style={styles.previewDetails}>
            <Text style={[styles.previewProductTitle, { color: colors.text }]} numberOfLines={1}>
              {formData.title || 'Product Title'}
            </Text>
            <Text style={[styles.previewPrice, { color: colors.primary }]}>
              ${formData.price || '0.00'}
            </Text>
            <Text style={[styles.previewCategory, { color: colors.textSecondary }]}>
              {formData.category || 'Category'} • {formData.location || 'Location'}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={currentStep === 1 ? () => router.back() : handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Listing</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            {/* Progress Indicator */}
            {renderProgressBar()}

            {/* Step Content */}
            {renderStepContent()}

            {/* Preview (only on last step) */}
            {renderPreview()}

            {/* Upload Progress */}
            {uploading && renderUploadProgress()}

            {/* Navigation Buttons */}
            <View style={styles.actions}>
              {currentStep < totalSteps ? (
                <Button
                  title="Continue"
                  onPress={handleNext}
                  style={styles.continueButton}
                />
              ) : (
                <Button
                  title="Create Listing"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitButton}
                />
              )}
              
              {currentStep > 1 && (
                <Button
                  title="Back"
                  onPress={handleBack}
                  variant="outline"
                  style={styles.backButtonStyle}
                />
              )}
            </View>

            {/* Summary of entered information */}
            {currentStep === totalSteps && (
              <Card style={styles.summaryCard}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  Listing Summary
                </Text>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Title
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formData.title}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Price
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700' }]}>
                    ${formData.price}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formData.category}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Condition
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formData.condition === 'new' ? 'Brand New' : 'Used'}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Location
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formData.location}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Images
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </Text>
                </View>
              </Card>
            )}
          </MotiView>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  backButtonStyle: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  stepDot: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepCard: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: '30%',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '500',
  },
  specificationsTitle: {
    fontSize: 18,
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
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyImageContainer: {
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImageText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyImageSubtext: {
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  continueButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  tipContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#258D36FF', // Amber 100
    borderRadius: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000'
  },
  categoryInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E0F2FE', // Light blue 100
    borderRadius: 8,
  },
  categoryInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingTipsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#DCFCE7', // Green 100
    borderRadius: 8,
  },
  imageTipsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3E8FF', // Purple 100
    borderRadius: 8,
  },
  uploadProgressContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
  },
  previewCard: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewDetails: {
    flex: 1,
  },
  previewProductTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
  },
  summaryCard: {
    marginBottom: 40,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
});