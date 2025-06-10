import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CountryPicker, Country, DEFAULT_COUNTRY } from './CountryPicker';

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

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChangeCountry?.(country);
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
        <CountryPicker
          selectedCountry={selectedCountry}
          onSelectCountry={handleCountrySelect}
          style={styles.countryPicker}
        />
        
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
  countryPicker: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
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
});