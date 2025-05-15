import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';

const { width } = Dimensions.get('window');

// Mock data for FAQs
const MOCK_FAQS = [
  {
    id: '1',
    category: 'Account & Profile',
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the login screen and tap on "Forgot Password". Enter your email address and follow the instructions sent to your email.',
    mostViewed: true,
    dateCreated: '2023-07-15'
  },
  {
    id: '2',
    category: 'Orders & Delivery',
    question: 'Can I modify my order after placing it?',
    answer: 'You can modify your order within 30 minutes of placing it. Go to "My Orders" section, select the order you want to modify, and tap on "Edit Order" if the option is available.',
    mostViewed: true,
    dateCreated: '2023-08-22'
  },
  {
    id: '3',
    category: 'Payment & Pricing',
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and in some regions, cash on delivery.',
    mostViewed: false,
    dateCreated: '2023-09-05'
  },
  {
    id: '4',
    category: 'Returns & Refunds',
    question: 'How do I return a product?',
    answer: 'To return a product, go to "My Orders", select the order containing the item you wish to return, and tap on "Return Item". Follow the on-screen instructions to complete the return process.',
    mostViewed: true,
    dateCreated: '2023-06-18'
  },
  {
    id: '5',
    category: 'Account & Profile',
    question: 'How can I update my delivery address?',
    answer: 'You can update your delivery address by going to your profile settings, selecting "Addresses", and then editing or adding a new address.',
    mostViewed: false,
    dateCreated: '2023-10-12'
  },
  {
    id: '6',
    category: 'Orders & Delivery',
    question: 'What should I do if my order is delayed?',
    answer: 'If your order is delayed, you can check its status in the "My Orders" section. If it exceeds the estimated delivery time, please contact our customer support through the app or call our helpline.',
    mostViewed: false,
    dateCreated: '2023-08-30'
  },
  {
    id: '7',
    category: 'Payment & Pricing',
    question: 'Why was my payment declined?',
    answer: 'Payments can be declined for various reasons such as insufficient funds, expired card, incorrect card details, or bank security measures. Please ensure your payment information is up-to-date and try again, or use an alternative payment method.',
    mostViewed: false,
    dateCreated: '2023-09-18'
  },
];

// Categories for filtering
const CATEGORIES = [
  'All',
  'Account & Profile',
  'Orders & Delivery',
  'Payment & Pricing',
  'Returns & Refunds',
  'App & Technical Issues',
  'Others'
];

export default function ManageFAQ() {
  const router = useRouter();
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'az', 'za', 'most-viewed'
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const detailSlideAnim = useRef(new Animated.Value(300)).current;
  const detailFadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Simulate loading data from API
    const loadData = async () => {
      try {
        // In a real app, fetch FAQs from an API
        setTimeout(() => {
          setFaqs(MOCK_FAQS);
          setFilteredFaqs(MOCK_FAQS);
          setIsLoading(false);
          
          // Start entrance animations
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
        }, 800);
      } catch (error) {
        console.error('Error loading FAQs:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter FAQs based on category and search query
  useEffect(() => {
    let result = [...faqs];
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(faq => faq.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query) || 
          faq.category.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
        break;
      case 'az':
        result.sort((a, b) => a.question.localeCompare(b.question));
        break;
      case 'za':
        result.sort((a, b) => b.question.localeCompare(a.question));
        break;
      case 'most-viewed':
        result.sort((a, b) => (b.mostViewed ? 1 : 0) - (a.mostViewed ? 1 : 0));
        break;
      default:
        break;
    }
    
    setFilteredFaqs(result);
  }, [faqs, selectedCategory, searchQuery, sortBy]);
  
  // Handle FAQ item press - show detail modal
  const handleFaqPress = (faq) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFaq(faq);
    setDetailModalVisible(true);
    
    // Animate modal entrance
    Animated.parallel([
      Animated.timing(detailSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(detailFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Close detail modal
  const closeDetailModal = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.timing(detailSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(detailFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDetailModalVisible(false);
      setSelectedFaq(null);
    });
  };
  
  // Handle delete FAQ
  const handleDeleteFaq = (id) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      "Delete FAQ",
      "Are you sure you want to delete this FAQ? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // In a real app, call API to delete FAQ
            setFaqs(prevFaqs => prevFaqs.filter(faq => faq.id !== id));
            closeDetailModal();
            
            // Show success message
            Alert.alert("Success", "FAQ deleted successfully.");
          }
        }
      ]
    );
  };
  
  // Navigate to Add FAQ screen
  const navigateToAddFaq = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/customeAssistance/addFAQ');
  };
  
  // Render category pills
  const renderCategoryPill = (category) => (
    <TouchableOpacity
      key={category}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(category);
      }}
      className={`px-4 py-2 rounded-full mr-2 ${
        selectedCategory === category 
          ? 'bg-blue-600' 
          : 'bg-gray-100 border border-gray-200'
      }`}
    >
      <Text 
        className={`font-medium ${
          selectedCategory === category 
            ? 'text-white' 
            : 'text-gray-700'
        }`}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
  
  // Render FAQ item
  const renderFaqItem = ({ item }) => (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        className="bg-white mb-3 rounded-xl shadow-sm overflow-hidden"
        onPress={() => handleFaqPress(item)}
        activeOpacity={0.7}
      >
        <View className="p-4">
          {/* Category tag */}
          <View className="mb-2">
            <View className="bg-blue-50 self-start px-2 py-1 rounded">
              <Text className="text-xs font-medium text-blue-700">{item.category}</Text>
            </View>
          </View>
          
          {/* Question */}
          <View className="flex-row items-start mb-2">
            <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2 mt-0.5">
              <Text className="text-xs font-bold text-indigo-600">Q</Text>
            </View>
            <Text className="text-gray-800 font-medium flex-1">{item.question}</Text>
          </View>
          
          {/* Preview of answer */}
          <View className="flex-row ml-8">
            <Text className="text-gray-500 text-sm" numberOfLines={2}>
              {item.answer}
            </Text>
          </View>
          
          {/* Footer with icons */}
          <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-100">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-4">
                {new Date(item.dateCreated).toLocaleDateString()}
              </Text>
              {item.mostViewed && (
                <View className="flex-row items-center">
                  <Ionicons name="eye" size={14} color="#6366f1" />
                  <Text className="text-xs text-indigo-500 ml-1">Most viewed</Text>
                </View>
              )}
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="p-2 -mr-2"
                onPress={() => handleFaqPress(item)}
              >
                <Feather name="more-horizontal" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <HomeHeader title="Manage FAQs" showBackButton />
      
      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
        }}
      >
        <View className="px-4 pt-2">
          {/* Search and actions bar */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 bg-white border border-gray-200 rounded-lg h-11 px-3 mr-2">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search FAQs..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Add FAQ button */}
            <TouchableOpacity 
              className="bg-blue-600 h-11 px-4 rounded-lg items-center justify-center shadow-sm"
              onPress={navigateToAddFaq}
            >
              <View className="flex-row items-center">
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-medium ml-1">Add</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Categories horizontal scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {CATEGORIES.map(category => renderCategoryPill(category))}
          </ScrollView>
          
          {/* Sort options */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-500 text-sm">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
            </Text>
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // In a real app, show a dropdown or modal with sort options
                const nextSort = {
                  'newest': 'oldest',
                  'oldest': 'az',
                  'az': 'za',
                  'za': 'most-viewed',
                  'most-viewed': 'newest'
                };
                setSortBy(nextSort[sortBy]);
              }}
            >
              <Text className="text-gray-700 font-medium mr-1">Sort by:</Text>
              <Text className="text-blue-600 font-medium">
                {sortBy === 'newest' && 'Newest'}
                {sortBy === 'oldest' && 'Oldest'}
                {sortBy === 'az' && 'A-Z'}
                {sortBy === 'za' && 'Z-A'}
                {sortBy === 'most-viewed' && 'Most Viewed'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#3b82f6" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* FAQ list */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-500">Loading FAQs...</Text>
          </View>
        ) : filteredFaqs.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text className="mt-4 text-xl font-semibold text-gray-400">No FAQs Found</Text>
            <Text className="mt-2 text-gray-400 text-center">
              {searchQuery 
                ? `No FAQs match "${searchQuery}"`
                : `No FAQs in the "${selectedCategory}" category`}
            </Text>
            <TouchableOpacity
              className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
              onPress={navigateToAddFaq}
            >
              <Text className="text-white font-semibold">Add New FAQ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredFaqs}
            renderItem={renderFaqItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
      
      {/* FAQ Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDetailModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity 
            className="absolute inset-0"
            onPress={closeDetailModal}
            activeOpacity={1}
          />
          
          <Animated.View
            className="bg-white rounded-t-3xl overflow-hidden max-h-[85%]"
            style={{
              opacity: detailFadeAnim,
              transform: [{ translateY: detailSlideAnim }],
            }}
          >
            {selectedFaq && (
              <>
                <View className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
                  
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <View className="bg-blue-50 self-start px-2.5 py-1 rounded mb-2">
                        <Text className="text-xs font-medium text-blue-700">{selectedFaq.category}</Text>
                      </View>
                      <Text className="text-xl font-bold text-gray-800">{selectedFaq.question}</Text>
                    </View>
                    
                    <View className="flex-row">
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
                        onPress={() => handleDeleteFaq(selectedFaq.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mt-3">
                    <Text className="text-xs text-gray-500 mr-3">
                      Added on {new Date(selectedFaq.dateCreated).toLocaleDateString()}
                    </Text>
                    {selectedFaq.mostViewed && (
                      <View className="flex-row items-center">
                        <Ionicons name="eye" size={14} color="#6366f1" />
                        <Text className="text-xs text-indigo-500 ml-1">Most viewed</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                  <Text className="text-gray-700 leading-6">{selectedFaq.answer}</Text>
                  
                  <View className="h-6" />
                </ScrollView>
                
                <View className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <TouchableOpacity
                    className="flex-row justify-center items-center py-3 bg-blue-600 rounded-lg shadow-sm"
                    onPress={closeDetailModal}
                  >
                    <Text className="text-white font-medium">Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
