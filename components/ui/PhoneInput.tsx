import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Country, CountryPicker, DEFAULT_COUNTRY } from './CountryPicker';
interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  error?: string;
  style?: any;
}

export function PhoneInput({
  label,
  placeholder = "Enter phone number",
  value,
  onChangeText,
  onChangeCountry,
  error,
  style,
}: PhoneInputProps) {
  const { colors } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [isFocused, setIsFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChangeCountry?.(country);
    setModalVisible(false);
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on country (basic formatting for common patterns)
    if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
      // Format: (123) 456-7890
      if (cleaned.length >= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      } else if (cleaned.length >= 3) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      }
    } else if (selectedCountry.code === 'ZW') {
      // Format: 77 123 4567
      if (cleaned.length >= 5) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)}`;
      } else if (cleaned.length >= 2) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      }
    }
    
    return cleaned;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.surface,
          borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
        }
      ]}>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={[styles.dialCode, { color: colors.text }]}>
            {selectedCountry.dialCode}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="phone-pad"
          autoCorrect={false}
          textContentType="telephoneNumber"
        />
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      )}
      
      <Text style={[styles.fullNumber, { color: colors.textTertiary }]}>
        Full number: {selectedCountry.dialCode} {value}
      </Text>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Country
            </Text>
            <View style={styles.placeholder} />
          </View>

          <CountryPicker
            selectedCountry={selectedCountry}
            onSelectCountry={handleCountrySelect}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    minWidth: 100,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  fullNumber: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
});