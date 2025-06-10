import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

export function ReportSheet({ visible, onClose, onSubmit }: ReportSheetProps) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { id: 'inappropriate', label: 'Inappropriate Content', icon: 'warning' },
    { id: 'fake', label: 'Fake Product', icon: 'close-circle' },
    { id: 'spam', label: 'Spam', icon: 'mail' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setSubmitting(true);
    try {
      await onSubmit(selectedReason, details);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <MotiView
          from={{ translateY: 1000 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 1000 }}
          transition={{ type: 'timing', duration: 300 }}
          style={[styles.sheet, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Report Product
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Why are you reporting this product?
            </Text>

            <View style={styles.reasonsList}>
              {reasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    { 
                      backgroundColor: selectedReason === reason.id ? colors.primary + '20' : colors.surface,
                      borderColor: selectedReason === reason.id ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <View style={styles.reasonLeft}>
                    <View style={[styles.reasonIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name={reason.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.reasonLabel, { color: colors.text }]}>
                      {reason.label}
                    </Text>
                  </View>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedReason && (
              <View style={styles.detailsContainer}>
                <Text style={[styles.detailsLabel, { color: colors.text }]}>
                  Additional Details (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.detailsInput,
                    { 
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  placeholder="Please provide any additional information that will help us understand the issue..."
                  placeholderTextColor={colors.textTertiary}
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: selectedReason ? colors.primary : colors.border,
                  opacity: selectedReason ? 1 : 0.5,
                }
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Submit Report
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 24,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  detailsInput: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  sheetFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 