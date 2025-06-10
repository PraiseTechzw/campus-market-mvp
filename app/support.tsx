import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmitTicket = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
      });
      return;
    }

    setLoading(true);
    
    try {
      // In a real app, you'd submit this to your support system
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Toast.show({
        type: 'success',
        text1: 'Ticket Submitted',
        text2: 'We\'ll get back to you within 24 hours',
      });
      
      setContactForm({ subject: '', message: '' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const supportOptions = [
    {
      icon: 'chatbubbles',
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: () => {
        Toast.show({
          type: 'info',
          text1: 'Coming Soon',
          text2: 'Live chat will be available soon',
        });
      },
    },
    {
      icon: 'mail',
      title: 'Email Support',
      description: 'Send us an email',
      action: () => {
        Linking.openURL('mailto:support@campusmarket.com');
      },
    },
    {
      icon: 'call',
      title: 'Phone Support',
      description: 'Call our support line',
      action: () => {
        Linking.openURL('tel:+1234567890');
      },
    },
  ];

  const faqItems = [
    {
      question: 'How do I verify my student status?',
      answer: 'Go to your profile settings and upload a clear photo of your student ID. Our team will review and verify your account within 24-48 hours.',
    },
    {
      question: 'How do I report a suspicious listing?',
      answer: 'On any product page, tap the flag icon in the top right corner and select the reason for reporting. We take all reports seriously.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We support cash on delivery, EcoCash, and PayNow. Payment is arranged directly between buyers and sellers.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'Go to Profile > Edit Profile > Danger Zone and select "Delete Account". This action cannot be undone.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
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
          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Support
            </Text>
            <View style={styles.supportOptions}>
              {supportOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.title}
                  style={[styles.supportOption, { backgroundColor: colors.surface }]}
                  onPress={option.action}
                >
                  <View style={[styles.supportIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name={option.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.supportContent}>
                    <Text style={[styles.supportTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.supportDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Ticket */}
          <Card style={styles.ticketCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Submit a Support Ticket
            </Text>
            
            <View style={styles.form}>
              <Input
                label="Subject"
                placeholder="Brief description of your issue"
                value={contactForm.subject}
                onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                leftIcon={<Ionicons name="text\" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Message"
                placeholder="Describe your issue in detail"
                value={contactForm.message}
                onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                multiline
                numberOfLines={4}
                leftIcon={<Ionicons name="document-text\" size={20} color={colors.textTertiary} />}
                style={{ height: 100, textAlignVertical: 'top' }}
              />

              <Button
                title="Submit Ticket"
                onPress={handleSubmitTicket}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          </Card>

          {/* FAQ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
            <View style={styles.faqList}>
              {faqItems.map((item, index) => (
                <Card key={index} style={styles.faqItem}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>
                    {item.question}
                  </Text>
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                    {item.answer}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          {/* App Info */}
          <Card style={styles.infoCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              App Information
            </Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Version
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  1.0.0
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Build
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  2025.01.01
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Platform
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  React Native
                </Text>
              </View>
            </View>
          </Card>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  supportOptions: {
    gap: 12,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 14,
  },
  ticketCard: {
    marginBottom: 24,
  },
  form: {
    gap: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    marginBottom: 0,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 40,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});