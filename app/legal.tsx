import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function LegalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const termsContent = `
Last updated: January 1, 2025

1. ACCEPTANCE OF TERMS
By accessing and using Campus Market, you accept and agree to be bound by the terms and provision of this agreement.

2. DESCRIPTION OF SERVICE
Campus Market is a peer-to-peer marketplace platform designed specifically for university students to buy and sell items within their campus community.

3. USER ACCOUNTS
- You must be a verified student to use certain features
- You are responsible for maintaining the confidentiality of your account
- You must provide accurate and complete information

4. PROHIBITED ACTIVITIES
- Posting illegal or inappropriate content
- Fraudulent activities or misrepresentation
- Harassment or abuse of other users
- Violation of intellectual property rights

5. TRANSACTIONS
- All transactions are between users directly
- Campus Market is not responsible for the quality or delivery of items
- Users are responsible for their own safety during meetups

6. CONTENT POLICY
- Users retain ownership of their content
- Campus Market reserves the right to remove inappropriate content
- Respect intellectual property rights

7. LIMITATION OF LIABILITY
Campus Market shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

8. TERMINATION
We reserve the right to terminate or suspend accounts that violate these terms.

9. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Users will be notified of significant changes.

10. CONTACT INFORMATION
For questions about these terms, contact us at legal@campusmarket.com
  `;

  const privacyContent = `
Last updated: January 1, 2025

1. INFORMATION WE COLLECT
- Account information (name, email, university)
- Profile information (photos, bio, preferences)
- Usage data (app interactions, search history)
- Device information (device type, operating system)

2. HOW WE USE YOUR INFORMATION
- To provide and improve our services
- To verify student status
- To facilitate transactions between users
- To send important notifications
- To ensure platform safety and security

3. INFORMATION SHARING
- We do not sell your personal information
- Information may be shared with other users as part of the marketplace
- We may share data with service providers who help operate our platform
- Legal compliance may require information disclosure

4. DATA SECURITY
- We implement industry-standard security measures
- Your data is encrypted in transit and at rest
- We regularly audit our security practices
- No system is 100% secure, and we cannot guarantee absolute security

5. YOUR RIGHTS
- Access your personal information
- Correct inaccurate information
- Delete your account and associated data
- Control privacy settings
- Opt out of non-essential communications

6. STUDENT VERIFICATION
- Student ID photos are used solely for verification
- Verification images are securely stored and not shared
- Only verification status is visible to other users

7. COOKIES AND TRACKING
- We use cookies to improve user experience
- Analytics help us understand app usage
- You can control cookie preferences in your device settings

8. DATA RETENTION
- Account data is retained while your account is active
- Some data may be retained for legal compliance
- Deleted accounts are permanently removed within 30 days

9. CHILDREN'S PRIVACY
- Our service is intended for users 18 and older
- We do not knowingly collect information from children under 18

10. INTERNATIONAL USERS
- Data may be processed in countries other than your own
- We ensure appropriate safeguards for international transfers

11. CHANGES TO PRIVACY POLICY
- We will notify users of material changes
- Continued use constitutes acceptance of changes

12. CONTACT US
For privacy questions, contact us at privacy@campusmarket.com
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Terms & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'terms' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'terms' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'privacy' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'privacy' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Privacy Policy
          </Text>
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
          <Card style={styles.contentCard}>
            <Text style={[styles.contentText, { color: colors.textSecondary }]}>
              {activeTab === 'terms' ? termsContent : privacyContent}
            </Text>
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
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentCard: {
    margin: 20,
    marginBottom: 40,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
});