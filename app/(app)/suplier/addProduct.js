import React, { useState, useEffect, useRef } from "react";
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Vibration,
    Pressable,
    SafeAreaView,
    Modal,
    FlatList
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Ionicons,
    AntDesign,
    MaterialCommunityIcons,
    Feather,
    FontAwesome
} from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from "../../../firebase/firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    serverTimestamp,
    updateDoc,
    increment,
    orderBy
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get("window");

const CustomDropdown = ({ items, selectedValue, onValueChange, placeholder, isActive, setActive, clearActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = items.find(item => item.id === selectedValue);

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.customDropdown,
                    isActive && styles.activeInput
                ]}
                onPress={() => {
                    setIsOpen(true);
                    setActive();
                }}
            >
                <View style={styles.selectedItemContainer}>
                    <MaterialCommunityIcons name="folder-outline" size={18} color="#6b7280" style={{ marginRight: 8 }} />
                    <Text style={selectedValue ? styles.selectedItemText : styles.placeholderText}>
                        {selectedItem ? selectedItem.name : placeholder}
                    </Text>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setIsOpen(false);
                    clearActive();
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setIsOpen(false);
                        clearActive();
                    }}
                >
                    <View style={styles.dropdownModal}>
                        <FlatList
                            data={[{ id: '', name: placeholder }, ...items]}
                            keyExtractor={item => item.id || 'placeholder'}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.dropdownItem,
                                        item.id === selectedValue && styles.selectedDropdownItem
                                    ]}
                                    onPress={() => {
                                        onValueChange(item.id);
                                        setIsOpen(false);
                                        clearActive();
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownItemText,
                                            item.id === selectedValue && styles.selectedDropdownItemText
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    {item.id === selectedValue && (
                                        <Ionicons name="checkmark" size={18} color="#3b82f6" />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.dropdownList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default function AddProduct() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { categoryId, categoryName } = params;

    // Animation values using reanimated 2
    const fadeAnim = useSharedValue(0);
    const translateYAnim = useSharedValue(50);
    const buttonScaleAnim = useSharedValue(1);

    // Animated styles
    const fadeAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: fadeAnim.value,
            transform: [{ translateY: translateYAnim.value }]
        };
    });

    const buttonAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: buttonScaleAnim.value }]
        };
    });

    // Ref for scrolling
    const scrollViewRef = useRef(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [activeField, setActiveField] = useState(null);
    const [formError, setFormError] = useState("");

    // Product form state
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productQuantity, setProductQuantity] = useState("");
    const [productUnit, setProductUnit] = useState("");
    const [productImage, setProductImage] = useState(null);
    const [brand, setBrand] = useState("");
    const [status, setStatus] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || "");
    const [allCategories, setAllCategories] = useState([]);
    const [imageChanged, setImageChanged] = useState(false);

    // Fetch category details on load
    useEffect(() => {
        // Start animations when component mounts
        fadeAnim.value = withTiming(1, { duration: 600 });
        translateYAnim.value = withTiming(0, { duration: 600 });

        if (categoryId) {
            fetchCategoryDetails();
        } else {
            // If no category ID is provided, load all categories
            fetchAllCategories();
        }
    }, [categoryId]);

    // Fetch all categories
    const fetchAllCategories = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                setLoading(false);
                return;
            }

            let categoriesList = [];

            // Try first with the compound query (requires Firebase index)
            try {
                console.log("Fetching categories with compound query...");
                const q = query(
                    collection(db, 'supplier_category'),
                    where("supplierId", "==", userId),
                    orderBy("name", "asc")
                );

                const querySnapshot = await getDocs(q);
                categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`Found ${categoriesList.length} categories with compound query`);
            } catch (indexError) {
                // Fall back to simple query without sorting if index error occurs
                console.log("Index error occurred, falling back to simple query:", indexError.message);
                try {
                    const simpleQuery = query(
                        collection(db, 'supplier_category'),
                        where("supplierId", "==", userId)
                    );

                    const querySnapshot = await getDocs(simpleQuery);
                    categoriesList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort in memory since we can't use orderBy without the index
                    categoriesList.sort((a, b) => {
                        const nameA = a.name ? a.name.toLowerCase() : '';
                        const nameB = b.name ? b.name.toLowerCase() : '';
                        return nameA.localeCompare(nameB);
                    });

                    console.log(`Found ${categoriesList.length} categories with simple query`);
                } catch (simpleQueryError) {
                    console.error("Error with simple query:", simpleQueryError);
                    Alert.alert(
                        "Error",
                        "Failed to load categories. Please try again later.",
                        [{ text: "OK" }]
                    );
                }
            }

            console.log("Setting categories list:", categoriesList);
            setAllCategories(categoriesList);

            // If categories are available and no category is selected, select the first one
            if (categoriesList.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(categoriesList[0].id);
                console.log("Auto-selected category ID:", categoriesList[0].id);
            } else if (categoriesList.length === 0) {
                console.log("No categories found. Redirecting to add category page...");
                Alert.alert(
                    "No Categories Found",
                    "You need to create a category first before adding products.",
                    [
                        {
                            text: "Create Category",
                            onPress: () => {
                                router.push({
                                    pathname: "/suplier/(tabs)/addCategory",
                                    params: { mode: "addProduct" }
                                });
                            }
                        }
                    ]
                );
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setLoading(false);
            Alert.alert(
                "Error",
                "Failed to load categories. Please try again later.",
                [{ text: "OK" }]
            );
        }
    };

    // Fetch category details
    const fetchCategoryDetails = async () => {
        try {
            setLoading(true);
            const categoryRef = doc(db, 'supplier_category', categoryId);
            const categoryDoc = await getDoc(categoryRef);

            if (categoryDoc.exists()) {
                // If category exists, select it
                setSelectedCategoryId(categoryId);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching category:", error);
            setLoading(false);
        }
    };

    // Pick image from library
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
                setProductImage(result.assets[0].uri);
                setImageChanged(true);

                // Provide haptic feedback
                if (Platform.OS === 'ios') {
                    try {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch (e) {
                        Vibration.vibrate(30);
                    }
                } else {
                    Vibration.vibrate(30);
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to select image. Please try again.");
        }
    };

    // Upload image to Firebase Storage
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
            const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const storageRef = ref(storage, `supplier_products/${fileName}`);

            // Log for debugging
            console.log("Attempting to upload product image to Firebase Storage:", fileName);

            // Upload with metadata
            const metadata = {
                contentType: 'image/jpeg',  // Default to JPEG
            };

            const uploadTask = await uploadBytes(storageRef, blob, metadata);
            console.log("Product image upload successful:", uploadTask);

            const downloadURL = await getDownloadURL(storageRef);
            console.log("Product image download URL obtained:", downloadURL);

            // Clean up the blob to prevent memory leaks
            blob.close();

            return downloadURL;
        } catch (error) {
            console.error("Detailed product image upload error:", error);

            // Fall back to the local URI if in development
            if (__DEV__) {
                console.warn("Development mode: Falling back to local URI for product image");
                return uri;
            }

            throw new Error(`Product image upload failed: ${error.message}`);
        }
    };

    // Validate form
    const validateForm = () => {
        // Validate based on current step
        if (currentStep === 1) {
            if (!productImage) {
                setFormError("Product image is required");
                return false;
            }

            if (!productName.trim()) {
                setFormError("Product name is required");
                return false;
            }

            if (!selectedCategoryId) {
                setFormError("Please select a category");
                return false;
            }
        }
        else if (currentStep === 2) {
            if (!productPrice || isNaN(parseFloat(productPrice)) || parseFloat(productPrice) <= 0) {
                setFormError("Valid price is required");
                return false;
            }

            if (!productQuantity || isNaN(parseInt(productQuantity)) || parseInt(productQuantity) <= 0) {
                setFormError("Valid quantity is required");
                return false;
            }

            if (!productUnit.trim()) {
                setFormError("Unit type is required");
                return false;
            }
        }

        setFormError("");
        return true;
    };

    // Animation optimization helper
    const performAnimationWithOptimization = (animValue, endValue = 1, duration = 200, initialValue = 0.7) => {
        // Use withTiming instead of withSequence for better performance
        animValue.value = withTiming(initialValue, { duration: duration / 2 });

        // Use setTimeout to prevent UI thread blocking
        setTimeout(() => {
            animValue.value = withTiming(endValue, { duration: duration / 2 });
        }, 10);
    };

    // Reset form
    const resetForm = () => {
        setProductName("");
        setProductDescription("");
        setProductPrice("");
        setProductQuantity("");
        setProductUnit("piece");
        setProductImage(null);
        setBrand("");
        setStatus(true);
        setFormError("");
        setCurrentStep(1);

        // Optimize form reset animation
        performAnimationWithOptimization(fadeAnim, 1, 300);
    };

    // Handle step navigation
    const handleNextStep = () => {
        if (!validateForm()) return;

        if (currentStep < 3) {
            // Optimize step transition animation
            performAnimationWithOptimization(fadeAnim, 1, 200);

            setCurrentStep(currentStep + 1);

            // Scroll to top when changing steps
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
            }
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            // Optimize step transition animation
            performAnimationWithOptimization(fadeAnim, 1, 200);

            setCurrentStep(currentStep - 1);

            // Scroll to top when changing steps
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
            }
        }
    };

    // Add new product
    const handleAddProduct = async () => {
        try {
            if (!validateForm()) return;

            setSubmitLoading(true);

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

            // Optimize button animation
            performAnimationWithOptimization(buttonScaleAnim, 1, 150, 0.95);

            // Upload image first
            const imageUrl = await uploadImage(productImage);

            // Get current user ID
            const userId = auth.currentUser?.uid;

            if (!userId) {
                Alert.alert("Error", "You need to be logged in to add products");
                setSubmitLoading(false);
                return;
            }

            // Get category name
            let categoryNameToUse = categoryName;
            if (!categoryNameToUse && selectedCategoryId) {
                const selectedCategory = allCategories.find(c => c.id === selectedCategoryId);
                if (selectedCategory) {
                    categoryNameToUse = selectedCategory.name;
                } else {
                    // Fetch category name from Firestore
                    const categoryRef = doc(db, 'supplier_category', selectedCategoryId);
                    const categoryDoc = await getDoc(categoryRef);
                    if (categoryDoc.exists()) {
                        categoryNameToUse = categoryDoc.data().name;
                    } else {
                        categoryNameToUse = "Unknown Category";
                    }
                }
            }

            // Add product to Firestore as a subcollection of the category
            const categoryProductsRef = collection(db, 'supplier_category', selectedCategoryId, 'products');

            const newProduct = {
                name: productName.trim(),
                description: productDescription.trim(),
                price: parseFloat(productPrice),
                quantity: parseInt(productQuantity),
                unit: productUnit,
                imageUrl: imageUrl,
                categoryId: selectedCategoryId,
                categoryName: categoryNameToUse,
                supplierId: userId,
                isActive: status,
                brand: brand.trim(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add to subcollection
            const docRef = await addDoc(categoryProductsRef, newProduct);

            // Update category product count
            const categoryRef = doc(db, 'supplier_category', selectedCategoryId);
            await updateDoc(categoryRef, {
                productCount: increment(1),
                updatedAt: serverTimestamp()
            });

            // Reset form
            resetForm();

            setSubmitLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                "Success",
                "Product added successfully",
                [
                    {
                        text: "Add Another",
                        onPress: () => { }
                    },
                    {
                        text: "Go Back",
                        onPress: () => router.back()
                    }
                ]
            );

        } catch (error) {
            console.error("Error adding product:", error);

            // Extract meaningful error message
            let errorMessage = "An error occurred. Please try again.";
            if (error.message) {
                // Clean up Firebase error messages to be more user-friendly
                if (error.message.includes("permission-denied")) {
                    errorMessage = "You don't have permission to add products to this category.";
                } else if (error.message.includes("not-found")) {
                    errorMessage = "The selected category no longer exists.";
                } else if (error.message.includes("network")) {
                    errorMessage = "Network error. Please check your connection and try again.";
                } else {
                    // Keep the original error message if it's not one of the above
                    errorMessage = error.message;
                }
            }

            setFormError(errorMessage);
            Alert.alert(
                "Error Adding Product",
                errorMessage,
                [{ text: "OK" }]
            );

            setSubmitLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Go back to previous screen
    const goBack = () => {
        router.back();
    };

    // Render step indicator
    const renderStepIndicator = () => {
        return (
            <View style={styles.stepIndicatorContainer}>
                {[1, 2, 3].map((step) => (
                    <View key={step} style={styles.stepRow}>
                        <TouchableOpacity
                            onPress={() => setCurrentStep(step)}
                            style={[
                                styles.stepCircle,
                                currentStep === step && styles.activeStepCircle
                            ]}
                        >
                            <Text style={[
                                styles.stepText,
                                currentStep === step && styles.activeStepText
                            ]}>{step}</Text>
                        </TouchableOpacity>

                        {step < 3 && (
                            <View style={[
                                styles.stepLine,
                                currentStep > step && styles.activeStepLine
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    // Render form steps
    const renderFormStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Animated.View
                        style={[
                            styles.formStep,
                            fadeAnimStyle
                        ]}
                    >
                        <Text style={styles.stepTitle}>Basic Information</Text>

                        <View style={styles.imagePickerContainer}>
                            <Pressable
                                onPress={pickImage}
                                style={[
                                    styles.imagePicker,
                                    { borderColor: productImage ? 'transparent' : '#d1d5db' }
                                ]}
                            >
                                {productImage ? (
                                    <>
                                        <Image source={{ uri: productImage }} style={styles.productImage} />
                                        <View style={styles.cameraIcon}>
                                            <Ionicons name="camera" size={20} color="white" />
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.imagePickerContent}>
                                        <Ionicons name="cloud-upload-outline" size={50} color="#9ca3af" />
                                        <Text style={styles.imagePickerText}>Upload Product Image</Text>
                                        <Text style={styles.imagePickerSubText}>Tap to select</Text>
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Product Name</Text>
                            <TextInput
                                placeholder="Enter product name"
                                value={productName}
                                onChangeText={setProductName}
                                onFocus={() => setActiveField('productName')}
                                onBlur={() => setActiveField(null)}
                                style={[
                                    styles.input,
                                    activeField === 'productName' && styles.activeInput
                                ]}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                placeholder="Enter product description"
                                value={productDescription}
                                onChangeText={setProductDescription}
                                onFocus={() => setActiveField('description')}
                                onBlur={() => setActiveField(null)}
                                multiline
                                numberOfLines={4}
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    activeField === 'description' && styles.activeInput
                                ]}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Category</Text>
                                <View style={styles.sourceBadge}>
                                    <MaterialCommunityIcons name="database" size={12} color="#4f46e5" />
                                    <Text style={styles.sourceBadgeText}>From supplier_category</Text>
                                </View>
                            </View>
                            {allCategories.length === 0 ? (
                                <View style={styles.emptyCategories}>
                                    <Text style={styles.emptyCategoriesText}>No categories found</Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/suplier/(tabs)/addCategory")}
                                        style={styles.addCategoryButton}
                                    >
                                        <Text style={styles.addCategoryButtonText}>Add Category</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <CustomDropdown
                                    items={allCategories}
                                    selectedValue={selectedCategoryId}
                                    onValueChange={setSelectedCategoryId}
                                    placeholder="Select a category"
                                    isActive={activeField === 'category'}
                                    setActive={() => setActiveField('category')}
                                    clearActive={() => setActiveField(null)}
                                />
                            )}
                            <TouchableOpacity
                                style={styles.refreshCategories}
                                onPress={fetchAllCategories}
                            >
                                <Ionicons name="refresh" size={14} color="#6b7280" />
                                <Text style={styles.refreshCategoriesText}>Refresh categories</Text>
                            </TouchableOpacity>
                        </View>

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                onPress={handleNextStep}
                                style={styles.nextButton}
                            >
                                <Text style={styles.nextButtonText}>Next</Text>
                                <Ionicons name="arrow-forward" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );

            case 2:
                return (
                    <Animated.View
                        style={[
                            styles.formStep,
                            fadeAnimStyle
                        ]}
                    >
                        <Text style={styles.stepTitle}>Pricing & Inventory</Text>

                        <View style={styles.formGroup}>
                            <View style={styles.statusRow}>
                                <Text style={styles.label}>Product Status</Text>
                                <View style={styles.statusToggleContainer}>
                                    <Text style={[
                                        styles.statusText,
                                        status && styles.activeStatusText
                                    ]}>
                                        {status ? 'Active' : 'Inactive'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setStatus(!status);
                                            Vibration.vibrate(20);
                                        }}
                                        style={[
                                            styles.statusToggle,
                                            status && styles.activeStatusToggle
                                        ]}
                                    >
                                        <View style={styles.statusToggleIndicator} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Price (Birr)</Text>
                            <View style={styles.priceInputContainer}>
                                <TextInput
                                    placeholder="0.00"
                                    value={productPrice}
                                    onChangeText={setProductPrice}
                                    keyboardType="numeric"
                                    onFocus={() => setActiveField('price')}
                                    onBlur={() => setActiveField(null)}
                                    style={[
                                        styles.input,
                                        styles.priceInput,
                                        activeField === 'price' && styles.activeInput
                                    ]}
                                />
                                <Text style={styles.currencySymbol}>Birr</Text>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Brand (Optional)</Text>
                            <TextInput
                                placeholder="Enter brand name"
                                value={brand}
                                onChangeText={setBrand}
                                onFocus={() => setActiveField('brand')}
                                onBlur={() => setActiveField(null)}
                                style={[
                                    styles.input,
                                    activeField === 'brand' && styles.activeInput
                                ]}
                            />
                        </View>

                        <View style={styles.rowContainer}>
                            <View style={[styles.formGroup, styles.flexOne, { marginRight: 8 }]}>
                                <Text style={styles.label}>Stock Quantity</Text>
                                <TextInput
                                    placeholder="Enter quantity"
                                    value={productQuantity}
                                    onChangeText={setProductQuantity}
                                    keyboardType="numeric"
                                    onFocus={() => setActiveField('quantity')}
                                    onBlur={() => setActiveField(null)}
                                    style={[
                                        styles.input,
                                        activeField === 'quantity' && styles.activeInput
                                    ]}
                                />
                            </View>

                            <View style={[styles.formGroup, styles.flexOne, { marginLeft: 8 }]}>
                                <Text style={styles.label}>Unit Type</Text>
                                <TextInput
                                    placeholder="Enter unit (e.g., kg, piece)"
                                    value={productUnit}
                                    onChangeText={setProductUnit}
                                    onFocus={() => setActiveField('unit')}
                                    onBlur={() => setActiveField(null)}
                                    style={[
                                        styles.input,
                                        activeField === 'unit' && styles.activeInput
                                    ]}
                                />
                            </View>
                        </View>

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={handlePreviousStep}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={16} color="#4b5563" />
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleNextStep}
                                style={styles.nextButton}
                            >
                                <Text style={styles.nextButtonText}>Next</Text>
                                <Ionicons name="arrow-forward" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );

            case 3:
                return (
                    <Animated.View
                        style={[
                            styles.formStep,
                            fadeAnimStyle
                        ]}
                    >
                        <Text style={styles.stepTitle}>Product Preview</Text>

                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                {productImage ? (
                                    <Image source={{ uri: productImage }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.previewImagePlaceholder}>
                                        <Ionicons name="image-outline" size={24} color="#9ca3af" />
                                    </View>
                                )}

                                <View style={styles.previewContent}>
                                    <View style={styles.previewTitleRow}>
                                        <Text style={styles.previewTitle}>{productName || "Product Name"}</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            status ? styles.activeBadge : styles.inactiveBadge
                                        ]}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                status ? styles.activeBadgeText : styles.inactiveBadgeText
                                            ]}>
                                                {status ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.previewDescription}>{
                                        productDescription
                                            ? (productDescription.length > 50
                                                ? productDescription.substring(0, 50) + "..."
                                                : productDescription)
                                            : "Product description"
                                    }</Text>
                                    <View style={styles.previewPriceRow}>
                                        <Text style={styles.previewPrice}>Birr {
                                            productPrice ? parseFloat(productPrice).toFixed(2) : "0.00"
                                        }</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.previewFooter}>
                                <View style={styles.previewBadge}>
                                    <Text style={styles.previewBadgeText}>Stock: {productQuantity || "0"} {productUnit || "units"}</Text>
                                </View>
                                <View style={styles.previewBadge}>
                                    <Text style={styles.previewBadgeText}>Added: {new Date().toLocaleDateString()}</Text>
                                </View>
                            </View>

                            {brand && (
                                <View style={styles.brandContainer}>
                                    <Text style={styles.brandText}>Brand: {brand}</Text>
                                </View>
                            )}

                        </View>

                        <View style={styles.categoryInfo}>
                            <MaterialCommunityIcons name="folder-outline" size={20} color="#4b5563" />
                            <Text style={styles.categoryInfoText}>
                                Category: <Text style={styles.categoryName}>
                                    {categoryName || allCategories.find(c => c.id === selectedCategoryId)?.name || "Unknown"}
                                </Text>
                            </Text>
                        </View>

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={handlePreviousStep}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={16} color="#4b5563" />
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>

                            <Animated.View style={buttonAnimStyle}>
                                <TouchableOpacity
                                    onPress={handleAddProduct}
                                    disabled={submitLoading}
                                    style={styles.submitButton}
                                >
                                    {submitLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <View style={styles.submitButtonContent}>
                                            <Text style={styles.submitButtonText}>Add Product</Text>
                                            <Ionicons name="checkmark-circle" size={16} color="white" />
                                        </View>
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
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardContainer}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={goBack}
                        style={styles.backButtonRound}
                    >
                        <Ionicons name="arrow-back" size={20} color="#4b5563" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {categoryId ? `Add Product to ${categoryName}` : "Add New Product"}
                    </Text>

                    <TouchableOpacity
                        onPress={resetForm}
                        style={styles.resetButton}
                    >
                        <Ionicons name="refresh" size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {renderStepIndicator()}
                        {renderFormStep()}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    backButtonRound: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    resetButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    stepIndicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        paddingTop: 16,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    activeStepCircle: {
        backgroundColor: "#3b82f6",
    },
    completedStepCircle: {
        backgroundColor: "#10b981",
    },
    stepText: {
        fontSize: 12,
        color: "#6b7280",
    },
    activeStepText: {
        color: "#3b82f6",
        fontWeight: "500",
    },
    completedStepText: {
        color: "#10b981",
        fontWeight: "500",
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
    },
    activeStepNumber: {
        color: "white",
    },
    completedStepNumber: {
        color: "white",
    },
    stepDivider: {
        height: 2,
        backgroundColor: "#e5e7eb",
        flex: 1,
        marginHorizontal: 8,
    },
    activeDivider: {
        backgroundColor: "#3b82f6",
    },
    formStep: {
        marginTop: 8,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 16,
    },
    imagePickerContainer: {
        marginBottom: 16,
    },
    imagePicker: {
        width: "100%",
        height: 200,
        backgroundColor: "#f3f4f6",
        borderWidth: 2,
        borderStyle: "dashed",
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    imagePickerContent: {
        alignItems: "center",
    },
    imagePickerText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#6b7280",
        marginTop: 8,
    },
    imagePickerSubText: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 4,
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    cameraIcon: {
        position: "absolute",
        bottom: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#4b5563",
        marginBottom: 6,
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    sourceBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e0e7ff",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    sourceBadgeText: {
        fontSize: 10,
        color: "#4f46e5",
        marginLeft: 4,
    },
    input: {
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        fontSize: 14,
        color: "#111827",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    activeInput: {
        borderColor: "#3b82f6",
    },
    rowContainer: {
        flexDirection: "row",
    },
    flexOne: {
        flex: 1,
    },
    buttonContainer: {
        marginTop: 24,
    },
    buttonRow: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    nextButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    nextButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "500",
        marginRight: 8,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    backButtonText: {
        color: "#4b5563",
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 8,
    },
    submitButton: {
        backgroundColor: "#10b981",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#d1d5db",
    },
    submitButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "500",
        marginRight: 8,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusToggleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusText: {
        fontSize: 14,
        color: "#9ca3af",
        marginRight: 8,
    },
    activeStatusText: {
        color: "#10b981",
    },
    statusToggle: {
        width: 40,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#e5e7eb",
        justifyContent: "flex-start",
        padding: 2,
    },
    activeStatusToggle: {
        backgroundColor: "#d1fae5",
        justifyContent: "flex-end",
    },
    statusToggleIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#9ca3af",
    },
    activeStatusToggleIndicator: {
        backgroundColor: "#10b981",
    },
    priceInputContainer: {
        position: "relative",
    },
    priceInput: {
        paddingLeft: 45,
    },
    currencySymbol: {
        position: "absolute",
        left: 12,
        top: 10,
        fontSize: 14,
        color: "#6b7280",
    },
    emptyCategories: {
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    emptyCategoriesText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
        marginBottom: 8,
    },
    addCategoryButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    addCategoryButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
    },
    refreshCategories: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    refreshCategoriesText: {
        color: "#6b7280",
        fontSize: 12,
        marginLeft: 4,
    },
    customDropdown: {
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectedItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    selectedItemText: {
        fontSize: 14,
        color: "#111827",
    },
    placeholderText: {
        fontSize: 14,
        color: "#9ca3af",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownModal: {
        backgroundColor: "white",
        borderRadius: 12,
        width: width * 0.9,
        maxHeight: height * 0.6,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    dropdownList: {
        width: "100%",
        paddingVertical: 8,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    selectedDropdownItem: {
        backgroundColor: "#f0f9ff",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#4b5563",
    },
    selectedDropdownItemText: {
        color: "#3b82f6",
        fontWeight: "500",
    },
    pickerContainer: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        overflow: "hidden",
    },
    picker: {
        height: 45,
        color: "#111827",
    },
    previewCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 24,
    },
    previewHeader: {
        flexDirection: "row",
        marginBottom: 16,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 16,
    },
    previewImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    previewContent: {
        flex: 1,
    },
    previewTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: "#d1fae5",
    },
    inactiveBadge: {
        backgroundColor: "#fee2e2",
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "500",
    },
    activeBadgeText: {
        color: "#10b981",
    },
    inactiveBadgeText: {
        color: "#ef4444",
    },
    previewDescription: {
        fontSize: 14,
        color: "#4b5563",
        marginBottom: 8,
    },
    previewPriceRow: {
        marginBottom: 8,
    },
    previewPrice: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    previewFooter: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingTop: 12,
    },
    previewBadge: {
        backgroundColor: "#e5e7eb",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    previewBadgeText: {
        fontSize: 12,
        color: "#4b5563",
    },
    categoryInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        backgroundColor: "#f3f4f6",
        padding: 12,
        borderRadius: 8,
    },
    categoryInfoText: {
        fontSize: 14,
        color: "#4b5563",
        marginLeft: 8,
    },
    categoryName: {
        fontWeight: "500",
        color: "#111827",
    },
    brandContainer: {
        marginTop: 8,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: "#64748b",
    },
    brandText: {
        fontSize: 13,
        color: "#475569",
    },
}); 