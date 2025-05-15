import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-elements';
import { useAuth } from '../context/authContext';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();
  const { registerCustomer, loading } = useAuth();
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;
  const bubble4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start bubble animations
    const startBubbleAnimation = (anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startBubbleAnimation(bubble1Anim);
    startBubbleAnimation(bubble2Anim);
    startBubbleAnimation(bubble3Anim);
    startBubbleAnimation(bubble4Anim);
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validateAddress = (address) => {
    const addressRegex = /^[a-zA-Z\s]+$/;
    return addressRegex.test(address);
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: hasMinLength,
        upperCase: hasUpperCase,
        lowerCase: hasLowerCase,
        numbers: hasNumbers,
        specialChar: hasSpecialChar
      }
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const errors = { ...formErrors };
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value) {
          errors[field] = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        } else if (!validateName(value)) {
          errors[field] = `${field === 'firstName' ? 'First' : 'Last'} name should contain only letters and be at least 2 characters long`;
        } else {
          errors[field] = '';
        }
        break;
        
      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          errors.email = '';
        }
        break;
        
      case 'phone':
        if (!value) {
          errors.phone = 'Phone number is required';
        } else if (!validatePhone(value)) {
          errors.phone = 'Please enter a valid phone number (10-15 digits)';
        } else {
          errors.phone = '';
        }
        break;
        
      case 'address':
        if (!value) {
          errors.address = 'Address is required';
        } else if (!validateAddress(value)) {
          errors.address = 'Address should contain only letters and spaces';
        } else {
          errors.address = '';
        }
        break;
        
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else {
          const passwordValidation = validatePassword(value);
          if (!passwordValidation.isValid) {
            errors.password = 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character';
          } else {
            errors.password = '';
          }
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          errors.confirmPassword = '';
        }
        break;
    }
    
    setFormErrors(errors);
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        createdAt: new Date(),
        status: 'active'
      };

      await registerCustomer(formData.email, formData.password, userData);
      
      Alert.alert('Success', 'Account created successfully!');
      router.push('/customer/homepage');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // First Name validation
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
      isValid = false;
    } else if (!validateName(formData.firstName)) {
      errors.firstName = 'First name should contain only letters and be at least 2 characters long';
      isValid = false;
    }

    // Last Name validation
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
      isValid = false;
    } else if (!validateName(formData.lastName)) {
      errors.lastName = 'Last name should contain only letters and be at least 2 characters long';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (10-15 digits)';
      isValid = false;
    }

    // Address validation
    if (!formData.address) {
      errors.address = 'Address is required';
      isValid = false;
    } else if (!validateAddress(formData.address)) {
      errors.address = 'Address should contain only letters and spaces';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character';
        isValid = false;
      }
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-green-500 p-5 items-center rounded-b-3xl shadow-lg relative overflow-hidden">
          {/* Animated Bubbles */}
          <Animated.View 
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 160,
              height: 160,
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: 80,
              transform: [
                {
                  translateX: bubble1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
                {
                  translateY: bubble1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            }}
          />
          <Animated.View 
            style={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 160,
              height: 160,
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: 80,
              transform: [
                {
                  translateX: bubble2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
                {
                  translateY: bubble2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            }}
          />
          <Animated.View 
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 80,
              height: 80,
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: 40,
              transform: [
                {
                  translateX: bubble3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
                {
                  translateY: bubble3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
              ],
            }}
          />
          <Animated.View 
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              width: 80,
              height: 80,
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: 40,
              transform: [
                {
                  translateX: bubble4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
                {
                  translateY: bubble4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
              ],
            }}
          />
          
          <Animatable.View
            animation="bounceIn"
            duration={1500}
            className="w-24 h-24 mb-2 bg-white rounded-full items-center justify-center shadow-lg relative z-10"
          >
            <Icon
              name="user-plus"
              type="font-awesome"
              size={40}
              color="#22C55E"
            />
          </Animatable.View>
          <Animatable.Text 
            animation="fadeInDown"
            duration={1500}
            className="text-2xl font-bold text-white text-center mb-2 relative z-10"
            style={{ fontSize: wp('6%') }}
          >
            Create Account
          </Animatable.Text>
        </View>

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Form Fields */}
            <Animatable.View 
              animation="fadeInLeft"
              duration={1500}
              className="space-y-4"
            >
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-600 mb-1">First Name</Text>
                  <View className="flex-row items-center bg-white rounded-xl shadow-md">
                    <Icon name="user" type="font-awesome" color="#666" size={20} className="p-4" />
                    <TextInput
                      className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                        formErrors.firstName ? 'border-red-500 border' : ''
                      }`}
                      placeholder="Enter first name"
                      placeholderTextColor="#666"
                      value={formData.firstName}
                      onChangeText={(value) => handleInputChange('firstName', value)}
                      editable={!loading}
                    />
                  </View>
                  {formErrors.firstName ? (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.firstName}</Text>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 mb-1">Last Name</Text>
                  <View className="flex-row items-center bg-white rounded-xl shadow-md">
                    <Icon name="user" type="font-awesome" color="#666" size={20} className="p-4" />
                    <TextInput
                      className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                        formErrors.lastName ? 'border-red-500 border' : ''
                      }`}
                      placeholder="Enter last name"
                      placeholderTextColor="#666"
                      value={formData.lastName}
                      onChangeText={(value) => handleInputChange('lastName', value)}
                      editable={!loading}
                    />
                  </View>
                  {formErrors.lastName ? (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.lastName}</Text>
                  ) : null}
                </View>
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Email</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="envelope" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                      formErrors.email ? 'border-red-500 border' : ''
                    }`}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
                {formErrors.email ? (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.email}</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Phone Number</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="phone" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                      formErrors.phone ? 'border-red-500 border' : ''
                    }`}
                    placeholder="Enter phone number"
                    placeholderTextColor="#666"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
                {formErrors.phone ? (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.phone}</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Address</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="home" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                      formErrors.address ? 'border-red-500 border' : ''
                    }`}
                    placeholder="Enter your address"
                    placeholderTextColor="#666"
                    value={formData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    editable={!loading}
                  />
                </View>
                {formErrors.address ? (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.address}</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Password</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="lock" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                      formErrors.password ? 'border-red-500 border' : ''
                    }`}
                    placeholder="Enter password"
                    placeholderTextColor="#666"
                    secureTextEntry={!passwordVisible}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    className="p-4"
                  >
                    <Icon
                      name={passwordVisible ? "eye" : "eye-slash"}
                      type="font-awesome"
                      color="gray"
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.password ? (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.password}</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Confirm Password</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="lock" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className={`flex-1 h-12 px-3 text-base text-gray-700 ${
                      formErrors.confirmPassword ? 'border-red-500 border' : ''
                    }`}
                    placeholder="Confirm password"
                    placeholderTextColor="#666"
                    secureTextEntry={!confirmPasswordVisible}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="p-4"
                  >
                    <Icon
                      name={confirmPasswordVisible ? "eye" : "eye-slash"}
                      type="font-awesome"
                      color="gray"
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.confirmPassword ? (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</Text>
                ) : null}
              </View>
            </Animatable.View>

            {/* Buttons */}
            <Animatable.View 
              animation="fadeInUp"
              duration={1500}
              className="mt-6 space-y-4"
            >
              <Pressable 
                className={`bg-green-500 py-4 rounded-xl w-full shadow-lg ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-white text-lg font-bold">
                    Sign Up
                  </Text>
                )}
              </Pressable>

              <Pressable 
                className="bg-gray-200 py-4 rounded-xl w-full shadow-md"
                onPress={() => router.back()}
              >
                <Text className="text-center text-gray-700 text-base font-semibold">
                  Already have an account? Log in
                </Text>
              </Pressable>
            </Animatable.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}