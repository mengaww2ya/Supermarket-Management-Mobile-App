import React, { useState, useEffect, useRef } from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  View,
  TextInput,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Vibration,
  KeyboardAvoidingView,
  ActivityIndicator
} from "react-native";
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function AddProduct() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unitType, setUnitType] = useState("");
  const [brand, setBrand] = useState("");
  const [supplier, setSupplier] = useState("");
  const [showProductionDatePicker, setShowProductionDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [productionDate, setProductionDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [dateErrors, setDateErrors] = useState({
    productionDate: null,
    expiryDate: null
  });
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [status, setStatus] = useState(true);
  const [hasSpecialOffer, setHasSpecialOffer] = useState(false);
  const [specialOfferQuantity, setSpecialOfferQuantity] = useState("");
  const [specialOfferDiscount, setSpecialOfferDiscount] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Ref for scrolling
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "AddCategory"));
        const fetchedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        Alert.alert("Error", "Failed to load categories. Please try again.");
      }
    };

    fetchCategories();
  }, []);

  // Date picker handlers
  const onProductionDateChange = (event, selectedDate) => {
    setShowProductionDatePicker(false);
    if (selectedDate) {
      // Validate that production date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        setDateErrors(prev => ({ ...prev, productionDate: "Production date cannot be in the future" }));
        return;
      }
      setProductionDate(selectedDate);
      setDateErrors(prev => ({ ...prev, productionDate: null }));
    }
  };

  const onExpiryDateChange = (event, selectedDate) => {
    setShowExpiryDatePicker(false);
    if (selectedDate) {
      // Validate that expiry date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setDateErrors(prev => ({ ...prev, expiryDate: "Expiry date cannot be in the past" }));
        return;
      }
      if (selectedDate < productionDate) {
        setDateErrors(prev => ({ ...prev, expiryDate: "Expiry date must be after production date" }));
        return;
      }
      setExpiryDate(selectedDate);
      setDateErrors(prev => ({ ...prev, expiryDate: null }));
    }
  };

  const addProduct = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          Vibration.vibrate(50);
        }
      } else {
        Vibration.vibrate(50);
      }

      // Animate button
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const currentDate = new Date().toISOString();
      const expiryDateObj = new Date(expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      // Check if product is approaching expiration
      const isApproachingExpiry = expiryDateObj <= threeMonthsFromNow;
      const isExpired = expiryDateObj <= new Date();

      const newProduct = {
        productName,
        description,
        price: parseFloat(price),
        hasDiscount,
        discountPrice: hasDiscount ? parseFloat(discountPrice) || 0 : 0,
        discountStartDate: hasDiscount ? discountStartDate : null,
        discountEndDate: hasDiscount ? discountEndDate : null,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        unitType,
        brand,
        supplier,
        categoryId: selectedCategory,
        image,
        status: isExpired ? "Expired" : (isApproachingExpiry ? "Approaching Expiry" : "Active"),
        dateAdded: currentDate,
        lastUpdated: currentDate,
        hasSpecialOffer,
        specialOfferDetails: hasSpecialOffer ? {
          quantity: parseInt(specialOfferQuantity, 10) || 0,
          discountPercentage: parseInt(specialOfferDiscount, 10) || 0
        } : null,
        productionDate: productionDate.toISOString(),
        expirationDate: expiryDate.toISOString(),
        isApproachingExpiry,
        isExpired
      };

      await addDoc(collection(db, 'Products'), newProduct);

      // Show appropriate alert based on expiration status
      let alertMessage = "Product added successfully!";
      if (isExpired) {
        alertMessage += "\nNote: This product is already expired and will not be visible to customers.";
      } else if (isApproachingExpiry) {
        alertMessage += "\nNote: This product is approaching expiration (within 3 months).";
      }

      Alert.alert(
        "Success",
        alertMessage,
        [
          {
            text: "Add Another",
            onPress: resetForm,
            style: "cancel"
          },
          {
            text: "Go to Products",
            onPress: () => router.push("/stockManager/ProductList")
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!productName) {
      Alert.alert("Error", "Please enter a product name");
      return false;
    }

    if (!description) {
      Alert.alert("Error", "Please enter a product description");
      return false;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price greater than zero");
      return false;
    }

    if (hasDiscount) {
      if (!discountPrice || isNaN(parseFloat(discountPrice))) {
        Alert.alert("Error", "Please enter a valid discount price");
        return false;
      }

      if (parseFloat(discountPrice) >= parseFloat(price)) {
        Alert.alert("Error", "Discount price must be lower than the regular price");
        return false;
      }

      if (!discountStartDate) {
        Alert.alert("Error", "Please enter discount start date");
        return false;
      }

      if (!discountEndDate) {
        Alert.alert("Error", "Please enter discount end date");
        return false;
      }

      // Validate date format and logic
      const startDate = new Date(discountStartDate);
      const endDate = new Date(discountEndDate);

      if (isNaN(startDate.getTime())) {
        Alert.alert("Error", "Invalid discount start date format (use YYYY-MM-DD)");
        return false;
      }

      if (isNaN(endDate.getTime())) {
        Alert.alert("Error", "Invalid discount end date format (use YYYY-MM-DD)");
        return false;
      }

      if (endDate < startDate) {
        Alert.alert("Error", "Discount end date must be after start date");
        return false;
      }
    }

    if (!stockQuantity || isNaN(parseInt(stockQuantity))) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return false;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return false;
    }

    if (!unitType) {
      Alert.alert("Error", "Please enter a unit type");
      return false;
    }

    if (!image) {
      Alert.alert("Error", "Please select a product image");
      return false;
    }

    if (hasSpecialOffer) {
      if (!specialOfferQuantity || isNaN(parseInt(specialOfferQuantity)) || parseInt(specialOfferQuantity) <= 0) {
        Alert.alert("Error", "Please enter a valid quantity for special offer");
        return false;
      }

      if (!specialOfferDiscount || isNaN(parseInt(specialOfferDiscount)) || parseInt(specialOfferDiscount) <= 0 || parseInt(specialOfferDiscount) > 100) {
        Alert.alert("Error", "Please enter a valid discount percentage (1-100) for special offer");
        return false;
      }
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (productionDate > today) {
      setDateErrors(prev => ({ ...prev, productionDate: "Production date cannot be in the future" }));
      return false;
    }

    if (expiryDate < today) {
      setDateErrors(prev => ({ ...prev, expiryDate: "Expiry date cannot be in the past" }));
      return false;
    }

    if (expiryDate < productionDate) {
      setDateErrors(prev => ({ ...prev, expiryDate: "Expiry date must be after production date" }));
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setProductName("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setHasDiscount(false);
    setDiscountStartDate("");
    setDiscountEndDate("");
    setStockQuantity("");
    setUnitType("");
    setBrand("");
    setSupplier("");
    setShowProductionDatePicker(false);
    setShowExpiryDatePicker(false);
    setProductionDate(new Date());
    setExpiryDate(new Date());
    setDateErrors({
      productionDate: null,
      expiryDate: null
    });
    setImage(null);
    setSelectedCategory("");
    setStatus(true);
    setHasSpecialOffer(false);
    setSpecialOfferQuantity("");
    setSpecialOfferDiscount("");
    setCurrentStep(1);

    // Animate the form reset
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Error", "Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const base64data = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImage(base64data);

        // Vibrate on success
        Vibration.vibrate(30);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      // Animate transition to next step
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep + 1);

      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      // Animate transition to previous step
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep - 1);

      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    }
  };

  const renderStepIndicator = () => {
    return (
      <View className="flex-row justify-center items-center mb-6 pt-4">
        {[1, 2, 3].map((step) => (
          <View key={step} className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setCurrentStep(step)}
              className={`w-8 h-8 rounded-full justify-center items-center ${currentStep === step ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <Text className={`font-medium ${currentStep === step ? 'text-white' : 'text-gray-500'}`}>{step}</Text>
            </TouchableOpacity>

            {step < 3 && (
              <View className={`h-[2px] w-16 ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Animated.View
            className="w-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }]
            }}
          >
            <Text className="text-lg font-semibold text-gray-700 mb-2">Basic Information</Text>

            <View className="mb-6">
              <Pressable
                onPress={pickImage}
                className="border-2 border-dashed rounded-xl h-[200px] justify-center items-center mb-4 overflow-hidden"
                style={{ borderColor: image ? 'transparent' : '#d1d5db' }}
              >
                {image ? (
                  <>
                    <Image source={{ uri: image }} className="w-full h-full absolute" />
                    <View className="absolute bottom-0 right-0 bg-black/50 rounded-tl-lg p-2">
                      <Ionicons name="camera" size={20} color="white" />
                    </View>
                  </>
                ) : (
                  <View className="items-center">
                    <Ionicons name="cloud-upload-outline" size={50} color="#9ca3af" />
                    <Text className="text-gray-500 mt-2 font-medium">Upload Product Image</Text>
                    <Text className="text-gray-400 text-sm">Tap to select</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Product Name</Text>
              <TextInput
                placeholder="Enter product name"
                value={productName}
                onChangeText={setProductName}
                onFocus={() => setActiveField('productName')}
                onBlur={() => setActiveField(null)}
                className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'productName' ? 'border-indigo-500' : 'border-gray-300'}`}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                placeholder="Enter product description"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setActiveField('description')}
                onBlur={() => setActiveField(null)}
                multiline
                numberOfLines={4}
                className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'description' ? 'border-indigo-500' : 'border-gray-300'}`}
                style={{ textAlignVertical: 'top', minHeight: 100 }}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
              <View className={`border rounded-lg overflow-hidden ${activeField === 'category' ? 'border-indigo-500' : 'border-gray-300'}`}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                  onFocus={() => setActiveField('category')}
                  onBlur={() => setActiveField(null)}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="Select a category" value="" />
                  {categories.map((category) => (
                    <Picker.Item key={category.id} label={category.categoryName} value={category.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="flex-row justify-end mt-6">
              <TouchableOpacity
                onPress={handleNextStep}
                className="bg-indigo-600 px-6 py-3 rounded-lg flex-row items-center"
              >
                <Text className="text-white font-medium mr-2">Next</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            className="w-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }]
            }}
          >
            <Text className="text-lg font-semibold text-gray-700 mb-2">Pricing & Inventory</Text>

            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-gray-700">Product Status</Text>
                <View className="flex-row items-center">
                  <Text className={`text-xs mr-2 ${status ? 'text-green-600' : 'text-gray-500'}`}>
                    {status ? 'Active' : 'Inactive'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStatus(!status);
                      Vibration.vibrate(20);
                    }}
                    className={`w-12 h-6 rounded-full flex-row items-center px-1 ${status ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
                  >
                    <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Price (ETB)</Text>
              <View className="relative">
                <TextInput
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  onFocus={() => setActiveField('price')}
                  onBlur={() => setActiveField(null)}
                  className={`bg-white border rounded-lg pl-12 pr-4 py-3 text-gray-700 ${activeField === 'price' ? 'border-indigo-500' : 'border-gray-300'}`}
                />
                <Text className="absolute left-3 top-3 text-gray-500">ETB</Text>
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-gray-700">Has Discount?</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Toggle discount and vibrate
                    setHasDiscount(!hasDiscount);
                    Vibration.vibrate(20);
                  }}
                  className={`w-12 h-6 rounded-full flex-row items-center px-1 ${hasDiscount ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'}`}
                >
                  <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </TouchableOpacity>
              </View>

              {hasDiscount && (
                <View className="bg-indigo-50 rounded-lg p-4 mb-2">
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Discount Price (ETB)</Text>
                    <View className="relative">
                      <TextInput
                        placeholder="0.00"
                        value={discountPrice}
                        onChangeText={setDiscountPrice}
                        keyboardType="numeric"
                        onFocus={() => setActiveField('discountPrice')}
                        onBlur={() => setActiveField(null)}
                        className={`bg-white border rounded-lg pl-12 pr-4 py-3 text-gray-700 ${activeField === 'discountPrice' ? 'border-indigo-500' : 'border-gray-300'}`}
                      />
                      <Text className="absolute left-3 top-3 text-gray-500">ETB</Text>
                    </View>

                    {price && discountPrice && !isNaN(parseFloat(price)) && !isNaN(parseFloat(discountPrice)) && parseFloat(price) > 0 && parseFloat(discountPrice) > 0 ? (
                      <View className="mt-3 bg-white rounded-lg p-3 border border-indigo-100">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs text-gray-700">Original Price:</Text>
                          <Text className="text-xs font-medium text-gray-700">ETB {parseFloat(price).toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-1">
                          <Text className="text-xs text-gray-700">Discount Price:</Text>
                          <Text className="text-xs font-medium text-green-700">ETB {parseFloat(discountPrice).toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-1 pt-1 border-t border-gray-100">
                          <Text className="text-xs text-gray-700">Customer Saves:</Text>
                          <View className="flex-row items-center">
                            <Text className="text-xs font-medium text-indigo-600">ETB {(parseFloat(price) - parseFloat(discountPrice)).toFixed(2)}</Text>
                            <View className="ml-2 bg-red-100 rounded-full px-2 py-0.5">
                              <Text className="text-xs text-red-700 font-medium">
                                {Math.round((1 - parseFloat(discountPrice) / parseFloat(price)) * 100)}% off
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : discountPrice && parseFloat(discountPrice) >= parseFloat(price) ? (
                      <Text className="mt-2 text-xs text-red-500">
                        Discount price must be lower than regular price
                      </Text>
                    ) : null}
                  </View>

                  <View className="flex-row space-x-4 mb-1">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">Start Date</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        value={discountStartDate}
                        onChangeText={setDiscountStartDate}
                        onFocus={() => setActiveField('discountStartDate')}
                        onBlur={() => setActiveField(null)}
                        className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'discountStartDate' ? 'border-indigo-500' : 'border-gray-300'}`}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">End Date</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        value={discountEndDate}
                        onChangeText={setDiscountEndDate}
                        onFocus={() => setActiveField('discountEndDate')}
                        onBlur={() => setActiveField(null)}
                        className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'discountEndDate' ? 'border-indigo-500' : 'border-gray-300'}`}
                      />
                    </View>
                  </View>

                  <Text className="text-xs text-gray-500 italic mt-1">
                    Enter dates in YYYY-MM-DD format
                  </Text>
                </View>
              )}
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-gray-700">Special Offer</Text>
                <TouchableOpacity
                  onPress={() => {
                    setHasSpecialOffer(!hasSpecialOffer);
                    Vibration.vibrate(20);
                  }}
                  className={`w-12 h-6 rounded-full flex-row items-center px-1 ${hasSpecialOffer ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'}`}
                >
                  <View className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </TouchableOpacity>
              </View>

              {hasSpecialOffer && (
                <View className="bg-indigo-50 rounded-lg p-4 mb-2">
                  <View className="flex-row space-x-4 mb-1">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">Buy Quantity</Text>
                      <TextInput
                        placeholder="e.g. 10"
                        value={specialOfferQuantity}
                        onChangeText={setSpecialOfferQuantity}
                        keyboardType="numeric"
                        onFocus={() => setActiveField('specialOfferQuantity')}
                        onBlur={() => setActiveField(null)}
                        className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'specialOfferQuantity' ? 'border-indigo-500' : 'border-gray-300'}`}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">Discount %</Text>
                      <View className="relative">
                        <TextInput
                          placeholder="e.g. 10"
                          value={specialOfferDiscount}
                          onChangeText={setSpecialOfferDiscount}
                          keyboardType="numeric"
                          onFocus={() => setActiveField('specialOfferDiscount')}
                          onBlur={() => setActiveField(null)}
                          className={`bg-white border rounded-lg px-4 py-3 pr-8 text-gray-700 ${activeField === 'specialOfferDiscount' ? 'border-indigo-500' : 'border-gray-300'}`}
                        />
                        <Text className="absolute right-3 top-3 text-gray-500">%</Text>
                      </View>
                    </View>
                  </View>

                  <View className="bg-white rounded-lg border border-indigo-100 mt-2 p-3">
                    {specialOfferQuantity && specialOfferDiscount && !isNaN(parseInt(specialOfferQuantity)) && !isNaN(parseInt(specialOfferDiscount)) ? (
                      <>
                        <Text className="text-xs font-semibold text-indigo-800 text-center mb-2">
                          Buy {specialOfferQuantity} or more and get {specialOfferDiscount}% off!
                        </Text>

                        {price && !isNaN(parseFloat(price)) && parseFloat(price) > 0 ? (
                          <View className="flex-row items-center justify-center">
                            <Text className="text-xs text-gray-600">Unit price:</Text>
                            <Text className="text-xs font-medium text-gray-800 mx-1">ETB {parseFloat(price).toFixed(2)}</Text>
                            <Text className="text-xs text-gray-600 mr-1">→</Text>
                            <Text className="text-xs font-medium text-green-700">
                              ETB {(parseFloat(price) * (1 - parseInt(specialOfferDiscount) / 100)).toFixed(2)}
                            </Text>
                            <Text className="text-xs text-gray-500 ml-1">per unit</Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text className="text-xs text-indigo-800 font-medium text-center">
                        Enter quantity and discount percentage
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Stock Quantity</Text>
                <TextInput
                  placeholder="Enter quantity"
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  keyboardType="numeric"
                  onFocus={() => setActiveField('stockQuantity')}
                  onBlur={() => setActiveField(null)}
                  className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'stockQuantity' ? 'border-indigo-500' : 'border-gray-300'}`}
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Unit Type</Text>
                <TextInput
                  placeholder="e.g. kg, piece"
                  value={unitType}
                  onChangeText={setUnitType}
                  onFocus={() => setActiveField('unitType')}
                  onBlur={() => setActiveField(null)}
                  className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'unitType' ? 'border-indigo-500' : 'border-gray-300'}`}
                />
              </View>
            </View>

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={handlePreviousStep}
                className="border border-gray-300 px-6 py-3 rounded-lg flex-row items-center"
              >
                <Ionicons name="arrow-back" size={16} color="#4b5563" />
                <Text className="text-gray-700 font-medium ml-2">Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextStep}
                className="bg-indigo-600 px-6 py-3 rounded-lg flex-row items-center"
              >
                <Text className="text-white font-medium mr-2">Next</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            className="w-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }]
            }}
          >
            <Text className="text-lg font-semibold text-gray-700 mb-2">Additional Details</Text>

            <View className="bg-white border border-gray-200 rounded-lg mb-5">
              <View className="p-3 border-b border-gray-200 flex-row justify-between items-center">
                <Text className="text-sm font-medium text-gray-700">Timestamps</Text>
                <Text className="text-xs text-gray-500">Auto-generated</Text>
              </View>
              <View className="p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-gray-500">Date Added:</Text>
                  <Text className="text-xs text-gray-700">{new Date().toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-500">Last Updated:</Text>
                  <Text className="text-xs text-gray-700">{new Date().toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Brand</Text>
              <TextInput
                placeholder="Enter brand name"
                value={brand}
                onChangeText={setBrand}
                onFocus={() => setActiveField('brand')}
                onBlur={() => setActiveField(null)}
                className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'brand' ? 'border-indigo-500' : 'border-gray-300'}`}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Supplier</Text>
              <TextInput
                placeholder="Enter supplier name"
                value={supplier}
                onChangeText={setSupplier}
                onFocus={() => setActiveField('supplier')}
                onBlur={() => setActiveField(null)}
                className={`bg-white border rounded-lg px-4 py-3 text-gray-700 ${activeField === 'supplier' ? 'border-indigo-500' : 'border-gray-300'}`}
              />
            </View>

            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Production Date</Text>
                <TouchableOpacity
                  onPress={() => setShowProductionDatePicker(true)}
                  className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                >
                  <Text className="text-gray-600">
                    {productionDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
                </TouchableOpacity>
                {dateErrors.productionDate && (
                  <Text className="text-red-500 text-sm mt-1">{dateErrors.productionDate}</Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Expiration Date</Text>
                <TouchableOpacity
                  onPress={() => setShowExpiryDatePicker(true)}
                  className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                >
                  <Text className="text-gray-600">
                    {expiryDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
                </TouchableOpacity>
                {dateErrors.expiryDate && (
                  <Text className="text-red-500 text-sm mt-1">{dateErrors.expiryDate}</Text>
                )}
              </View>
            </View>

            {showProductionDatePicker && (
              <DateTimePicker
                value={productionDate}
                mode="date"
                display="default"
                onChange={onProductionDateChange}
                maximumDate={new Date()}
              />
            )}

            {showExpiryDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={onExpiryDateChange}
                minimumDate={new Date()}
              />
            )}

            <View className="mb-4 mt-4">
              <Text className="text-sm font-medium text-gray-500 mb-2">Product Preview</Text>
              <View className="bg-white rounded-lg border border-gray-200 p-4">
                <View className="flex-row mb-3">
                  {image ? (
                    <Image source={{ uri: image }} className="w-20 h-20 rounded-lg mr-4" />
                  ) : (
                    <View className="w-20 h-20 rounded-lg bg-gray-200 mr-4 justify-center items-center">
                      <Ionicons name="image-outline" size={24} color="#9ca3af" />
                    </View>
                  )}

                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text className="font-semibold text-gray-800">{productName || "Product Name"}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${status ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Text className={`text-xs font-medium ${status ? 'text-green-800' : 'text-gray-800'}`}>
                          {status ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-500 mb-1">{description ? (description.length > 50 ? description.substring(0, 50) + "..." : description) : "Product description"}</Text>
                    <View className="flex-row items-center">
                      {hasDiscount && discountPrice && !isNaN(parseFloat(discountPrice)) && !isNaN(parseFloat(price)) && parseFloat(discountPrice) < parseFloat(price) ? (
                        <>
                          <Text className="font-bold text-indigo-600">ETB {parseFloat(discountPrice).toFixed(2)}</Text>
                          <Text className="text-sm text-gray-500 line-through ml-2">ETB {parseFloat(price).toFixed(2)}</Text>
                          <View className="ml-2 bg-red-100 rounded-full px-2 py-0.5">
                            <Text className="text-xs text-red-700 font-medium">
                              {Math.round((1 - parseFloat(discountPrice) / parseFloat(price)) * 100)}% off
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text className="font-bold text-indigo-600">ETB {price ? parseFloat(price).toFixed(2) : "0.00"}</Text>
                      )}
                    </View>
                    {hasDiscount && discountStartDate && discountEndDate && (
                      <Text className="text-xs text-gray-500 mt-1">Sale: {discountStartDate} to {discountEndDate}</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row justify-between mt-1">
                  <View className="bg-gray-50 px-2 py-1 rounded-md">
                    <Text className="text-xs text-gray-600">Stock: {stockQuantity || "0"} {unitType || "units"}</Text>
                  </View>
                  <View className="bg-gray-50 px-2 py-1 rounded-md">
                    <Text className="text-xs text-gray-600">Added: {new Date().toLocaleDateString()}</Text>
                  </View>
                </View>

                {hasSpecialOffer && specialOfferQuantity && specialOfferDiscount && (
                  <View className="mt-3 bg-indigo-50 rounded-lg p-2">
                    <View className="flex-row items-center">
                      <View className="w-6 h-6 rounded-full bg-indigo-100 mr-2 justify-center items-center">
                        <Ionicons name="pricetag" size={14} color="#4f46e5" />
                      </View>
                      <Text className="text-xs font-medium text-indigo-700">
                        Special Offer: Buy {specialOfferQuantity} or more and get {specialOfferDiscount}% off!
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={handlePreviousStep}
                className="border border-gray-300 px-6 py-3 rounded-lg flex-row items-center"
              >
                <Ionicons name="arrow-back" size={16} color="#4b5563" />
                <Text className="text-gray-700 font-medium ml-2">Back</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  onPress={addProduct}
                  disabled={isLoading}
                  className="bg-indigo-600 px-6 py-3 rounded-lg flex-row items-center"
                >
                  {isLoading ? (
                    <View className="flex-row items-center">
                      <View className="h-5 w-5 mr-2">
                        {Platform.OS === 'ios' ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <ActivityIndicator color="#ffffff" size="small" />
                        )}
                      </View>
                      <Text className="text-white font-medium">Adding...</Text>
                    </View>
                  ) : (
                    <>
                      <Text className="text-white font-medium mr-2">Add Product</Text>
                      <Ionicons name="checkmark-circle" size={16} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-gray-200 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color="#4b5563" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-800">Add New Product</Text>

          <TouchableOpacity
            onPress={resetForm}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Ionicons name="refresh" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          {renderStepIndicator()}
          {renderFormStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}