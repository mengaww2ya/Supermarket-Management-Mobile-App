import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChatRedirector() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to chatsList when component mounts
    router.replace('/chatsList');
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text className="mt-4 text-gray-500">Redirecting to chats...</Text>
    </View>
  );
} 