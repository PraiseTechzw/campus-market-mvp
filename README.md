# Campus Market - Student Marketplace App

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![License](https://img.shields.io/badge/license-MIT-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.79.3-blue)
![Expo](https://img.shields.io/badge/Expo-53.0.10-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.50.0-green)

Campus Market is a secure, student-focused marketplace app designed specifically for university campuses. It enables students to buy and sell items, connect with fellow students, and build a trusted community through verified student accounts.

## 🌟 Features

- **Student Verification**: Secure student ID verification system
- **Real-time Messaging**: Instant chat with buyers and sellers
- **Push Notifications**: Stay updated on messages, orders, and new listings
- **Secure Transactions**: Safe meetup coordination and payment handling
- **Product Categories**: Organized listings by category (Electronics, Books, Fashion, etc.)
- **User Profiles**: Verified profiles with ratings and reviews
- **Search & Filters**: Find exactly what you need with advanced search
- **Saved Items**: Bookmark products for later
- **Order Management**: Track buying and selling activities
- **Dark Mode Support**: Comfortable viewing in any lighting condition

## 📱 Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <img src="https://via.placeholder.com/200x400" alt="Login Screen" width="200"/>
  <img src="https://via.placeholder.com/200x400" alt="Home Screen" width="200"/>
  <img src="https://via.placeholder.com/200x400" alt="Product Details" width="200"/>
  <img src="https://via.placeholder.com/200x400" alt="Chat Screen" width="200"/>
</div>

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI Components**: Custom components with native styling
- **Navigation**: Expo Router
- **Animations**: Moti, React Native Reanimated
- **Notifications**: Expo Notifications

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/campus-market.git
   cd campus-market
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For Web
   npm run web
   ```

## 📊 Database Schema

The app uses a comprehensive Supabase database schema with the following main tables:

- **users**: User profiles and authentication
- **products**: Product listings with details and images
- **chats**: Conversation threads between buyers and sellers
- **messages**: Individual messages within chats
- **orders**: Transaction records between users
- **notifications**: System and user notifications
- **reviews**: User ratings and feedback

## 🔒 Authentication Flow

1. **Sign Up**: Email/password registration with student email domains
2. **Email Verification**: OTP verification via email
3. **Student ID Verification**: Optional upload of student ID for verification badge
4. **Profile Setup**: University selection and basic profile information

## 📱 App Structure

```
app/
├── (auth)/           # Authentication screens
├── (onboarding)/     # First-time user experience
├── (tabs)/           # Main tab navigation
├── chat/             # Chat screens
├── product/          # Product detail screens
├── profile/          # User profile screens
├── _layout.tsx       # Root layout configuration
```

## 🔄 Real-time Features

- **Live Chat**: Instant messaging between buyers and sellers
- **Notifications**: Real-time alerts for new messages, orders, and activities
- **Product Updates**: Live updates for product availability and pricing

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please contact us at support@campusmarket.com