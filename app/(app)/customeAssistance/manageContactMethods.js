import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Animated,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Mock data for contact methods
const INITIAL_CONTACT_METHODS = [
  {
    id: '1',
    type: 'phone',
    label: 'Phone Number',
    value: '+1 (800) 123-4567',
    description: 'Customer Support Hotline',
    isActive: true,
    isPrimary: true,
    icon: 'call',
    iconColor: '#10b981',
    availability: '24/7'
  },
  {
    id: '2',
    type: 'email',
    label: 'Email Address',
    value: 'support@supermarket.com',
    description: 'Customer Support Email',
    isActive: true,
    isPrimary: false,
    icon: 'mail',
    iconColor: '#3b82f6',
    availability: '24/7'
  },
  {
    id: '3',
    type: 'whatsapp',
    label: 'WhatsApp',
    value: '+1 (800) 987-6543',
    description: 'Quick Support via WhatsApp',
    isActive: true,
    isPrimary: false,
    icon: 'logo-whatsapp',
    iconColor: '#25d366',
    availability: '9:00 AM - 8:00 PM'
  },
  {
    id: '4',
    type: 'twitter',
    label: 'Twitter/X',
    value: '@supermarket_support',
    description: 'Social Media Support',
    isActive: false,
    isPrimary: false,
    icon: 'logo-twitter',
    iconColor: '#1da1f2',
    availability: '9:00 AM - 6:00 PM'
  }
];

// Mock data for contact hours
const INITIAL_CONTACT_HOURS = [
  { day: 'Monday - Friday', hours: '8:00 AM - 9:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 7:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 6:00 PM' },
  { day: 'Holidays', hours: '10:00 AM - 4:00 PM' }
];

export default function ManageContactMethods() {
  const router = useRouter();
  const [contactMethods, setContactMethods] = useState(INITIAL_CONTACT_METHODS);
  const [contactHours, setContactHours] = useState(INITIAL_CONTACT_HOURS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('methods');
  const [showModal, setShowModal] = useState(false);
  const [editingHours, setEditingHours] = useState(null);
  const [tempHours, setTempHours] = useState({ day: '', hours: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [draggedMethod, setDraggedMethod] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const searchWidth = useRef(new Animated.Value(width - 32)).current;
  
  // Contact method categories
  const categories = [
    { id: 'all', label: 'All Methods' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'social', label: 'Social Media' },
    { id: 'other', label: 'Others' }
  ];
  
  // Group methods by their type
  const getMethodsByCategory = (category) => {
    if (category === 'all') {
      return filteredMethods;
    } else if (category === 'social') {
      return filteredMethods.filter(method => 
        ['twitter', 'facebook', 'instagram', 'telegram', 'whatsapp'].includes(method.type)
      );
    } else if (category === 'other') {
      return filteredMethods.filter(method => 
        !['phone', 'email', 'twitter', 'facebook', 'instagram', 'telegram', 'whatsapp'].includes(method.type)
      );
    } else {
      return filteredMethods.filter(method => method.type === category);
    }
  };
  
  // Methods for filtered and sorted contact methods
  const filteredMethods = contactMethods.filter(method => 
    method.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const orderedMethods = [...getMethodsByCategory(selectedCategory)].sort((a, b) => {
    // Primary methods first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    
    // Then active methods
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    
    return 0;
  });
  
  // Count methods by category
  const getCategoryCount = (category) => {
    return getMethodsByCategory(category).length;
  };
  
  // Initialize animations
  useEffect(() => {
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
  
  // Animate tab changes
  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'methods' ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);
  
  // Reset category when switching tabs
  useEffect(() => {
    if (activeTab === 'methods') {
      // Short delay to allow animation to complete
      const timer = setTimeout(() => {
        setSelectedCategory('all');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);
  
  const handleTabChange = (tab) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };
  
  const handleCategoryChange = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    
    // Clear search when changing categories for better UX
    if (searchQuery) {
      setSearchQuery('');
    }
  };
  
  const handleToggleActive = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setContactMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, isActive: !method.isActive } 
          : method
      )
    );
  };
  
  const handleTogglePrimary = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setContactMethods(prev => 
      prev.map(method => ({
        ...method,
        isPrimary: method.id === id ? true : false,
      }))
    );
  };
  
  const handleDeleteMethod = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Delete Contact Method",
      "Are you sure you want to delete this contact method? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setContactMethods(prev => prev.filter(method => method.id !== id));
          }
        }
      ]
    );
  };
  
  const handleAddContactMethod = () => {
    router.push('/customeAssistance/addContactMethods');
  };
  
  const handleEditHours = (index) => {
    setEditingHours(index);
    setTempHours(contactHours[index]);
    setShowModal(true);
  };
  
  const handleSaveHours = () => {
    if (!tempHours.day.trim() || !tempHours.hours.trim()) {
      Alert.alert("Invalid Input", "Please fill in both day and hours fields.");
      return;
    }
    
    setContactHours(prev => {
      const updated = [...prev];
      if (editingHours !== null) {
        updated[editingHours] = tempHours;
      } else {
        updated.push(tempHours);
      }
      return updated;
    });
    
    setShowModal(false);
    setEditingHours(null);
    setTempHours({ day: '', hours: '' });
  };
  
  const handleDeleteHours = (index) => {
    Alert.alert(
      "Delete Hours",
      "Are you sure you want to delete these hours?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setContactHours(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };
  
  // Helper functions for search
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Animate search bar width
    Animated.timing(searchWidth, {
      toValue: width - 80,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      // Animate search bar width back
      Animated.timing(searchWidth, {
        toValue: width - 32,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const handleSearchClear = () => {
    setSearchQuery('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If search field has focus, blur it
    Keyboard.dismiss();
    setIsSearchFocused(false);
    
    // Animate search bar width back
    Animated.timing(searchWidth, {
      toValue: width - 32,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const renderMethodsTab = () => (
    <View>
      {/* Search Bar */}
      <View className="mb-4">
        <Animated.View 
          className="flex-row items-center bg-white rounded-full border border-gray-200 px-3"
          style={{ width: searchWidth }}
        >
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 py-2 px-2 text-gray-800"
            placeholder="Search contact methods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleSearchClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {isSearchFocused && (
          <TouchableOpacity 
            className="ml-2 px-3 py-2 absolute right-0"
            onPress={handleSearchClear}
          >
            <Text className="text-blue-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="mb-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
              selectedCategory === category.id 
                ? 'bg-blue-100 border border-blue-200' 
                : 'bg-white border border-gray-200'
            }`}
            onPress={() => handleCategoryChange(category.id)}
          >
            <Text 
              className={`font-medium ${
                selectedCategory === category.id ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {category.label}
            </Text>
            <View 
              className={`ml-2 px-1.5 py-0.5 rounded-full ${
                selectedCategory === category.id ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-xs ${
                selectedCategory === category.id ? 'text-white' : 'text-gray-600'
              }`}>
                {getCategoryCount(category.id)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Contact Methods List */}
      {orderedMethods.length > 0 ? (
        orderedMethods.map((method) => (
          <Animated.View 
            key={method.id}
            className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View className="p-4">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3" 
                    style={{ backgroundColor: method.iconColor + '15' }}
                  >
                    <Ionicons name={method.icon} size={20} color={method.iconColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap">
                      <Text className="font-bold text-gray-800 mr-2">{method.label}</Text>
                      {method.isPrimary && (
                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                          <Text className="text-blue-700 text-xs">Primary</Text>
                        </View>
                      )}
                      {!method.isActive && (
                        <View className="bg-gray-100 px-2 py-0.5 rounded-full ml-1">
                          <Text className="text-gray-600 text-xs">Inactive</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-600 mt-0.5">{method.value}</Text>
                    {method.description && (
                      <Text className="text-gray-500 text-sm">{method.description}</Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-500 text-xs ml-1">Available: {method.availability}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View className="flex-row mt-3 -mx-1">
                <TouchableOpacity 
                  className="flex-1 bg-gray-100 rounded-lg py-2 mx-1 items-center flex-row justify-center"
                  onPress={() => handleToggleActive(method.id)}
                >
                  <Ionicons 
                    name={method.isActive ? "eye-off-outline" : "eye-outline"} 
                    size={16} 
                    color="#4b5563" 
                  />
                  <Text className="text-gray-700 text-sm font-medium ml-1">
                    {method.isActive ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>
                
                {!method.isPrimary && (
                  <TouchableOpacity 
                    className="flex-1 bg-blue-50 rounded-lg py-2 mx-1 items-center flex-row justify-center"
                    onPress={() => handleTogglePrimary(method.id)}
                  >
                    <Ionicons name="star-outline" size={16} color="#2563eb" />
                    <Text className="text-blue-600 text-sm font-medium ml-1">Set Primary</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  className="flex-1 bg-red-50 rounded-lg py-2 mx-1 items-center flex-row justify-center"
                  onPress={() => handleDeleteMethod(method.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  <Text className="text-red-600 text-sm font-medium ml-1">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))
      ) : searchQuery || selectedCategory !== 'all' ? (
        <View className="bg-white rounded-xl p-6 items-center justify-center">
          <Ionicons name="search" size={48} color="#d1d5db" />
          <Text className="text-gray-400 mt-4 text-lg text-center">
            {searchQuery ? 'No contact methods found' : `No ${categories.find(c => c.id === selectedCategory)?.label || ''} methods found`}
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
            {searchQuery 
              ? 'Try a different search term' 
              : `Add a ${selectedCategory === 'social' ? 'social media' : selectedCategory} contact method`
            }
          </Text>
        </View>
      ) : (
        <View className="bg-white rounded-xl p-6 items-center justify-center">
          <Ionicons name="call-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 mt-4 text-lg text-center">No contact methods yet</Text>
          <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
            Add contact methods to help customers reach your support team
          </Text>
        </View>
      )}
      
      {/* Add Contact Method Button */}
      <TouchableOpacity 
        className="bg-blue-600 rounded-lg py-3 px-4 items-center flex-row justify-center mt-4"
        onPress={handleAddContactMethod}
      >
        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">Add New Contact Method</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderHoursTab = () => (
    <View className="mb-6">
      {/* Hours Banner */}
      <View className="bg-purple-50 rounded-xl p-4 mb-4">
        <View className="flex-row items-start">
          <Ionicons name="time-outline" size={22} color="#8b5cf6" />
          <View className="ml-2 flex-1">
            <Text className="text-purple-900 font-medium">Manage Support Hours</Text>
            <Text className="text-purple-700 text-sm mt-1">
              Set the hours when your support team is available to assist customers.
            </Text>
          </View>
        </View>
      </View>
      
      {/* Hours List */}
      <View className="bg-white rounded-xl overflow-hidden shadow-sm mb-4">
        {contactHours.length > 0 ? (
          contactHours.map((item, index) => (
            <View 
              key={index}
              className={`p-4 flex-row items-center justify-between ${
                index < contactHours.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">{item.day}</Text>
                <Text className="text-gray-600">{item.hours}</Text>
              </View>
              
              <View className="flex-row">
                <TouchableOpacity 
                  className="p-2 rounded-full bg-gray-100 mr-2"
                  onPress={() => handleEditHours(index)}
                >
                  <Ionicons name="pencil" size={18} color="#4b5563" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="p-2 rounded-full bg-red-50"
                  onPress={() => handleDeleteHours(index)}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View className="py-8 items-center">
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-lg">No hours set</Text>
            <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
              Add hours to let customers know when support is available
            </Text>
          </View>
        )}
      </View>
      
      {/* Add Hours Button */}
      <TouchableOpacity 
        className="bg-purple-600 rounded-lg py-3 px-4 items-center flex-row justify-center mt-2"
        onPress={() => {
          setEditingHours(null);
          setTempHours({ day: '', hours: '' });
          setShowModal(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">Add New Hours</Text>
      </TouchableOpacity>
      
      {/* Special Notice */}
      <View className="bg-amber-50 rounded-xl p-4 mt-6">
        <View className="flex-row">
          <Ionicons name="alert-circle-outline" size={22} color="#d97706" />
          <View className="ml-2 flex-1">
            <Text className="text-amber-900 font-medium">Special Notice</Text>
            <Text className="text-amber-700 text-sm mt-1">
              Add information about holiday hours, emergency support,
              or any upcoming changes to contact availability.
            </Text>
          </View>
        </View>
        
        <TextInput
          className="bg-white border border-amber-200 rounded-lg p-3 mt-3 text-gray-700"
          placeholder="Enter special notice here..."
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity className="bg-amber-600 rounded-lg py-2 px-4 self-end mt-2">
          <Text className="text-white font-medium">Save Notice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Manage Contact Methods</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Tab Navigation */}
          <View className="mb-6">
            <View className="flex-row bg-gray-100 rounded-xl p-1">
              <TouchableOpacity
                className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'methods' ? 'bg-white' : ''}`}
                onPress={() => handleTabChange('methods')}
                activeOpacity={0.8}
              >
                <Text className={activeTab === 'methods' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Contact Methods
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'hours' ? 'bg-white' : ''}`}
                onPress={() => handleTabChange('hours')}
                activeOpacity={0.8}
              >
                <Text className={activeTab === 'hours' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Contact Hours
                </Text>
              </TouchableOpacity>
              
              {/* Animated Indicator */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    bottom: 10,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#3b82f6',
                    transform: [
                      {
                        translateX: tabIndicatorPosition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [width / 4, width * 3/4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
          
          {/* Tab Content */}
          {activeTab === 'methods' ? renderMethodsTab() : renderHoursTab()}
        </Animated.View>
      </ScrollView>
      
      {/* Hours Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <BlurView intensity={50} className="absolute inset-0">
          <Pressable 
            className="flex-1 justify-center items-center bg-black/30"
            onPress={() => setShowModal(false)}
          >
            <Pressable className="bg-white rounded-xl w-5/6 p-5">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                {editingHours !== null ? 'Edit Hours' : 'Add New Hours'}
              </Text>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Day/Period</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  placeholder="e.g., Monday, Weekdays, Holidays"
                  value={tempHours.day}
                  onChangeText={(text) => setTempHours(prev => ({ ...prev, day: text }))}
                />
              </View>
              
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-1">Hours</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  value={tempHours.hours}
                  onChangeText={(text) => setTempHours(prev => ({ ...prev, hours: text }))}
                />
              </View>
              
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 py-3 bg-gray-200 rounded-lg mr-2 items-center"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 py-3 bg-blue-600 rounded-lg ml-2 items-center"
                  onPress={handleSaveHours}
                >
                  <Text className="font-medium text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}
