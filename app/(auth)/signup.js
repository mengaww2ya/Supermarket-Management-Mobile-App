import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-elements';
import { useAuth } from '../context/authContext';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as ImagePicker from 'expo-image-picker';

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
  const [profileImage, setProfileImage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();
  const { registerCustomer, loading } = useAuth();

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
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSignup = async () => {
    // Validate form
    if (!formData.email || !formData.password || !formData.confirmPassword || 
        !formData.firstName || !formData.lastName || !formData.phone || !formData.address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
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
        profileImage: profileImage || null,
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

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-yellow-400 p-5 items-center rounded-b-3xl shadow-lg">
          <Animatable.View
            animation="bounceIn"
            duration={1500}
            className="w-24 h-24 mb-2 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <Icon
              name="user-plus"
              type="font-awesome"
              size={40}
              color="#FFDC2B"
            />
          </Animatable.View>
          <Animatable.Text 
            animation="fadeInDown"
            duration={1500}
            className="text-2xl font-bold text-black text-center mb-2"
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
            {/* Profile Image */}
            {/* <Animatable.View 
              animation="fadeInUp"
              duration={1500}
              className="items-center mb-6"
            >
              <TouchableOpacity 
                onPress={pickImage}
                className="relative"
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    className="w-32 h-32 rounded-full"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                    <Icon name="camera" type="font-awesome" size={40} color="#666" />
                  </View>
                )}
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                  <Icon name="camera" type="font-awesome" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-600 mt-2">Tap to add profile picture</Text>
            </Animatable.View> */}

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
                      className="flex-1 h-12 px-3 text-base text-gray-700"
                      placeholder="Enter first name"
                      placeholderTextColor="#666"
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                      editable={!loading}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 mb-1">Last Name</Text>
                  <View className="flex-row items-center bg-white rounded-xl shadow-md">
                    <Icon name="user" type="font-awesome" color="#666" size={20} className="p-4" />
                    <TextInput
                      className="flex-1 h-12 px-3 text-base text-gray-700"
                      placeholder="Enter last name"
                      placeholderTextColor="#666"
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Email</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="envelope" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className="flex-1 h-12 px-3 text-base text-gray-700"
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Phone Number</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="phone" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className="flex-1 h-12 px-3 text-base text-gray-700"
                    placeholder="Enter phone number"
                    placeholderTextColor="#666"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Address</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="home" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className="flex-1 h-12 px-3 text-base text-gray-700"
                    placeholder="Enter your address"
                    placeholderTextColor="#666"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    editable={!loading}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Password</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="lock" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className="flex-1 h-12 px-3 text-base text-gray-700"
                    placeholder="Enter password"
                    placeholderTextColor="#666"
                    secureTextEntry={!passwordVisible}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
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
              </View>

              <View>
                <Text className="text-gray-600 mb-1">Confirm Password</Text>
                <View className="flex-row items-center bg-white rounded-xl shadow-md">
                  <Icon name="lock" type="font-awesome" color="#666" size={20} className="p-4" />
                  <TextInput
                    className="flex-1 h-12 px-3 text-base text-gray-700"
                    placeholder="Confirm password"
                    placeholderTextColor="#666"
                    secureTextEntry={!confirmPasswordVisible}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
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