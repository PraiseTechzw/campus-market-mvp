import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const teamMembers = [
    { name: 'Alex Johnson', role: 'Founder & CEO', icon: 'person' },
    { name: 'Sarah Chen', role: 'CTO', icon: 'code-slash' },
    { name: 'Mike Davis', role: 'Head of Design', icon: 'color-palette' },
    { name: 'Emily Rodriguez', role: 'Community Manager', icon: 'people' },
  ];

  const socialLinks = [
    { name: 'Website', icon: 'globe', url: 'https://campusmarket.com' },
    { name: 'Twitter', icon: 'logo-twitter', url: 'https://twitter.com/campusmarket' },
    { name: 'Instagram', icon: 'logo-instagram', url: 'https://instagram.com/campusmarket' },
    { name: 'LinkedIn', icon: 'logo-linkedin', url: 'https://linkedin.com/company/campusmarket' },
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
        <Text style={[styles.title, { color: colors.text }]}>About</Text>
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
          {/* App Logo & Info */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.heroCard}
          >
            <View style={styles.logoContainer}>
              <Ionicons name="bag-handle" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Campus Market</Text>
            <Text style={styles.appTagline}>
              Your campus marketplace for buying and selling with fellow students
            </Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </LinearGradient>

          {/* Mission */}
          <Card style={styles.missionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Our Mission
            </Text>
            <Text style={[styles.missionText, { color: colors.textSecondary }]}>
              To create a safe, trusted, and convenient marketplace where university students can 
              buy and sell items within their campus community. We believe in fostering connections, 
              promoting sustainability through reuse, and making student life more affordable.
            </Text>
          </Card>

          {/* Features */}
          <Card style={styles.featuresCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Key Features
            </Text>
            <View style={styles.featuresList}>
              {[
                { icon: 'shield-checkmark', title: 'Student Verification', desc: 'Verified student community' },
                { icon: 'chatbubbles', title: 'Direct Messaging', desc: 'Chat with buyers and sellers' },
                { icon: 'search', title: 'Smart Search', desc: 'Find exactly what you need' },
                { icon: 'heart', title: 'Save Items', desc: 'Keep track of favorites' },
                { icon: 'star', title: 'Reviews & Ratings', desc: 'Build trust in the community' },
                { icon: 'notifications', title: 'Real-time Notifications', desc: 'Stay updated on activity' },
              ].map((feature, index) => (
                <View key={feature.title} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name={feature.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Team */}
          <Card style={styles.teamCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Meet the Team
            </Text>
            <View style={styles.teamGrid}>
              {teamMembers.map((member, index) => (
                <View key={member.name} style={styles.teamMember}>
                  <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                    <Ionicons name={member.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.name}
                  </Text>
                  <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                    {member.role}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Social Links */}
          <Card style={styles.socialCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Connect With Us
            </Text>
            <View style={styles.socialLinks}>
              {socialLinks.map((link) => (
                <TouchableOpacity
                  key={link.name}
                  style={[styles.socialLink, { backgroundColor: colors.surface }]}
                  onPress={() => Linking.openURL(link.url)}
                >
                  <Ionicons name={link.icon as any} size={24} color={colors.primary} />
                  <Text style={[styles.socialText, { color: colors.text }]}>
                    {link.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Contact */}
          <Card style={styles.contactCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Get in Touch
            </Text>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              Have questions, feedback, or suggestions? We'd love to hear from you!
            </Text>
            <Button
              title="Contact Support"
              onPress={() => router.push('/support')}
              style={styles.contactButton}
            />
          </Card>

          {/* Legal */}
          <View style={styles.legalSection}>
            <TouchableOpacity onPress={() => router.push('/legal')}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>
                Terms of Service & Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text style={[styles.copyright, { color: colors.textTertiary }]}>
              © 2025 Campus Market. All rights reserved.
            </Text>
          </View>
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
  heroCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  appVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  missionCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresCard: {
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
  },
  teamCard: {
    marginBottom: 24,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  teamMember: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 14,
    textAlign: 'center',
  },
  socialCard: {
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: '47%',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactCard: {
    marginBottom: 24,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  contactButton: {
    width: '100%',
  },
  legalSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 40,
  },
  legalLink: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});