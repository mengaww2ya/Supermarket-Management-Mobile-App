import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  Switch,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import CountryPicker from 'react-native-country-picker-modal';

// Contact methods data and configuration
const CONTACT_METHODS = [
  { 
    id: 'phone', 
    label: 'Phone Number', 
    icon: 'call',
    iconColor: '#10b981',
    placeholder: '(123) 456-7890',
    validationRegex: /^[0-9\s\-\(\)]{10,15}$/,
    errorMessage: 'Please enter a valid phone number',
    keyboardType: 'phone-pad',
    requiresCountryCode: true
  },
  { 
    id: 'email', 
    label: 'Email Address', 
    icon: 'mail',
    iconColor: '#3b82f6',
    placeholder: 'support@example.com',
    validationRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: 'Please enter a valid email address',
    keyboardType: 'email-address',
    requiresCountryCode: false
  },
  { 
    id: 'whatsapp', 
    label: 'WhatsApp', 
    icon: 'logo-whatsapp',
    iconColor: '#25d366',
    placeholder: '(123) 456-7890',
    validationRegex: /^[0-9\s\-\(\)]{10,15}$/,
    errorMessage: 'Please enter a valid WhatsApp number',
    keyboardType: 'phone-pad',
    requiresCountryCode: true
  },
  { 
    id: 'twitter', 
    label: 'Twitter/X', 
    icon: 'logo-twitter',
    iconColor: '#1da1f2',
    placeholder: '@username',
    validationRegex: /^@?[A-Za-z0-9_]{1,15}$/,
    errorMessage: 'Please enter a valid Twitter handle',
    keyboardType: 'default',
    requiresCountryCode: false
  },
  { 
    id: 'facebook', 
    label: 'Facebook', 
    icon: 'logo-facebook',
    iconColor: '#4267B2',
    placeholder: 'facebook.com/username',
    validationRegex: /^(?:(?:http|https):\/\/)?(?:www.)?facebook.com\/[a-zA-Z0-9.]{5,}/,
    errorMessage: 'Please enter a valid Facebook URL or username',
    keyboardType: 'url',
    requiresCountryCode: false
  },
  { 
    id: 'instagram', 
    label: 'Instagram', 
    icon: 'logo-instagram',
    iconColor: '#E1306C',
    placeholder: '@username',
    validationRegex: /^@?[A-Za-z0-9._]{1,30}$/,
    errorMessage: 'Please enter a valid Instagram handle',
    keyboardType: 'default',
    requiresCountryCode: false
  },
  { 
    id: 'telegram', 
    label: 'Telegram', 
    icon: 'paper-plane',
    iconColor: '#0088cc',
    placeholder: '@username or t.me/username',
    validationRegex: /^(?:@[A-Za-z0-9_]{5,32}|t\.me\/[A-Za-z0-9_]{5,32})$/,
    errorMessage: 'Please enter a valid Telegram username',
    keyboardType: 'default',
    requiresCountryCode: false
  },
  { 
    id: 'website', 
    label: 'Website', 
    icon: 'globe',
    iconColor: '#6366f1',
    placeholder: 'https://example.com',
    validationRegex: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
    errorMessage: 'Please enter a valid website URL',
    keyboardType: 'url',
    requiresCountryCode: false
  },
];

export default function AddContactMethods() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedMethods, setSavedMethods] = useState([]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    callingCode: ['1'],
    cca2: 'US',
    flag: '🇺🇸',
    name: 'United States'
  });
  
  // Animation values
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // You can add animations when keyboard appears
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // You can add animations when keyboard hides
    });

    // Initial animation
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

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Toggle dropdown animation
  const toggleDropdown = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setDropdownOpen(!dropdownOpen);
    
    Animated.timing(dropdownAnimation, {
      toValue: dropdownOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Reset the form
  const resetForm = () => {
    setSelectedMethod(null);
    setValue('');
    setDescription('');
    setIsActive(true);
    setIsPrimary(false);
    setError('');
  };
  
  // Handle method selection from dropdown
  const handleSelectMethod = (method) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
    setDropdownOpen(false);
    setValue('');
    setError('');
    
    // Animate dropdown closing
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Validate the input value
  const validateInput = () => {
    if (!selectedMethod) {
      setError('Please select a contact method');
      return false;
    }
    
    if (!value.trim()) {
      setError(`Please enter a ${selectedMethod.label}`);
      return false;
    }
    
    // Special validation for phone numbers
    if (selectedMethod.requiresCountryCode) {
      // Remove any spaces, parentheses, dashes for validation
      const cleanNumber = value.replace(/[\s\-\(\)]/g, '');
      if (cleanNumber.length < 7 || cleanNumber.length > 15 || !/^\d+$/.test(cleanNumber)) {
        setError(`Please enter a valid ${selectedMethod.label.toLowerCase()} with 7-15 digits`);
        return false;
      }
      return true;
    }
    
    // For other methods, use regex validation
    if (!selectedMethod.validationRegex.test(value)) {
      setError(selectedMethod.errorMessage);
      return false;
    }
    
    return true;
  };
  
  // Save the contact method
  const handleSaveMethod = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateInput()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new contact method object
      const newMethod = {
        id: Date.now().toString(),
        type: selectedMethod.id,
        label: selectedMethod.label,
        value: selectedMethod.requiresCountryCode ? `+${selectedCountry.callingCode[0]} ${value}` : value,
        description: description.trim() || `Customer Support ${selectedMethod.label}`,
        isActive,
        isPrimary,
        icon: selectedMethod.icon,
        iconColor: selectedMethod.iconColor,
        countryCode: selectedMethod.requiresCountryCode ? selectedCountry.callingCode[0] : null,
        countryFlag: selectedMethod.requiresCountryCode ? selectedCountry.flag : null,
      };
      
      // Handle primary flag (only one method can be primary)
      if (isPrimary) {
        setSavedMethods(prev => 
          prev.map(method => ({
            ...method,
            isPrimary: false,
          }))
        );
      }
      
      // Add the new method to the list
      setSavedMethods(prev => [...prev, newMethod]);
      
      // Reset the form
      resetForm();
      
      // Success message
      Alert.alert(
        "Success", 
        `${newMethod.label} added successfully!`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error('Error saving contact method:', error);
      setError('Failed to save contact method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a contact method
  const handleDeleteMethod = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Delete Contact Method",
      "Are you sure you want to delete this contact method?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setSavedMethods(prev => prev.filter(method => method.id !== id));
          }
        }
      ]
    );
  };
  
  // Calculate dropdown height based on animation value
  const dropdownHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(CONTACT_METHODS.length * 56, 280)],
  });
  
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
        <Text className="text-lg font-bold text-gray-800">Add Contact Methods</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            className="px-4 pt-4"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Information Card */}
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={22} color="#3b82f6" />
                <Text className="ml-2 text-blue-800 leading-5 flex-1">
                  Add contact methods to make it easier for customers to reach your support team. 
                  Each method can be activated or deactivated as needed.
                </Text>
              </View>
            </View>
            
            {/* Contact Method Form */}
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-4">Add New Contact Method</Text>
              
              {/* Contact Method Dropdown */}
              <Text className="text-sm font-medium text-gray-700 mb-1">Method Type*</Text>
              <View className="mb-4">
                <TouchableOpacity
                  onPress={toggleDropdown}
                  className="flex-row items-center justify-between border border-gray-300 rounded-lg p-3 bg-white"
                >
                  {selectedMethod ? (
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: selectedMethod.iconColor + '15' }}>
                        <Ionicons name={selectedMethod.icon} size={18} color={selectedMethod.iconColor} />
                      </View>
                      <Text className="text-gray-800">{selectedMethod.label}</Text>
                    </View>
                  ) : (
                    <Text className="text-gray-500">Select contact method</Text>
                  )}
                  <Ionicons 
                    name={dropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
                
                {/* Dropdown Options */}
                <Animated.View 
                  className="border border-gray-200 rounded-lg mt-1 bg-white overflow-hidden z-10"
                  style={{ maxHeight: dropdownHeight }}
                >
                  <ScrollView nestedScrollEnabled>
                    {CONTACT_METHODS.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        onPress={() => handleSelectMethod(method)}
                        className={`flex-row items-center p-3 border-b border-gray-100 ${
                          selectedMethod?.id === method.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: method.iconColor + '15' }}>
                          <Ionicons name={method.icon} size={18} color={method.iconColor} />
                        </View>
                        <Text className={`${selectedMethod?.id === method.id ? 'text-blue-600 font-medium' : 'text-gray-800'}`}>
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              </View>
              
              {/* Contact Value Input */}
              {selectedMethod && (
                <>
                  <Text className="text-sm font-medium text-gray-700 mb-1">{selectedMethod.label} Value*</Text>
                  <View className="mb-4">
                    {selectedMethod.requiresCountryCode ? (
                      <View className="flex-row items-center">
                        {/* Country Code Dropdown */}
                        <TouchableOpacity
                          onPress={() => setCountryPickerVisible(true)}
                          className="flex-row items-center justify-between border border-gray-300 rounded-lg p-3 bg-white mr-2"
                          style={{ width: 110 }}
                        >
                          <View className="flex-row items-center">
                            <Text className="text-gray-800 mr-1">{selectedCountry.flag}</Text>
                            <Text className="text-gray-800">+{selectedCountry.callingCode[0]}</Text>
                          </View>
                          <Ionicons 
                            name="chevron-down" 
                            size={18} 
                            color="#6b7280" 
                          />
                        </TouchableOpacity>
                        
                        {/* Phone Number Input */}
                        <View className="flex-row items-center border border-gray-300 rounded-lg px-3 bg-white flex-1">
                          <TextInput
                            className="flex-1 py-3 px-2 text-gray-800"
                            placeholder={selectedMethod.placeholder}
                            value={value}
                            onChangeText={(text) => {
                              setValue(text);
                              setError('');
                            }}
                            keyboardType={selectedMethod.keyboardType}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        
                        {/* Country Picker Modal */}
                        <CountryPicker
                          visible={countryPickerVisible}
                          onClose={() => setCountryPickerVisible(false)}
                          withFilter
                          withFlag
                          withCallingCode
                          withAlphaFilter
                          withEmoji
                          onSelect={(country) => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCountry(country);
                            setCountryPickerVisible(false);
                          }}
                        />
                      </View>
                    ) : (
                      <View className="flex-row items-center border border-gray-300 rounded-lg px-3 bg-white">
                        <Ionicons name={selectedMethod.icon} size={18} color={selectedMethod.iconColor} />
                        <TextInput
                          className="flex-1 py-3 px-2 text-gray-800"
                          placeholder={selectedMethod.placeholder}
                          value={value}
                          onChangeText={(text) => {
                            setValue(text);
                            setError('');
                          }}
                          keyboardType={selectedMethod.keyboardType}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    )}
                  </View>
                  
                  {/* Description */}
                  <Text className="text-sm font-medium text-gray-700 mb-1">Description (Optional)</Text>
                  <View className="mb-4">
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-white"
                      placeholder={`Enter a description for this ${selectedMethod.label.toLowerCase()}`}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </View>
                  
                  {/* Toggles */}
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-gray-700">Active</Text>
                      <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                    
                    <View className="flex-row justify-between items-center py-2">
                      <View>
                        <Text className="text-gray-700">Primary Contact Method</Text>
                        <Text className="text-xs text-gray-500">This will be displayed prominently</Text>
                      </View>
                      <Switch
                        value={isPrimary}
                        onValueChange={setIsPrimary}
                        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>
                  
                  {/* Error Message */}
                  {error ? (
                    <View className="mb-4 bg-red-50 p-3 rounded-lg">
                      <Text className="text-red-600">{error}</Text>
                    </View>
                  ) : null}
                  
                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSaveMethod}
                    disabled={isLoading}
                    className={`py-3 rounded-lg flex-row justify-center items-center ${isLoading ? 'bg-blue-400' : 'bg-blue-600'}`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={20} color="#ffffff" />
                        <Text className="text-white font-semibold ml-2">Save Contact Method</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Saved Contact Methods */}
            {savedMethods.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-800 mb-4">Saved Contact Methods</Text>
                
                {savedMethods.map((method) => (
                  <Animated.View 
                    key={method.id}
                    className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden"
                  >
                    <View className="p-4">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: method.iconColor + '15' }}>
                            <Ionicons name={method.icon} size={20} color={method.iconColor} />
                          </View>
                          <View>
                            <View className="flex-row items-center">
                              <Text className="font-bold text-gray-800">{method.label}</Text>
                              {method.isPrimary && (
                                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded">
                                  <Text className="text-blue-700 text-xs">Primary</Text>
                                </View>
                              )}
                              {!method.isActive && (
                                <View className="ml-2 bg-gray-100 px-2 py-0.5 rounded">
                                  <Text className="text-gray-600 text-xs">Inactive</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-gray-600 font-medium">
                              {(method.type === 'phone' || method.type === 'whatsapp') && (
                                <Text>
                                  <Text>{method.countryFlag} </Text>
                                  <Text className="text-gray-500">+{method.countryCode}</Text>
                                  <Text> {method.value.split(' ').slice(1).join(' ')}</Text>
                                </Text>
                              )}
                              {method.type !== 'phone' && method.type !== 'whatsapp' && method.value}
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteMethod(method.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      
                      {method.description && (
                        <Text className="mt-2 text-sm text-gray-500">{method.description}</Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
