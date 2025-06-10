import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DatabaseService } from '@/lib/database';
import { Address } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function AddressesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postal_code: '',
    type: 'home',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await DatabaseService.getAddresses(user?.id || '');
      if (error) throw new Error(error);
      setAddresses(data || []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load addresses',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    
    if (!newAddress.name || !newAddress.address_line_1 || !newAddress.city) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setSaving(true);
    
    try {
      const { data, error } = await DatabaseService.createAddress({
        ...newAddress as Omit<Address, 'id' | 'created_at' | 'updated_at'>,
        user_id: user.id,
      });
      
      if (error) throw new Error(error);
      
      if (data) {
        setAddresses(prev => [data, ...prev]);
        setNewAddress({
          name: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          postal_code: '',
          type: 'home',
          is_default: false,
        });
        setShowAddForm(false);
        
        Toast.show({
          type: 'success',
          text1: 'Address Added',
          text2: 'Your address has been added successfully',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to add address',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const { error } = await DatabaseService.updateAddress(addressId, { is_default: true });
      
      if (error) throw new Error(error);
      
      setAddresses(prev => 
        prev.map(address => ({
          ...address,
          is_default: address.id === addressId
        }))
      );
      
      Toast.show({
        type: 'success',
        text1: 'Default Updated',
        text2: 'Default address has been updated',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update default address',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await DatabaseService.deleteAddress(addressId);
              
              if (error) throw new Error(error);
              
              setAddresses(prev => prev.filter(address => address.id !== addressId));
              
              Toast.show({
                type: 'success',
                text1: 'Address Deleted',
                text2: 'Your address has been deleted',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete address',
              });
            }
          }
        },
      ]
    );
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return 'home';
      case 'dorm':
        return 'school';
      default:
        return 'location';
    }
  };

  const getAddressColor = (type: string) => {
    switch (type) {
      case 'home':
        return colors.primary;
      case 'dorm':
        return colors.info;
      default:
        return colors.warning;
    }
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Addresses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
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
          {/* Info Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                About Addresses
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Add addresses for campus meetups and deliveries. Your addresses are only shared with sellers when you place an order.
            </Text>
          </Card>

          {/* Add Address Form */}
          {showAddForm && (
            <Card style={styles.addForm}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  Add New Address
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.typeSelector}>
                <Text style={[styles.typeLabel, { color: colors.text }]}>
                  Address Type
                </Text>
                {/* Add type selector buttons here */}
              </View>
            </Card>
          )}
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  addForm: {
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
});