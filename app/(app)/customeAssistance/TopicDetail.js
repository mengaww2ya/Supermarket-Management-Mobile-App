import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../components/HomeHeader';

const { width } = Dimensions.get('window');

// Mock data for different topic sections
const TOPIC_CONTENT = {
  returns: [
    {
      id: 'r1',
      question: 'What is your return policy?',
      answer: 'Our standard return policy allows you to return items within 30 days of delivery for a full refund. The item must be in its original condition and packaging. Certain products may have different return policies, which will be noted on the product page.'
    },
    {
      id: 'r2',
      question: 'How do I start a return?',
      answer: 'To start a return, go to "My Orders" in your account, select the order containing the item you wish to return, and click "Return Item". Follow the on-screen instructions to generate a return label and choose your refund method.'
    },
    {
      id: 'r3',
      question: 'Are return shipping costs covered?',
      answer: 'Return shipping is free for items that are defective, damaged, or incorrect. For other returns, a shipping fee may be deducted from your refund unless you return the item to one of our physical stores.'
    },
    {
      id: 'r4',
      question: 'How long does it take to process a refund?',
      answer: 'Once we receive your returned item, it typically takes 3-5 business days to process the return. Refunds to your original payment method may take an additional 5-10 business days to appear, depending on your financial institution.'
    },
    {
      id: 'r5',
      question: 'Can I exchange an item instead of returning it?',
      answer: 'Yes, you can exchange items for a different size, color, or model. Start the return process and select "Exchange" instead of "Return" when prompted. Note that exchanges are subject to availability.'
    }
  ],
  shipping: [
    {
      id: 's1',
      question: 'What shipping options are available?',
      answer: 'We offer several shipping options: Standard (3-5 business days), Express (2 business days), and Next Day (1 business day). Available shipping methods will be shown during checkout.'
    },
    {
      id: 's2',
      question: 'How much does shipping cost?',
      answer: 'Shipping costs vary based on the delivery method, destination, and order total. Standard shipping is free for orders over $35. Exact shipping costs will be calculated at checkout before you complete your purchase.'
    },
    {
      id: 's3',
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to select international destinations. International shipping rates and delivery times vary by country. Please note that international orders may be subject to import duties and taxes.'
    },
    {
      id: 's4',
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a shipping confirmation email with a tracking number. You can also track your order by logging into your account and viewing the order details under "My Orders".'
    },
    {
      id: 's5',
      question: 'What if my package is damaged or lost?',
      answer: 'If your package arrives damaged, please take photos and contact our customer service team within 48 hours. For lost packages, please wait until after the estimated delivery date before contacting us. We\'ll work with the carrier to locate your package or process a replacement.'
    }
  ],
  payment: [
    {
      id: 'p1',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and store gift cards. For select items, we also offer financing options through our partners.'
    },
    {
      id: 'p2',
      question: 'Is it safe to use my credit card on your website?',
      answer: 'Yes, our website uses industry-standard SSL encryption to protect your payment information. We are PCI DSS compliant and never store complete credit card details on our servers.'
    },
    {
      id: 'p3',
      question: 'When will my credit card be charged?',
      answer: 'Your credit card will be authorized when you place your order but won\'t be charged until your order ships. For pre-orders or backordered items, your card will be charged when the item is ready to ship.'
    },
    {
      id: 'p4',
      question: 'Do you offer financing options?',
      answer: 'Yes, we offer financing through our partner financial institutions for purchases over $299. You can apply during checkout to see if you qualify. Promotional financing options like 0% APR for 6-12 months are frequently available.'
    },
    {
      id: 'p5',
      question: 'What if I notice an incorrect charge?',
      answer: 'If you notice an incorrect charge, please contact our customer service team immediately. We\'ll investigate the issue and resolve it promptly, including processing any necessary refunds.'
    }
  ],
  account: [
    {
      id: 'a1',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Account" icon in the top right corner of the app and select "Sign Up". You can create an account using your email address, or sign in with Google, Apple, or Facebook for faster access.'
    },
    {
      id: 'a2',
      question: 'I forgot my password. How do I reset it?',
      answer: 'To reset your password, go to the login screen and tap "Forgot Password". Enter the email address associated with your account, and we\'ll send you a password reset link that will be valid for 24 hours.'
    },
    {
      id: 'a3',
      question: 'How do I update my personal information?',
      answer: 'You can update your personal information by logging into your account, navigating to "Account Settings", and selecting the information you want to update (name, email, phone number, etc.). Remember to save your changes before exiting.'
    },
    {
      id: 'a4',
      question: 'Can I have multiple addresses saved to my account?',
      answer: 'Yes, you can save multiple shipping and billing addresses to your account. Go to "Account Settings" and select "Addresses" to add, edit, or remove addresses. You can also designate a default address for faster checkout.'
    },
    {
      id: 'a5',
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to "Account Settings" and select "Privacy & Data". There you\'ll find the option to "Delete Account". Please note that account deletion is permanent and will remove all your data, including order history and saved addresses.'
    }
  ]
};

// Categories available for selection
const ALL_CATEGORIES = [
  { id: 'returns', name: 'Return Policy', icon: 'refresh-circle', color: '#4f46e5' },
  { id: 'shipping', name: 'Shipping Info', icon: 'cube', color: '#0891b2' },
  { id: 'payment', name: 'Payment Methods', icon: 'card', color: '#0ea5e9' },
  { id: 'account', name: 'Account Help', icon: 'person-circle', color: '#8b5cf6' }
];

export default function TopicDetail() {
  const router = useRouter();
  const { topicId, title, section: initialSection } = useLocalSearchParams();
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState(initialSection || 'returns');
  const [isManageMode, setIsManageMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentFaq, setCurrentFaq] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [localFaqs, setLocalFaqs] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Initialize local FAQs data from the mock data
  useEffect(() => {
    setLocalFaqs({...TOPIC_CONTENT});
  }, []);
  
  // Update when section changes via URL
  useEffect(() => {
    if (initialSection && ALL_CATEGORIES.some(cat => cat.id === initialSection)) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);
  
  // Filtered FAQs based on search query and current section
  const filteredFaqs = React.useMemo(() => {
    if (!localFaqs[currentSection]) return [];
    
    if (!searchQuery.trim()) {
      return localFaqs[currentSection];
    }
    
    const query = searchQuery.toLowerCase();
    return localFaqs[currentSection].filter(
      faq => faq.question.toLowerCase().includes(query) || 
             faq.answer.toLowerCase().includes(query)
    );
  }, [localFaqs, currentSection, searchQuery]);
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const toggleExpanded = (id) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
    
    setExpanded(expanded === id ? null : id);
  };
  
  const handleCategoryChange = (category) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
    
    // Update URL with the new category
    const categoryObj = ALL_CATEGORIES.find(cat => cat.id === category);
    router.replace({
      pathname: '/customeAssistance/TopicDetail',
      params: { 
        section: category,
        title: categoryObj?.name || title
      }
    });
    
    setCurrentSection(category);
    setSearchQuery('');
    setExpanded(null);
  };
  
  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
    setExpanded(null);
  };
  
  const handleAddFaq = () => {
    setCurrentFaq(null);
    setEditedQuestion('');
    setEditedAnswer('');
    setAddMode(true);
    setEditModalVisible(true);
  };
  
  const handleEditFaq = (faq) => {
    setCurrentFaq(faq);
    setEditedQuestion(faq.question);
    setEditedAnswer(faq.answer);
    setAddMode(false);
    setEditModalVisible(true);
  };
  
  const handleDeleteFaq = (faqId) => {
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
            // Remove the FAQ from local state
            setLocalFaqs(prev => ({
              ...prev,
              [currentSection]: prev[currentSection].filter(faq => faq.id !== faqId)
            }));
            
            // Provide feedback
            if (Platform.OS === 'ios') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (e) {
                Vibration.vibrate(20);
              }
            } else {
              Vibration.vibrate(20);
            }
          }
        }
      ]
    );
  };
  
  const handleSaveFaq = () => {
    if (!editedQuestion.trim() || !editedAnswer.trim()) {
      Alert.alert("Error", "Question and answer are required");
      return;
    }
    
    if (addMode) {
      // Generate a new ID for the new FAQ
      const newId = `${currentSection[0]}${Date.now()}`;
      
      // Add new FAQ
      setLocalFaqs(prev => ({
        ...prev,
        [currentSection]: [
          ...prev[currentSection],
          {
            id: newId,
            question: editedQuestion,
            answer: editedAnswer
          }
        ]
      }));
    } else {
      // Update existing FAQ
      setLocalFaqs(prev => ({
        ...prev,
        [currentSection]: prev[currentSection].map(faq => 
          faq.id === currentFaq.id 
            ? { ...faq, question: editedQuestion, answer: editedAnswer }
            : faq
        )
      }));
    }
    
    // Close modal and reset form
    setEditModalVisible(false);
    setCurrentFaq(null);
    setEditedQuestion('');
    setEditedAnswer('');
    setAddMode(false);
    
    // Provide feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
  };
  
  const getCurrentCategory = () => {
    return ALL_CATEGORIES.find(cat => cat.id === currentSection) || ALL_CATEGORIES[0];
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <HomeHeader 
        title={isManageMode ? "Manage Topic FAQs" : (title || getCurrentCategory().name)}
        showBackButton 
        rightIcon={isManageMode ? { name: "create-outline", onPress: handleAddFaq } : null}
      />
      
      <Animated.ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Management Toggle */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-bold text-gray-900">Topics</Text>
          <TouchableOpacity 
            className={`px-3 py-1 rounded-full ${
              isManageMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            onPress={toggleManageMode}
          >
            <Text className={isManageMode ? 'text-white text-xs' : 'text-gray-700 text-xs'}>
              {isManageMode ? "Managing" : "Manage"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Category Navigation Cards */}
        <View className="mb-5">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {ALL_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryChange(category.id)}
                className={`mr-2 bg-white rounded-xl shadow-sm overflow-hidden
                  ${currentSection === category.id ? 'border-2' : 'border'}`}
                style={{
                  borderColor: currentSection === category.id ? category.color : '#e5e7eb',
                  width: width * 0.28,
                }}
              >
                <View className="p-2.5">
                  <Text 
                    className="font-semibold text-gray-800" 
                    style={{ color: currentSection === category.id ? category.color : '#1f2937' }}
                  >
                    {category.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {localFaqs[category.id]?.length || 0} FAQs
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Quick Filters */}
        <View className="mb-3">
          <View className="flex-row flex-wrap">
            {currentSection === 'returns' && (
              <>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('policy')}
                >
                  <Text className="text-gray-700 text-xs">Return Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('refund')}
                >
                  <Text className="text-gray-700 text-xs">Refunds</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('exchange')}
                >
                  <Text className="text-gray-700 text-xs">Exchanges</Text>
                </TouchableOpacity>
              </>
            )}
            {currentSection === 'shipping' && (
              <>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('track')}
                >
                  <Text className="text-gray-700 text-xs">Tracking</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('cost')}
                >
                  <Text className="text-gray-700 text-xs">Shipping Cost</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('international')}
                >
                  <Text className="text-gray-700 text-xs">International</Text>
                </TouchableOpacity>
              </>
            )}
            {currentSection === 'payment' && (
              <>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('credit card')}
                >
                  <Text className="text-gray-700 text-xs">Credit Cards</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('financing')}
                >
                  <Text className="text-gray-700 text-xs">Financing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('paypal')}
                >
                  <Text className="text-gray-700 text-xs">PayPal</Text>
                </TouchableOpacity>
              </>
            )}
            {currentSection === 'account' && (
              <>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('password')}
                >
                  <Text className="text-gray-700 text-xs">Password</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('delete')}
                >
                  <Text className="text-gray-700 text-xs">Account Deletion</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-2"
                  onPress={() => setSearchQuery('address')}
                >
                  <Text className="text-gray-700 text-xs">Addresses</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-lg mb-4 px-3 border border-gray-200">
          <TextInput
            className="flex-1 py-2 text-gray-800"
            placeholder="Search this topic..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Topic header */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-2">{getCurrentCategory().name}</Text>
          
          <Text className="text-gray-600 text-sm">
            {currentSection === 'returns' ? 
              'Information about our return policies, processes, and frequently asked questions.' :
            currentSection === 'shipping' ? 
              'Details about shipping methods, costs, tracking, and delivery timeframes.' :
            currentSection === 'payment' ? 
              'Information about payment options, security, and billing processes.' :
            'Help with account creation, management, and security features.'}
          </Text>
          
          {/* Show result count */}
          <View className="mt-3 pt-2 border-t border-gray-100">
            <Text className="text-xs text-gray-500">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          </View>
        </View>
        
        {/* FAQ accordion */}
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              className={`bg-white rounded-xl mb-3 overflow-hidden shadow-sm ${
                expanded === faq.id ? 'border-l-4' : ''
              }`}
              style={{
                borderLeftColor: expanded === faq.id ? getCurrentCategory().color : 'transparent'
              }}
              activeOpacity={0.7}
              onPress={() => toggleExpanded(faq.id)}
            >
              <View className="p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-start flex-1 pr-3">
                    <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-xs font-bold text-blue-600">Q</Text>
                    </View>
                    <Text className="text-gray-800 font-medium flex-1">{faq.question}</Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    {isManageMode && (
                      <>
                        <TouchableOpacity 
                          className="p-2"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditFaq(faq);
                          }}
                        >
                          <Ionicons name="create-outline" size={18} color="#4b5563" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          className="p-2"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteFaq(faq.id);
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    )}
                    <Ionicons 
                      name={expanded === faq.id ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#64748b" 
                    />
                  </View>
                </View>
                
                {expanded === faq.id && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row">
                      <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3 mt-0.5">
                        <Text className="text-xs font-bold text-green-600">A</Text>
                      </View>
                      <Text className="text-gray-600 flex-1 text-sm">{faq.answer}</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <Ionicons name="search" size={60} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-base">No FAQs found</Text>
            <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
              {searchQuery ? `No results matching "${searchQuery}"` : 'No FAQs available for this topic'}
            </Text>
            {isManageMode && (
              <TouchableOpacity 
                className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
                onPress={handleAddFaq}
              >
                <Text className="text-white font-semibold">Add New FAQ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Add FAQ Button (in manage mode) */}
        {isManageMode && filteredFaqs.length > 0 && (
          <TouchableOpacity
            className="bg-blue-100 rounded-xl p-3 items-center justify-center mb-3"
            onPress={handleAddFaq}
          >
            <Text className="text-blue-600 font-medium">Add New FAQ</Text>
          </TouchableOpacity>
        )}
        
        {/* "See All Categories" button for navigation (not in manage mode) */}
        {!isManageMode && !searchQuery && (
          <View className="bg-white rounded-xl p-4 flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-gray-800 font-semibold mb-1">Browse all topics</Text>
              <Text className="text-gray-600 text-sm">Explore other FAQ categories</Text>
            </View>
            <TouchableOpacity 
              className="bg-gray-200 py-2 px-4 rounded-lg"
              onPress={() => router.push('/customeAssistance/homePage')}
            >
              <Text className="text-gray-800 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Contact support section (not in manage mode) */}
        {!isManageMode && (
          <View className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-blue-800 font-semibold mb-1">Need more help?</Text>
              <Text className="text-blue-600 text-sm">Contact our support team for assistance</Text>
            </View>
            <TouchableOpacity 
              className="bg-blue-600 py-2 px-4 rounded-lg"
              onPress={() => router.push('/customeAssistance/(tabs)')}
            >
              <Text className="text-white font-medium">Contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
      
      {/* Edit/Add FAQ Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-6 pb-8 px-4 max-h-[80%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {addMode ? "Add New FAQ" : "Edit FAQ"}
            </Text>
            
            <Text className="text-sm font-medium text-gray-700 mb-1">Question</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-white mb-4"
              placeholder="Enter question..."
              value={editedQuestion}
              onChangeText={setEditedQuestion}
              multiline
            />
            
            <Text className="text-sm font-medium text-gray-700 mb-1">Answer</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-white mb-6 h-32"
              placeholder="Enter answer..."
              value={editedAnswer}
              onChangeText={setEditedAnswer}
              multiline
              textAlignVertical="top"
            />
            
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 py-3 bg-gray-200 rounded-lg mr-2"
                onPress={() => setEditModalVisible(false)}
              >
                <Text className="text-gray-800 font-medium text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 py-3 bg-blue-600 rounded-lg ml-2"
                onPress={handleSaveFaq}
              >
                <Text className="text-white font-medium text-center">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 