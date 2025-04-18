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
import { db, auth } from "../../../firebase/firebaseConfig";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AddCategory() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Check if we're in edit mode
    const isEditMode = params.editMode === "true";
    const categoryId = params.categoryId;

    // State variables
    const [categoryName, setCategoryName] = useState(isEditMode ? params.name : "");
    const [description, setDescription] = useState(isEditMode ? params.description : "");
    const [image, setImage] = useState(isEditMode ? params.imageUrl : null);
    const [isActive, setIsActive] = useState(isEditMode ? params.isActive === "true" : true);
    const [discountAvailable, setDiscountAvailable] = useState(isEditMode ? params.discountAvailable === "true" : false);
    const [discountPercentage, setDiscountPercentage] = useState(isEditMode ? params.discountPercentage : "");
    const [isLoading, setIsLoading] = useState(false);
    const [categoryAdded, setCategoryAdded] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const [errors, setErrors] = useState({
        categoryName: null,
        description: null,
        image: null,
        discountPercentage: null
    });
    const [isFocused, setIsFocused] = useState({
        categoryName: false,
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

    // Function to check if category name already exists
    const checkCategoryExists = async (categoryName) => {
        try {
            // If in edit mode and the name hasn't changed, skip this check
            if (isEditMode && categoryName === params.name) {
                return false;
            }

            const userId = auth.currentUser?.uid;
            if (!userId) return false;

            const q = query(
                collection(db, "supplier_category"),
                where("supplierId", "==", userId),
                where("name", "==", categoryName)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Error checking category:", error);
            return false;
        }
    };

    // Update validateInputs function
    const validateInputs = async () => {
        setIsValidating(true);
        const newErrors = {};

        if (!categoryName.trim()) {
            newErrors.categoryName = "Category name is required";
        } else {
            // Check if category name already exists
            const exists = await checkCategoryExists(categoryName.trim());
            if (exists) {
                newErrors.categoryName = "Category name already exists";
            }
        }

        if (!description.trim()) {
            newErrors.description = "Description is required";
        }

        // Consider both null images and empty strings as missing
        if (!image || image.trim() === '') {
            newErrors.image = "Category image is required";
        }

        if (discountAvailable) {
            if (!discountPercentage) {
                newErrors.discountPercentage = "Discount percentage is required";
            } else if (isNaN(discountPercentage) || parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100) {
                newErrors.discountPercentage = "Discount percentage must be between 0 and 100";
            }
        }

        setErrors(newErrors);
        setIsValidating(false);
        return Object.keys(newErrors).length === 0;
    };

    // Function to upload image to Firebase Storage
    const uploadImage = async (uri) => {
        try {
            // For file URIs on Android, sometimes we need to remove the 'file://' prefix
            const cleanUri = Platform.OS === 'android' && uri.startsWith('file://')
                ? uri.replace('file://', '')
                : uri;

            const response = await fetch(uri);
            const blob = await response.blob();

            // Check if blob is valid
            if (!blob || blob.size === 0) {
                console.error("Invalid blob obtained from image");
                throw new Error("Invalid image data");
            }

            const storage = getStorage();
            const fileName = `category_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const storageRef = ref(storage, `supplier_categories/${fileName}`);

            // Log for debugging
            console.log("Attempting to upload image to Firebase Storage:", fileName);

            // Upload with metadata
            const metadata = {
                contentType: 'image/jpeg',  // Default to JPEG
            };

            const uploadTask = await uploadBytes(storageRef, blob, metadata);
            console.log("Upload successful:", uploadTask);

            const downloadURL = await getDownloadURL(storageRef);
            console.log("Download URL obtained:", downloadURL);

            // Clean up the blob to prevent memory leaks
            blob.close();

            return downloadURL;
        } catch (error) {
            console.error("Detailed upload error:", error);

            // Fall back to the local URI if in development
            if (__DEV__) {
                console.warn("Development mode: Falling back to local URI for image");
                return uri;
            }

            throw new Error(`Image upload failed: ${error.message}`);
        }
    };

    // Update saveCategory function
    const saveCategory = async () => {
        if (!(await validateInputs())) {
            shakeAnimation();
            return;
        }

        setIsLoading(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert("Error", "You need to be logged in to add categories");
                setIsLoading(false);
                return;
            }

            // Upload image if it's a local URI (starts with 'file:')
            let imageUrl = image;

            try {
                if (image && image.startsWith('file:')) {
                    console.log("Uploading image to Firebase Storage...");
                    imageUrl = await uploadImage(image);
                    console.log("Image uploaded successfully:", imageUrl);
                }
            } catch (imageUploadError) {
                console.error("Image upload failed, continuing with local URI:", imageUploadError);
                // If image upload fails, we'll continue with the local URI in development
                // or use a placeholder in production
                if (!__DEV__) {
                    // In production, use a placeholder image
                    imageUrl = "https://via.placeholder.com/400x300?text=Category+Image";
                    Alert.alert(
                        "Warning",
                        "Failed to upload image. Using placeholder image instead. You can edit the category later to try again.",
                        [{ text: "Continue" }]
                    );
                }
            }

            console.log("Proceeding with category save, image URL:", imageUrl);

            if (isEditMode) {
                // When updating, do not include createdAt in the update data
                const updateData = {
                    name: categoryName.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl,
                    isActive: isActive,
                    supplierId: userId,
                    productCount: parseInt(params.productCount) || 0,
                    discountAvailable: discountAvailable,
                    discountPercentage: discountAvailable ? parseFloat(discountPercentage) : 0,
                    updatedAt: serverTimestamp()
                };

                console.log("Updating category data:", updateData);

                const categoryRef = doc(db, "supplier_category", categoryId);
                await updateDoc(categoryRef, updateData);
                console.log("Category updated successfully");
            } else {
                // For new categories, include createdAt
                const newCategoryData = {
                    name: categoryName.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl,
                    isActive: isActive,
                    supplierId: userId,
                    productCount: 0,
                    discountAvailable: discountAvailable,
                    discountPercentage: discountAvailable ? parseFloat(discountPercentage) : 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                console.log("Saving new category data:", newCategoryData);

                // Add the new category and get the document reference
                const docRef = await addDoc(collection(db, "supplier_category"), newCategoryData);
                console.log("New category added with ID:", docRef.id);

                try {
                    // Create an empty document in the products subcollection to initialize it
                    // This ensures the subcollection exists even with no products
                    const productsSubcollectionRef = collection(db, "supplier_category", docRef.id, "products");
                    await addDoc(productsSubcollectionRef, {
                        _placeholder: true,
                        createdAt: serverTimestamp(),
                        supplierId: userId
                    });
                    console.log("Products subcollection initialized");
                } catch (subcollectionError) {
                    console.error("Failed to initialize products subcollection:", subcollectionError);
                    // Continue anyway as this is not critical
                }
            }

            setCategoryAdded(true);
            Vibration.vibrate(50);

            Alert.alert(
                "Success",
                isEditMode ? "Category updated successfully" : "Category added successfully",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.push("/suplier/(tabs)/categories");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Error saving category:", error);
            Alert.alert(
                "Error",
                "Failed to save category: " + (error.message || "Please try again."),
                [{ text: "OK" }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Function to select an image
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
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setImage(uri);

                // Vibrate on success
                Vibration.vibrate(30);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image. Please try again.");
        }
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
                            onPress={() => router.push("/suplier/(tabs)/categories")}
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
                                colors={['#3b82f6', '#2563eb']}
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
                                        <Text className="text-blue-100 text-xs">
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
                                            className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.categoryName ? 'border-red-500' : isFocused.categoryName ? 'border-blue-500' : 'border-gray-300'}`}
                                            placeholder="Enter category name"
                                            value={categoryName}
                                            onChangeText={setCategoryName}
                                            onFocus={() => setIsFocused({ ...isFocused, categoryName: true })}
                                            onBlur={() => setIsFocused({ ...isFocused, categoryName: false })}
                                        />
                                        <Ionicons
                                            name="pricetag"
                                            size={18}
                                            color={errors.categoryName ? "#ef4444" : isFocused.categoryName ? "#3b82f6" : "#9ca3af"}
                                            style={{ position: 'absolute', left: 12, top: 14 }}
                                        />
                                        {isValidating && errors.categoryName && (
                                            <Text className="text-red-500 text-xs mt-1 ml-1">{errors.categoryName}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Description Input */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                                    <View className="relative">
                                        <TextInput
                                            className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.description ? 'border-red-500' : isFocused.description ? 'border-blue-500' : 'border-gray-300'}`}
                                            placeholder="Enter category description"
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            numberOfLines={3}
                                            style={{ textAlignVertical: 'top', minHeight: 80 }}
                                            onFocus={() => setIsFocused({ ...isFocused, description: true })}
                                            onBlur={() => setIsFocused({ ...isFocused, description: false })}
                                        />
                                        <Ionicons
                                            name="document-text"
                                            size={18}
                                            color={errors.description ? "#ef4444" : isFocused.description ? "#3b82f6" : "#9ca3af"}
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
                                            <Text className={`text-xs mr-2 ${discountAvailable ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {discountAvailable ? 'Enabled' : 'Disabled'}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setDiscountAvailable(!discountAvailable);
                                                    Vibration.vibrate(20);
                                                }}
                                                className={`w-12 h-6 rounded-full flex-row items-center px-1 ${discountAvailable ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
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
                                    <View className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</Text>
                                        <View className="relative">
                                            <TextInput
                                                className={`bg-white border rounded-lg px-4 py-3 pl-10 text-gray-700 ${errors.discountPercentage ? 'border-red-500' : isFocused.discountPercentage ? 'border-blue-500' : 'border-gray-300'}`}
                                                placeholder="Enter discount percentage (e.g. 10)"
                                                value={discountPercentage}
                                                onChangeText={setDiscountPercentage}
                                                keyboardType="numeric"
                                                maxLength={2}
                                                onFocus={() => setIsFocused({ ...isFocused, discountPercentage: true })}
                                                onBlur={() => setIsFocused({ ...isFocused, discountPercentage: false })}
                                            />
                                            <FontAwesome5
                                                name="percent"
                                                size={15}
                                                color={errors.discountPercentage ? "#ef4444" : isFocused.discountPercentage ? "#3b82f6" : "#9ca3af"}
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
                                        onPress={pickImage}
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
                                                    <View className="absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded-md flex-row items-center">
                                                        <FontAwesome5 name="tags" size={12} color="white" style={{ marginRight: 4 }} />
                                                        <Text className="text-white font-bold text-xs">{discountPercentage || '0'}% OFF</Text>
                                                    </View>
                                                )}
                                            </Animated.View>
                                        ) : (
                                            <View className="items-center">
                                                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                                                <Text className="text-gray-500 mt-2 font-medium">Upload Category Image</Text>
                                                <Text className="text-gray-400 text-xs mt-1">Tap to select (4:3 ratio recommended)</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    {isValidating && errors.image && (
                                        <Text className="text-red-500 text-xs mt-1 ml-1">{errors.image}</Text>
                                    )}
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    className={`rounded-lg py-3 px-4 ${isLoading ? 'bg-blue-300' : 'bg-blue-600'}`}
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
                                        className="mt-3 rounded-lg py-3 px-4 border border-blue-600"
                                        onPress={() => router.push("/suplier/(tabs)/categories")}
                                    >
                                        <Text className="text-blue-600 text-center font-semibold">View Categories</Text>
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