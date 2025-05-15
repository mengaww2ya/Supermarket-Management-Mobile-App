import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import { Modal, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const scrollViewRef = useRef();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [inputAnimations, setInputAnimations] = useState({});
  const [isFocused, setIsFocused] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveButtonScale, setSaveButtonScale] = useState(1);
  const router = useRouter();

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setProfileImage(data.profilePicture || null);
      } else {
        Alert.alert("Error", "Could not find your profile data.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch profile data.");
    } finally {
      setLoading(false);
    }
  };

  // Image picker function
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // Set the image URI immediately for display
        setProfileImage(imageUri);

        // Convert image to base64
        try {
          // First, fetch the image as a blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Convert blob to base64
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
              const base64data = reader.result;

              // Update profile picture in Firestore
              const userId = auth.currentUser.uid;
              let userRef;

              // Check which collection the user belongs to
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                userRef = doc(db, 'users', userId);
              } else {
                userRef = doc(db, 'customers', userId);
              }

              await updateDoc(userRef, {
                profilePicture: base64data,
              });

              console.log("Profile picture updated with base64 data");
              resolve();
            };
            reader.onerror = (error) => {
              console.error("Error reading file:", error);
              reject(error);
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error converting image to base64:", error);
          Alert.alert("Error", "Failed to process image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Handle save profile data
  const handleSaveProfile = async () => {
    const userId = auth.currentUser.uid;
    await updateDoc(doc(db, 'users', userId), {
      firstName,
      lastName,
      email,
      phone,
      address,
      profilePicture: profileImage,
    });

    Alert.alert("Success", "Your profile has been updated successfully!");
    setEditModalVisible(false);
    fetchUserData();
  };

  // Initialize component
  useEffect(() => {
    if (auth.currentUser) {
      fetchUserData();
    }
  }, [auth.currentUser]);

  const toggleEditMode = () => {
    setShowEditMode(!showEditMode);
    if (!showEditMode) {
      setImageScale(1);
      setInputAnimations({});
      setIsFocused({});
      setErrors({});
    }
  };

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        {/* Profile Header - Centered */}
        <View style={styles.profileHeader}>
          <Animated.View style={{ transform: [{ scale: imageScale }] }}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleImagePick}
              activeOpacity={0.9}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <FontAwesome5 name="user-alt" size={40} color="#FF6B00" />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.profileName}>
            {firstName || lastName ? `${firstName} ${lastName}` : 'Your Profile'}
          </Text>

          <Text style={styles.profileEmail}>
            {auth.currentUser ? auth.currentUser.email : 'User'}
          </Text>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={toggleEditMode}
            activeOpacity={0.8}
          >
            <Feather name={showEditMode ? "x" : "edit-2"} size={18} color="white" />
            <Text style={styles.editButtonText}>
              {showEditMode ? "Cancel" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="person" size={22} color="#22C55E" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <InputField
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              icon={<FontAwesome5 name="user" size={18} color="#22C55E" />}
              error={errors.firstName}
              editable={showEditMode}
              isFocused={isFocused.firstName}
              onFocus={() => handleFocus('firstName')}
              onBlur={() => handleBlur('firstName')}
              animation={inputAnimations.firstName}
            />

            <InputField
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              icon={<FontAwesome5 name="user" size={18} color="#22C55E" />}
              error={errors.lastName}
              editable={showEditMode}
              isFocused={isFocused.lastName}
              onFocus={() => handleFocus('lastName')}
              onBlur={() => handleBlur('lastName')}
              animation={inputAnimations.lastName}
            />
          </View>

          {/* Contact Information Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="contact-mail" size={22} color="#22C55E" />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              icon={<MaterialIcons name="email" size={18} color="#22C55E" />}
              keyboardType="email-address"
              error={errors.email}
              editable={showEditMode}
              isFocused={isFocused.email}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              animation={inputAnimations.email}
            />

            <InputField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              icon={<Feather name="phone" size={18} color="#22C55E" />}
              keyboardType="phone-pad"
              error={errors.phone}
              editable={showEditMode}
              isFocused={isFocused.phone}
              onFocus={() => handleFocus('phone')}
              onBlur={() => handleBlur('phone')}
              animation={inputAnimations.phone}
            />

            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              icon={<Ionicons name="location-outline" size={18} color="#22C55E" />}
              error={errors.address}
              editable={showEditMode}
              isFocused={isFocused.address}
              onFocus={() => handleFocus('address')}
              onBlur={() => handleBlur('address')}
              animation={inputAnimations.address}
            />
          </View>

          {/* Save Button */}
          {showEditMode && (
            <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Feather name="check" size={20} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => router.push('/(app)/common/ChangePassword')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="lock-outline" size={20} color="#22C55E" />
            <Text style={styles.changePasswordText}>Change Password</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InputField = ({ label, value, onChangeText, placeholder, icon, error, editable, isFocused, onFocus, onBlur, animation }) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Animated.View style={animation}>
          {icon && <Ionicons name={icon.name} size={icon.size} color="#FF6B00" />}
        </Animated.View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22C55E',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  changePasswordText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingGradient: {
    width: width * 0.8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;