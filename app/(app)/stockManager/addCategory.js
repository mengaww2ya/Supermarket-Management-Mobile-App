import React, { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { 
  Pressable, 
  SafeAreaView, 
  Text, 
  View, 
  TextInput, 
  Alert, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Vibration,
  Platform,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../../firebase/firebaseConfig";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddCategory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're in edit mode
  const isEditMode = params.editMode === "true";
  const categoryId = params.categoryId;
  
  // State variables
  const [category, setCategory] = useState(isEditMode ? params.categoryName : "");
  const [description, setDescription] = useState(isEditMode ? params.description : "");
  const [image, setImage] = useState(isEditMode ? params.image : null);
  const [isActive, setIsActive] = useState(isEditMode ? params.status === "Active" : true);
  const [discountAvailable, setDiscountAvailable] = useState(isEditMode ? params.discountAvailable === "true" : false);
  const [discountPercentage, setDiscountPercentage] = useState(isEditMode ? params.discountPercentage : "");
  const [isLoading, setIsLoading] = useState(false);
  const [categoryAdded, setCategoryAdded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState({
    category: null,
    description: null,
    image: null,
    discountPercentage: null
  });
  const [isFocused, setIsFocused] = useState({
    category: false,
    description: false,
    discountPercentage: false
  });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const discountSectionAnim = useRef(new Animated.Value(0)).current;
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Initialize image animation if in edit mode
    if (isEditMode && image) {
      imageAnim.setValue(1);
      
      // Initialize discount section animation if discount is available
      if (discountAvailable) {
        discountSectionAnim.setValue(1);
      }
    }

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Animation for discount section visibility
  useEffect(() => {
    Animated.timing(discountSectionAnim, {
      toValue: discountAvailable ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [discountAvailable]);

  // Animation for image upload
  useEffect(() => {
    if (image) {
      Animated.timing(imageAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      imageAnim.setValue(0);
    }
  }, [image]);

  // Function to validate inputs
  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      category: null,
      description: null,
      image: null,
      discountPercentage: null
    };

    setIsValidating(true);
    
    // Validate category
    if (!category.trim()) {
      newErrors.category = "Category name is required";
      isValid = false;
    } else if (category.trim().length < 3) {
      newErrors.category = "Category name must be at least 3 characters";
      isValid = false;
    }
    
    // Validate description
    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 5) {
      newErrors.description = "Description must be at least 5 characters";
      isValid = false;
    }
    
    // Validate image
    if (!image) {
      newErrors.image = "Category image is required";
      isValid = false;
    }
    
    // Validate discount percentage if discount is available
    if (discountAvailable) {
      if (!discountPercentage.trim()) {
        newErrors.discountPercentage = "Discount percentage is required";
        isValid = false;
      } else {
        const percentage = parseFloat(discountPercentage);
        if (isNaN(percentage)) {
          newErrors.discountPercentage = "Must be a valid number";
          isValid = false;
        } else if (percentage <= 0 || percentage > 99) {
          newErrors.discountPercentage = "Must be between 1 and 99";
          isValid = false;
        }
      }
    }
    
    setErrors(newErrors);
    
    // If there are errors, shake the form
    if (!isValid) {
      shakeAnimation();
      
      // Provide haptic feedback for validation error
      if (Platform.OS === 'ios') {
        try {
          require('expo-haptics').notificationAsync(
            require('expo-haptics').NotificationFeedbackType.Error
          );
        } catch (e) {
          Vibration.vibrate(300);
        }
      } else {
        Vibration.vibrate(300);
      }
    }
    
    return isValid;
  };

  // Shake animation for validation errors
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  // Function to check if category name already exists
  const checkCategoryExists = async (categoryName) => {
    try {
      // If in edit mode and the name hasn't changed, skip this check
      if (isEditMode && categoryName === params.categoryName) {
        return false;
      }
      
      const q = query(collection(db, "AddCategory"), where("categoryName", "==", categoryName));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking category:", error);
      return false;
    }
  };

  // Function to add or update a category
  const saveCategory = async () => {
    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if category already exists
      const exists = await checkCategoryExists(category.trim());
      if (exists) {
        setErrors({
          ...errors,
          category: "This category already exists"
        });
        shakeAnimation();
        
        // Haptic feedback
        Vibration.vibrate(300);
        setIsLoading(false);
        return;
      }

      const categoryData = {
        categoryName: category.trim(),
        description: description.trim(),
        image,
        status: isActive ? "Active" : "Inactive",
        discountAvailable,
        discountPercentage: discountAvailable ? parseFloat(discountPercentage) : 0,
      };
      
      if (!isEditMode) {
        // Add new category
        categoryData.dateAdded = new Date().toISOString();
        await addDoc(collection(db, "AddCategory"), categoryData);
        
        // Success message
        Alert.alert(
          "Success", 
          "Category added successfully!", 
          [
            { 
              text: "Add Another", 
              onPress: () => {
                setCategoryAdded(false);
                resetForm();
              },
              style: "cancel" 
            },
            { 
              text: "View Categories", 
              onPress: () => router.push("/stockManager/ViewCategory") 
            }
          ]
        );
      } else {
        // Update existing category
        const categoryRef = doc(db, "AddCategory", categoryId);
        await updateDoc(categoryRef, categoryData);
        
        // Success message
        Alert.alert(
          "Success", 
          "Category updated successfully!", 
          [
            { 
              text: "OK", 
              onPress: () => router.push("/stockManager/ViewCategory") 
            }
          ]
        );
      }
      
      // Success feedback
      if (Platform.OS === 'ios') {
        try {
          require('expo-haptics').notificationAsync(
            require('expo-haptics').NotificationFeedbackType.Success
          );
        } catch (e) {
          Vibration.vibrate([0, 70, 50, 70]);
        }
      } else {
        Vibration.vibrate([0, 70, 50, 70]);
      }
      
      // If not in edit mode, reset the form
      if (!isEditMode) {
        resetForm();
        setCategoryAdded(true);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to ${isEditMode ? 'update' : 'add'} category: ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to reset the form
  const resetForm = () => {
    setCategory("");
    setDescription("");
    setImage(null);
    setDiscountAvailable(false);
    setDiscountPercentage("");
    setIsActive(true);
    setErrors({
      category: null,
      description: null,
      image: null,
      discountPercentage: null
    });
  };

  // Function to select an image
  const selectImage = async () => {
    try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to the media library to select images.");
      return;
    }
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
        
        // Clear image error
        setErrors({
          ...errors,
          image: null
        });
        
        // Haptic feedback on successful image selection
        if (Platform.OS === 'ios') {
          try {
            require('expo-haptics').impactAsync(
              require('expo-haptics').ImpactFeedbackStyle.Light
            );
          } catch (e) {
            Vibration.vibrate(30);
          }
        } else {
          Vibration.vibrate(30);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image: " + error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
            >
              <Ionicons name="arrow-back" size={20} color="#4b5563" />
            </TouchableOpacity>
            
            <Text className="text-xl font-bold text-gray-800">
              {isEditMode ? "Update Category" : "Add Category"}
            </Text>
            
            <View className="w-10" />
          </View>
          
          <Animated.View 
            className="flex-1 px-4 pt-4 pb-6 justify-center items-center"
            style={{ 
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ] 
            }}
          >
            <View className="bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Form Header */}
              <LinearGradient
                colors={['#f97316', '#ea580c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-5"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-white/20 rounded-full justify-center items-center mr-3">
                    <Ionicons name="layers" size={20} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-bold">
                      {isEditMode ? "Update Category" : "Create Category"}
                    </Text>
                    <Text className="text-orange-100 text-xs">
                      {isEditMode ? "Update category details" : "Add a new product category"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
              
              <View className="p-5">
                {/* Category Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Category Name</Text>
                  <View className="relative">
        <TextInput
                      className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.category ? 'border-red-500' : isFocused.category ? 'border-orange-500' : 'border-gray-300'}`}
          placeholder="Enter category name"
          value={category}
          onChangeText={setCategory}
                      onFocus={() => setIsFocused({...isFocused, category: true})}
                      onBlur={() => setIsFocused({...isFocused, category: false})}
                    />
                    <Ionicons 
                      name="pricetag" 
                      size={18} 
                      color={errors.category ? "#ef4444" : isFocused.category ? "#f97316" : "#9ca3af"} 
                      style={{ position: 'absolute', left: 12, top: 14 }}
                    />
                    {isValidating && errors.category && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">{errors.category}</Text>
                    )}
                  </View>
                </View>
                
                {/* Description Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                  <View className="relative">
                    <TextInput
                      className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.description ? 'border-red-500' : isFocused.description ? 'border-orange-500' : 'border-gray-300'}`}
                      placeholder="Enter category description"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      style={{ textAlignVertical: 'top', minHeight: 80 }}
                      onFocus={() => setIsFocused({...isFocused, description: true})}
                      onBlur={() => setIsFocused({...isFocused, description: false})}
                    />
                    <Ionicons 
                      name="document-text" 
                      size={18} 
                      color={errors.description ? "#ef4444" : isFocused.description ? "#f97316" : "#9ca3af"} 
                      style={{ position: 'absolute', left: 12, top: 14 }}
                    />
                    {isValidating && errors.description && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">{errors.description}</Text>
                    )}
                  </View>
                </View>
                
                {/* Status Toggle */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-gray-700">Category Status</Text>
                    <View className="flex-row items-center">
                      <Text className={`text-xs mr-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setIsActive(!isActive);
                          Vibration.vibrate(20);
                        }}
                        className={`w-12 h-6 rounded-full flex-row items-center px-1 ${isActive ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Discount Toggle */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-medium text-gray-700">Category Discount</Text>
                      <Text className="text-xs text-gray-500">Apply discount to all products in this category</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className={`text-xs mr-2 ${discountAvailable ? 'text-amber-600' : 'text-gray-500'}`}>
                        {discountAvailable ? 'Enabled' : 'Disabled'}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setDiscountAvailable(!discountAvailable);
                          Vibration.vibrate(20);
                        }}
                        className={`w-12 h-6 rounded-full flex-row items-center px-1 ${discountAvailable ? 'bg-amber-500 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Discount Percentage Input - conditionally rendered */}
                <Animated.View 
                  style={{
                    maxHeight: discountSectionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 90]
                    }),
                    opacity: discountSectionAnim,
                    overflow: 'hidden',
                    marginBottom: discountSectionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 16]
                    })
                  }}
                >
                  <View className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</Text>
                    <View className="relative">
                      <TextInput
                        className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.discountPercentage ? 'border-red-500' : isFocused.discountPercentage ? 'border-orange-500' : 'border-gray-300'}`}
                        placeholder="Enter discount percentage (e.g. 10)"
                        value={discountPercentage}
                        onChangeText={setDiscountPercentage}
                        keyboardType="numeric"
                        maxLength={2}
                        onFocus={() => setIsFocused({...isFocused, discountPercentage: true})}
                        onBlur={() => setIsFocused({...isFocused, discountPercentage: false})}
                      />
                      <FontAwesome5 
                        name="percent" 
                        size={15} 
                        color={errors.discountPercentage ? "#ef4444" : isFocused.discountPercentage ? "#f97316" : "#9ca3af"} 
                        style={{ position: 'absolute', left: 12, top: 14 }}
                      />
                      {isValidating && errors.discountPercentage && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{errors.discountPercentage}</Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
                
                {/* Image Upload Section */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Category Image</Text>
                  <TouchableOpacity 
                    className={`border-2 border-dashed rounded-xl h-[160px] justify-center items-center mt-1 ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
                    onPress={selectImage}
                  >
                    {image ? (
                      <Animated.View 
                        className="w-full h-full relative"
                        style={{ opacity: imageAnim }}
                      >
                        <Image 
                          source={{ uri: image }} 
                          className="w-full h-full rounded-lg" 
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-black/10 rounded-lg" />
                        <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2">
                          <Ionicons name="camera" size={18} color="white" />
                        </View>
                        {discountAvailable && (
                          <View className="absolute top-2 left-2 bg-amber-500 px-2 py-1 rounded-md flex-row items-center">
                            <FontAwesome5 name="tags" size={12} color="white" style={{marginRight: 4}} />
                            <Text className="text-white font-bold text-xs">{discountPercentage || '0'}% OFF</Text>
                          </View>
                        )}
                      </Animated.View>
                    ) : (
                      <View className="items-center">
                        <Ionicons name="image-outline" size={40} color="#9ca3af" />
                        <Text className="text-gray-500 mt-2 font-medium">Upload Category Image</Text>
                        <Text className="text-gray-400 text-xs mt-1">Tap to select (1:1 ratio recommended)</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {isValidating && errors.image && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">{errors.image}</Text>
                  )}
                </View>
                
                {/* Save Button */}
                <TouchableOpacity
                  className={`rounded-lg py-3 px-4 ${isLoading ? 'bg-orange-300' : 'bg-orange-600'}`}
                  onPress={saveCategory}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">
                        {isEditMode ? "Updating..." : "Adding..."}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-semibold">
                      {isEditMode ? "Update Category" : "Add Category"}
                    </Text>
                  )}
                </TouchableOpacity>
                
                {/* View Categories Button - only show in add mode when a category has been added */}
                {!isEditMode && categoryAdded && (
                  <TouchableOpacity
                    className="mt-3 rounded-lg py-3 px-4 border border-orange-600"
            onPress={() => router.push("/stockManager/ViewCategory")}
          >
                    <Text className="text-orange-600 text-center font-semibold">View Categories</Text>
                  </TouchableOpacity>
        )}
      </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}