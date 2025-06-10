import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ImageViewerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id, index: initialIndex } = useLocalSearchParams<{ id: string; index?: string }>();
  
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(parseInt(initialIndex || '0', 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProductImages();
    }
  }, [id]);

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('images')
        .eq('id', id)
        .single();

      if (error) throw error;
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching product images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (images.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.noImagesContainer}>
          <Ionicons name="image" size={64} color={colors.textTertiary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={[styles.closeButton, { backgroundColor: colors.surface }]}
        onPress={handleClose}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item, index) => `image-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      />

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.counter}>
        <View style={[styles.counterContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="images" size={16} color={colors.text} />
          <View style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  pagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  counter: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});