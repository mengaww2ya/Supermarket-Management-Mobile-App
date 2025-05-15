import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../components/HomeHeader';

// Categories for dropdown
const CATEGORIES = [
  'Account & Profile',
  'Orders & Delivery',
  'Payment & Pricing',
  'Returns & Refunds',
  'App & Technical Issues',
  'Others'
];

export default function AddFAQ() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  
  // Start entrance animations
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Toggle category dropdown
  const toggleCategoryDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCategoryDropdown(!showCategoryDropdown);
    
    Animated.timing(dropdownAnim, {
      toValue: showCategoryDropdown ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Select a category
  const selectCategory = (selectedCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(selectedCategory);
    setShowCategoryDropdown(false);
    setErrors({ ...errors, category: null });
    
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!question.trim()) {
      newErrors.question = 'Question is required';
    } else if (question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters long';
    }
    
    if (!answer.trim()) {
      newErrors.answer = 'Answer is required';
    } else if (answer.length < 20) {
      newErrors.answer = 'Answer must be at least 20 characters long';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, call API to add new FAQ
      
      Alert.alert(
        "Success",
        "FAQ added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to FAQ list
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding FAQ:', error);
      Alert.alert("Error", "Failed to add FAQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <HomeHeader title="Add New FAQ" showBackButton />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 30 }}
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="px-4 pt-2">
            {/* Instructions */}
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={22} color="#3b82f6" />
                <Text className="ml-2 text-blue-800 leading-5 flex-1">
                  Add a new FAQ to help customers find answers to common questions. 
                  Clear and concise information helps reduce support requests.
                </Text>
              </View>
            </View>
            
            {/* FAQ Form */}
            <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-5">FAQ Details</Text>
              
              {/* Category Dropdown */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Category*</Text>
                <TouchableOpacity
                  onPress={toggleCategoryDropdown}
                  className={`flex-row items-center justify-between border rounded-lg p-3.5 ${
                    errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={category ? 'text-gray-800' : 'text-gray-400'}>
                    {category || 'Select a category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
                
                {errors.category && (
                  <Text className="text-red-500 text-xs mt-1">{errors.category}</Text>
                )}
                
                {/* Dropdown Options */}
                <Animated.View 
                  className="border border-gray-200 rounded-lg mt-1 bg-white overflow-hidden z-10"
                  style={{
                    maxHeight: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 300],
                    }),
                    opacity: dropdownAnim,
                    marginBottom: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    }),
                  }}
                >
                  <ScrollView nestedScrollEnabled={true} className="max-h-64">
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => selectCategory(cat)}
                        className={`p-3.5 border-b border-gray-100 ${
                          category === cat ? 'bg-blue-50' : ''
                        }`}
                      >
                        <Text 
                          className={`${
                            category === cat ? 'text-blue-600 font-medium' : 'text-gray-800'
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              </View>
              
              {/* Question Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Question*</Text>
                <TextInput
                  className={`border rounded-lg p-3.5 text-gray-800 ${
                    errors.question ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter the FAQ question"
                  placeholderTextColor="#9ca3af"
                  value={question}
                  onChangeText={(text) => {
                    setQuestion(text);
                    if (text.trim().length >= 10) {
                      setErrors({ ...errors, question: null });
                    }
                  }}
                  multiline
                />
                {errors.question && (
                  <Text className="text-red-500 text-xs mt-1">{errors.question}</Text>
                )}
                <Text className="text-gray-500 text-xs mt-1">
                  A clear, concise question that customers might ask. Min 10 characters.
                </Text>
              </View>
              
              {/* Answer Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Answer*</Text>
                <TextInput
                  className={`border rounded-lg p-3.5 text-gray-800 h-40 ${
                    errors.answer ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter the answer to the question"
                  placeholderTextColor="#9ca3af"
                  value={answer}
                  onChangeText={(text) => {
                    setAnswer(text);
                    if (text.trim().length >= 20) {
                      setErrors({ ...errors, answer: null });
                    }
                  }}
                  multiline
                  textAlignVertical="top"
                />
                {errors.answer && (
                  <Text className="text-red-500 text-xs mt-1">{errors.answer}</Text>
                )}
                <Text className="text-gray-500 text-xs mt-1">
                  Provide a detailed, helpful answer. Min 20 characters.
                </Text>
              </View>
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity
              className={`py-4 rounded-xl ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <View className="flex-row justify-center items-center">
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Add FAQ</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Cancel Button */}
            <TouchableOpacity
              className="py-4 mt-3 rounded-xl border border-gray-300"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text className="text-gray-700 font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
