import { supabase } from './supabase';

export class StorageService {
  // Upload avatar image
  static async uploadAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { url: data.publicUrl };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Upload product images
  static async uploadProductImages(userId: string, productId: string, files: File[]): Promise<{ urls?: string[]; error?: string }> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${productId}/image_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      return { urls };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Upload verification document
  static async uploadVerificationDocument(userId: string, file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/verification.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      return { url: data.publicUrl };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Delete file from storage
  static async deleteFile(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get signed URL for private files
  static async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<{ url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return { url: data.signedUrl };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

// Cache management for storage
export const storageCache = {
  async setItem(key: string, value: any) {
    try {
      await AsyncStorage.setItem(`storage_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Storage cache setItem error:', error);
    }
  },

  async getItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(`storage_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage cache getItem error:', error);
      return null;
    }
  },

  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(`storage_${key}`);
    } catch (error) {
      console.error('Storage cache removeItem error:', error);
    }
  }
};