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
  Platform,
  Keyboard,
  Image,
  Animated,
  Alert,
  Vibration
} from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import HomeHeader from '../../components/HomeHeader';
import { Ionicons, FontAwesome5, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const router = useRouter();
  const scrollViewRef = useRef();
  
  // User data states
  const [userData, setUserData] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [isFocused, setIsFocused] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    address: false,
    bio: false,
  });
  const [errors, setErrors] = useState({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const inputAnimations = useRef({
    firstName: new Animated.Value(0),
    lastName: new Animated.Value(0),
    email: new Animated.Value(0),
    phone: new Animated.Value(0),
    address: new Animated.Value(0),
    bio: new Animated.Value(0),
  }).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  
  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
    const userId = auth.currentUser.uid;
    const userDoc = await getDoc(doc(db, 'users', userId));
      
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      setBio(data.bio || '');
      setProfileImage(data.profilePicture || null);
      } else {
        // Try customers collection if users collection doesn't have this user
        const customerDoc = await getDoc(doc(db, 'customers', userId));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          setUserData(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
      setAddress(data.address || '');
          setBio(data.bio || '');
          setProfileImage(data.profilePicture || null);
    } else {
          console.error("User document does not exist in either collection.");
          Alert.alert("Error", "Could not find your profile data.");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to fetch profile data.");
    } finally {
      setLoading(false);
      
      // Start entrance animations
      startEntranceAnimations();
    }
  };
  
  // Start entrance animations
  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Staggered animation for input fields
    const fieldsToAnimate = ['firstName', 'lastName', 'email', 'phone', 'address', 'bio'];
    fieldsToAnimate.forEach((field, index) => {
      Animated.timing(inputAnimations[field], {
        toValue: 1,
        duration: 500,
        delay: 300 + (index * 100),
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Handle save button animation
  const animateSaveButton = () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Image picker function
  const pickImage = async () => {
    try {
      // Animate image click
      Animated.sequence([
        Animated.timing(imageScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          Vibration.vibrate(50);
        }
      } else {
        Vibration.vibrate(50);
      }
      
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }
    
    // Validate email format
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }
    
    // Validate phone number (basic format)
    if (phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle save profile data
  const handleSaveProfile = async () => {
    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        setActiveField(errorFields[0]);
      }
      return;
    }

    try {
      setSaving(true);
      animateSaveButton();
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          Vibration.vibrate(100);
        }
      } else {
        Vibration.vibrate(100);
      }

          const userId = auth.currentUser.uid;
      
      // First try updating users collection
      try {
        const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
          firstName,
          lastName,
          email,
          phone,
          address,
          bio,
          profilePicture: profileImage,
          updatedAt: new Date()
          });
      } catch (error) {
        // If users collection update fails, try customers collection
        const customerRef = doc(db, 'customers', userId);
        await updateDoc(customerRef, {
          firstName,
          lastName,
          email,
          phone,
          address,
          bio,
          profilePicture: profileImage,
          updatedAt: new Date()
        });
      }
      
      // Show success message
      Alert.alert(
        "Success",
        "Your profile has been updated successfully!",
        [{ text: "OK" }]
      );
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  // Handle focus state of input fields
  const handleFocus = (field) => {
    setIsFocused({
      ...isFocused,
      [field]: true,
    });
    setActiveField(field);
    
    // Provide light haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
  };
  
  // Handle blur state of input fields
  const handleBlur = (field) => {
    setIsFocused({
      ...isFocused,
      [field]: false,
    });
  };

  // Initialize component
  useEffect(() => {
    if (auth.currentUser) {
      fetchUserData();
    }
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (scrollViewRef.current && activeField) {
          // Scroll to active input
          setTimeout(() => {
            scrollViewRef.current.scrollTo({ y: getScrollPositionForField(activeField), animated: true });
          }, 100);
        }
      }
    );
    
    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [auth.currentUser, activeField]);
  
  // Helper function to determine scroll position based on field
  const getScrollPositionForField = (field) => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return 100;
      case 'email':
        return 150;
      case 'phone':
        return 200;
      case 'address':
        return 250;
      case 'bio':
        return 300;
      default:
        return 0;
    }
  };
  
  // Custom input field component
  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    field, 
    keyboardType = 'default',
    multiline = false,
    maxLength = null,
    icon,
    iconColor = "#6366F1"
  }) => {
    const fieldAnimation = inputAnimations[field];
    
    return (
      <Animated.View
        style={{
          opacity: fieldAnimation,
          transform: [
            { translateY: fieldAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }
          ],
          marginBottom: 16
        }}
      >
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            isFocused[field] && styles.inputFocused,
            errors[field] && styles.inputError
          ]}
        >
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChangeText(text);
              setIsEditing(true);
              if (errors[field]) {
                setErrors({...errors, [field]: null});
    }
            }}
            placeholder={placeholder}
            style={[
              styles.input,
              multiline && styles.multilineInput
            ]}
            placeholderTextColor="#9CA3AF"
            onFocus={() => handleFocus(field)}
            onBlur={() => handleBlur(field)}
            keyboardType={keyboardType}
            multiline={multiline}
            maxLength={maxLength}
          />
        </View>
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </Animated.View>
    );
  };
  
  // Display loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <HomeHeader title="Edit Profile" />
      
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Animated.View style={{ transform: [{ scale: imageScale }] }}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={pickImage}
                activeOpacity={0.9}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <FontAwesome5 name="user-alt" size={40} color="#6366F1" />
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
            
            <View style={styles.profileStatsContainer}>
              <View style={styles.profileStat}>
                <Ionicons name="person" size={18} color="#E0E7FF" />
                <Text style={styles.profileStatText}>
                  {auth.currentUser ? auth.currentUser.email : 'User'}
                </Text>
        </View>
      </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Profile Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Form Fields - First Row (First and Last Name) */}
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <InputField
                label="First Name"
              value={firstName}
              onChangeText={setFirstName}
                placeholder="John"
                field="firstName"
                icon={<FontAwesome5 name="user" size={18} color="#6366F1" />}
            />
            </View>
            <View style={styles.formColumn}>
              <InputField
                label="Last Name"
              value={lastName}
              onChangeText={setLastName}
                placeholder="Doe"
                field="lastName"
                icon={<FontAwesome5 name="user" size={18} color="#6366F1" />}
              />
            </View>
          </View>
          
          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            field="email"
            keyboardType="email-address"
            icon={<MaterialIcons name="email" size={18} color="#6366F1" />}
            />
          
          <InputField
            label="Phone Number"
              value={phone}
              onChangeText={setPhone}
            placeholder="(123) 456-7890"
            field="phone"
              keyboardType="phone-pad"
            icon={<Feather name="phone" size={18} color="#6366F1" />}
          />
          
          <InputField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Your address"
            field="address"
            icon={<Ionicons name="location-outline" size={18} color="#6366F1" />}
          />
          
          {/* Bio Section */}
          <Text style={styles.sectionTitle}>About Me</Text>
          
          <InputField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us something about yourself..."
            field="bio"
            multiline={true}
            maxLength={150}
            icon={<MaterialCommunityIcons name="text-box-outline" size={18} color="#6366F1" />}
          />
          
          {/* Character count for bio */}
          <Text style={styles.characterCount}>
            {bio ? bio.length : 0}/150 characters
          </Text>
          
          {/* Save Button */}
          <Animated.View
            style={[
              styles.saveButtonContainer,
              { 
                opacity: fadeAnim,
                transform: [{ scale: saveButtonScale }] 
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                isEditing ? styles.saveButtonActive : styles.saveButtonDisabled
              ]}
              onPress={handleSaveProfile}
              disabled={!isEditing || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#FFFFFF" style={styles.saveButtonIcon} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          {/* Additional actions */}
          <View style={styles.additionalActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert(
                "Reset Password",
                "Would you like to reset your password?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Yes", 
                    onPress: () => {
                      if (auth.currentUser && auth.currentUser.email) {
                        auth.sendPasswordResetEmail(auth.currentUser.email)
                          .then(() => Alert.alert("Success", "Password reset email sent"))
                          .catch(error => Alert.alert("Error", error.message));
                      }
                    }
                  }
                ]
              )}
            >
              <Feather name="lock" size={16} color="#6366F1" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Sign Out", 
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await auth.signOut();
                        router.replace('/login');
                      } catch (error) {
                        Alert.alert("Error", "Failed to sign out");
                      }
                    }
                  }
                ]
              )}
            >
              <Feather name="log-out" size={16} color="#EF4444" style={styles.actionButtonIcon} />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    width: '100%',
    marginBottom: 20,
  },
  headerGradient: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  profileStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  profileStatText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formColumn: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: 'white',
    paddingVertical: 4,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingRight: 12,
    fontSize: 16,
    color: '#374151',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputFocused: {
    borderColor: '#6366F1',
    borderWidth: 1.5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 20,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonActive: {
    backgroundColor: '#4F46E5',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalActions: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButtonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#6366F1',
  },
});

export default ProfileScreen;