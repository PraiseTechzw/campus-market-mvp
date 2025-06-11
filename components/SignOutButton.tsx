import { useClerk } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Text, TouchableOpacity } from 'react-native';

export const SignOutButton = () => {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      Linking.openURL(Linking.createURL('/'));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity 
      className="bg-red-500 p-4 rounded-lg"
      onPress={handleSignOut}
    >
      <Text className="text-white text-center font-bold">Sign out</Text>
    </TouchableOpacity>
  );
}; 