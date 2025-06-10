import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: Colors.light.success }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.toast, { borderLeftColor: Colors.light.error }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.light.error} />
        </View>
      )}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: Colors.light.info }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={24} color={Colors.light.info} />
        </View>
      )}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: Colors.light.warning }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={24} color={Colors.light.warning} />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  toast: {
    borderRadius: 12,
    height: 70,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    marginHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  text2: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});

export { toastConfig };