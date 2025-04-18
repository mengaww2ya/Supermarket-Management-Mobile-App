import React, { useState, useEffect } from "react";
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
    Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Ionicons,
    AntDesign,
    MaterialCommunityIcons,
    Feather
} from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { db, auth } from "../../../firebase/firebaseConfig";
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    setDoc,
    increment,
    deleteDoc
} from "firebase/firestore";
import { Picker } from '@react-native-picker/picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ImagePicker from '../../../app/components/ImagePicker';

const { width, height } = Dimensions.get("window");

export default function EditProduct() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { productId, categoryId, categoryName } = params;

    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [product, setProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(productId || "");

    // Product form state
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productQuantity, setProductQuantity] = useState("");
    const [productUnit, setProductUnit] = useState("");
    const [productImage, setProductImage] = useState(null);
    const [productCategory, setProductCategory] = useState(null);
    const [imageChanged, setImageChanged] = useState(false);
    const [formError, setFormError] = useState("");
    const [brand, setBrand] = useState("");
    const [status, setStatus] = useState(true);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || "");
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryError, setCategoryError] = useState(false);

    // Load product selection and categories immediately
    useEffect(() => {
        // Fetch all categories immediately
        fetchAllCategories();

        if (!productId) {
            fetchAllProducts();
        }
    }, []);

    // Fetch product details on load
    useEffect(() => {
        if (productId) {
            fetchProductDetails(productId);
        } else if (selectedProductId) {
            fetchProductDetails(selectedProductId);
        }
    }, [productId, selectedProductId]);

    // Fetch all products
    const fetchAllProducts = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                setLoading(false);
                return;
            }

            // First, fetch all categories for this supplier
            const categoriesRef = collection(db, 'supplier_category');
            const categoriesQuery = query(
                categoriesRef,
                where("supplierId", "==", userId)
            );

            const categoriesSnapshot = await getDocs(categoriesQuery);
            const categoriesData = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If no categories, return empty products list
            if (categoriesData.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            // For each category, fetch its products
            let allProducts = [];

            // Use Promise.all to fetch products from all categories in parallel
            await Promise.all(categoriesData.map(async (category) => {
                try {
                    const categoryProductsRef = collection(db, 'supplier_category', category.id, 'products');
                    const productsQuery = query(
                        categoryProductsRef,
                        where("supplierId", "==", userId)
                    );

                    const productsSnapshot = await getDocs(productsQuery);
                    const categoryProducts = productsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        categoryId: category.id,
                        categoryName: category.name,
                        ...doc.data()
                    }));

                    allProducts = [...allProducts, ...categoryProducts];
                } catch (error) {
                    console.error(`Error fetching products for category ${category.id}:`, error);
                }
            }));

            // Sort the products by name
            allProducts.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

            setProducts(allProducts);

            // If products are available and no product is selected, select the first one
            if (allProducts.length > 0 && !selectedProductId) {
                setSelectedProductId(allProducts[0].id);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]); // Set empty array to avoid null/undefined
            setLoading(false);
        }
    };

    // Fetch product details
    const fetchProductDetails = async (id) => {
        try {
            setLoading(true);
            console.log("Fetching product details for ID:", id);
            console.log("Params:", params);

            // Get category ID from params
            const categoryId = params.categoryId;
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                setLoading(false);
                return;
            }

            let productData = null;
            let categoryData = null;
            let fetchError = null;

            // If we have a categoryId, get the product from that category's subcollection
            if (categoryId) {
                try {
                    const productRef = doc(db, 'supplier_category', categoryId, 'products', id);
                    const productDoc = await getDoc(productRef);

                    if (productDoc.exists()) {
                        productData = {
                            id: productDoc.id,
                            ...productDoc.data()
                        };

                        // Also fetch the category data
                        const categoryRef = doc(db, 'supplier_category', categoryId);
                        const categoryDoc = await getDoc(categoryRef);

                        if (categoryDoc.exists()) {
                            categoryData = {
                                id: categoryDoc.id,
                                ...categoryDoc.data()
                            };
                        }
                    } else {
                        console.log(`Product document with ID ${id} not found in subcollection`);
                    }
                } catch (error) {
                    console.error("Error fetching product from subcollection:", error);
                    fetchError = error;
                }
            }

            // If we still don't have product data, throw an error
            if (!productData) {
                throw new Error("Product not found. It may have been deleted or you don't have permission to access it.");
            }

            // Set form values from product data
            setProduct(productData);
            setProductName(productData.name || "");
            setProductDescription(productData.description || "");
            setProductPrice(productData.price?.toString() || "");
            setProductQuantity(productData.quantity?.toString() || "");
            setProductUnit(productData.unit || "");
            setProductImage(productData.imageUrl || null);
            setBrand(productData.brand || "");
            setStatus(productData.isActive === undefined ? true : productData.isActive);

            // Set product category
            if (categoryData) {
                setProductCategory(categoryData);
                setSelectedCategoryId(categoryData.id);
            } else if (productData.categoryId) {
                setSelectedCategoryId(productData.categoryId);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching product details:", error);
            Alert.alert("Error", error.message || "Failed to load product details.");
            setLoading(false);
        }
    };

    // Fetch all categories for the dropdown
    const fetchAllCategories = async () => {
        try {
            setCategoryLoading(true);
            setCategoryError(false);

            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error("No authenticated user found");
                setCategoryError(true);
                setCategoryLoading(false);
                return;
            }

            // Remove the orderBy to avoid index error
            const categoriesRef = collection(db, 'supplier_category');
            const categoriesQuery = query(
                categoriesRef,
                where("supplierId", "==", userId)
            );

            const categoriesSnapshot = await getDocs(categoriesQuery);
            const categoriesData = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                ...doc.data()
            }));

            // Sort categories by name in JavaScript instead of using Firestore orderBy
            categoriesData.sort((a, b) => a.name.localeCompare(b.name));

            setAllCategories(categoriesData);
            console.log("Fetched categories:", categoriesData.length);

            setCategoryLoading(false);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategoryError(true);
            setCategoryLoading(false);

            // Show error to user
            Alert.alert(
                "Error",
                "Failed to load categories. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    // Function to handle image selection
    const handleImageSelected = async (selectedAsset) => {
        try {
            if (selectedAsset) {
                // Store both the URI for display and the base64 data for upload
                setProductImage(selectedAsset.uri);
                setImageChanged(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Log the image format and size for debugging
                console.log(`Selected image: ${selectedAsset.name} (${selectedAsset.size})`);
            } else {
                // Image was removed
                setProductImage(null);
                setImageChanged(true);
            }
        } catch (error) {
            console.error("Error handling selected image:", error);
            Alert.alert("Error", "Failed to process the selected image.");
        }
    };

    // Reset image to allow picking a new one
    const resetImage = () => {
        setProductImage(null);
        setImageChanged(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Upload image to Firebase Storage
    const uploadImage = async (uri) => {
        try {
            // If the image is already a base64 string (from our enhanced ImagePicker)
            if (uri.startsWith('data:image')) {
                // Extract the base64 data and upload directly
                const base64Data = uri.split(',')[1];
                const blob = await fetch(uri).then(res => res.blob());

                const storage = getStorage();
                const fileName = `product_${Date.now()}`;
                const storageRef = ref(storage, `supplier_products/${fileName}`);

                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                return downloadURL;
            } else {
                // Use the traditional method for non-base64 URIs
                const response = await fetch(uri);
                const blob = await response.blob();

                const storage = getStorage();
                const fileName = `product_${Date.now()}`;
                const storageRef = ref(storage, `supplier_products/${fileName}`);

                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                return downloadURL;
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new Error("Failed to upload image");
        }
    };

    // Validate form before submitting
    const validateForm = () => {
        // Check required fields
        if (!productName.trim()) {
            setFormError("Product name is required");
            return false;
        }

        if (!productPrice || isNaN(parseFloat(productPrice)) || parseFloat(productPrice) <= 0) {
            setFormError("Valid price is required");
            return false;
        }

        if (!productQuantity || isNaN(parseInt(productQuantity)) || parseInt(productQuantity) <= 0) {
            setFormError("Valid quantity is required");
            return false;
        }

        if (!productUnit.trim()) {
            setFormError("Unit is required");
            return false;
        }

        if (!selectedCategoryId) {
            setFormError("Category is required");
            return false;
        }

        if (!productImage) {
            setFormError("Product image is required");
            return false;
        }

        setFormError("");
        return true;
    };

    // Update product
    const handleUpdateProduct = async () => {
        try {
            // Check if we have a product to update
            if (!productId && !selectedProductId) {
                setFormError("No product selected");
                return;
            }

            // Validate form
            if (!validateForm()) {
                return;
            }

            setSubmitLoading(true);

            // Prepare update data
            const updateData = {
                name: productName.trim(),
                description: productDescription.trim(),
                price: parseFloat(productPrice),
                quantity: parseInt(productQuantity),
                unit: productUnit.trim(),
                brand: brand.trim(),
                isActive: status,
                updatedAt: serverTimestamp()
            };

            // Upload new image if changed
            if (imageChanged) {
                const imageUrl = await uploadImage(productImage);
                updateData.imageUrl = imageUrl;
            }

            // Get necessary params
            const categoryId = params.categoryId || selectedCategoryId;
            const userId = auth.currentUser?.uid;

            if (!userId) {
                throw new Error("No authenticated user found");
            }

            try {
                // Get the selected category name if available
                let selectedCategoryName = "";
                if (selectedCategoryId) {
                    const category = allCategories.find(c => c.id === selectedCategoryId);
                    if (category) {
                        selectedCategoryName = category.name;
                    }
                }

                // Update the product in the subcollection
                if (selectedCategoryId) {
                    const currentId = productId || selectedProductId;
                    const productRef = doc(db, 'supplier_category', selectedCategoryId, 'products', currentId);

                    // Check if product exists in this category
                    const productDoc = await getDoc(productRef);

                    if (productDoc.exists()) {
                        // Update existing product in subcollection
                        await updateDoc(productRef, {
                            ...updateData,
                            supplierId: userId,
                            categoryId: selectedCategoryId,
                            categoryName: selectedCategoryName
                        });
                    } else if (categoryId !== selectedCategoryId) {
                        // Product doesn't exist in this category subcollection yet
                        // This could happen if user is moving a product to a new category
                        Alert.alert(
                            "Information",
                            "This product doesn't exist in the selected category. Do you want to add it?",
                            [
                                {
                                    text: "No",
                                    style: "cancel"
                                },
                                {
                                    text: "Yes",
                                    onPress: async () => {
                                        try {
                                            // Create a new product document in the subcollection
                                            const newProductRef = doc(collection(db, 'supplier_category', selectedCategoryId, 'products'));
                                            await setDoc(newProductRef, {
                                                ...updateData,
                                                supplierId: userId,
                                                categoryId: selectedCategoryId,
                                                categoryName: selectedCategoryName,
                                                createdAt: serverTimestamp(),
                                                isActive: true
                                            });

                                            // Update category product count
                                            const categoryRef = doc(db, 'supplier_category', selectedCategoryId);
                                            await updateDoc(categoryRef, {
                                                productCount: increment(1)
                                            });

                                            // Delete from the old category if it exists
                                            if (categoryId) {
                                                const oldProductRef = doc(db, 'supplier_category', categoryId, 'products', currentId);
                                                await deleteDoc(oldProductRef);

                                                // Update old category product count
                                                const oldCategoryRef = doc(db, 'supplier_category', categoryId);
                                                await updateDoc(oldCategoryRef, {
                                                    productCount: increment(-1)
                                                });
                                            }

                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            Alert.alert("Success", "Product added to category successfully!");
                                            router.back();
                                        } catch (error) {
                                            console.error("Error adding product to category:", error);
                                            Alert.alert("Error", "Failed to add product to category");
                                        }
                                    }
                                }
                            ]
                        );
                        setSubmitLoading(false);
                        return;
                    } else {
                        throw new Error("Product not found in the selected category");
                    }
                } else {
                    throw new Error("No category selected for this product");
                }

                setSubmitLoading(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                Alert.alert(
                    "Success",
                    "Product updated successfully",
                    [
                        {
                            text: "OK",
                            onPress: () => router.back()
                        }
                    ]
                );
            } catch (error) {
                console.error("Error updating product:", error);
                throw error;
            }

        } catch (error) {
            console.error("Error updating product:", error);
            setFormError("An error occurred. Please try again.");
            setSubmitLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Go back to previous screen
    const goBack = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goBack}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {productId ? "Edit Product Details" : "Update Product"}
                    </Text>

                    <View style={{ width: 40 }} />
                </Animated.View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Animated.View
                            entering={FadeInDown.duration(400).delay(100)}
                            style={styles.formContainer}
                        >
                            {/* Product Selection (if no product id provided) */}
                            {!productId && products.length > 0 && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Select Product to Edit *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedProductId}
                                            onValueChange={(itemValue) => setSelectedProductId(itemValue)}
                                            style={styles.picker}
                                        >
                                            {products.map((product) => (
                                                <Picker.Item
                                                    key={product.id}
                                                    label={`${product.name} (${product.categoryName || 'No Category'})`}
                                                    value={product.id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    <Text style={styles.pickerHelp}>Products are loaded from your categories</Text>
                                </View>
                            )}

                            {!productId && products.length === 0 && (
                                <View style={styles.noProducts}>
                                    <MaterialCommunityIcons name="package-variant" size={50} color="#d1d5db" />
                                    <Text style={styles.noProductsText}>No products in your categories</Text>
                                    <Text style={styles.noProductsSubtext}>
                                        You need to create a category and add products to it before you can edit them.
                                    </Text>
                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { marginRight: 8 }]}
                                            onPress={() => router.push("/suplier/(tabs)/categories")}
                                        >
                                            <MaterialCommunityIcons name="folder-plus" size={18} color="white" style={{ marginRight: 6 }} />
                                            <Text style={styles.actionButtonText}>Manage Categories</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: "#10b981" }]}
                                            onPress={() => router.push("/suplier/addProduct")}
                                        >
                                            <AntDesign name="plus" size={18} color="white" style={{ marginRight: 6 }} />
                                            <Text style={styles.actionButtonText}>Add Product</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Product Image */}
                            {(productId || selectedProductId) && (
                                <>
                                    <View style={styles.imageContainer}>
                                        {productImage ? (
                                            <>
                                                <Image
                                                    source={{ uri: productImage }}
                                                    style={styles.productImagePreview}
                                                />
                                                <TouchableOpacity
                                                    style={styles.changeImageButton}
                                                    onPress={resetImage}
                                                >
                                                    <Text style={styles.changeImageText}>Change Image</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <ImagePicker
                                                onImageSelected={handleImageSelected}
                                                isLoading={submitLoading}
                                                maxSizeMB={10}
                                            />
                                        )}
                                    </View>

                                    {/* Form Fields */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Product Name *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter product name"
                                            value={productName}
                                            onChangeText={setProductName}
                                            autoCapitalize="words"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Description (Optional)</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            placeholder="Enter product description"
                                            value={productDescription}
                                            onChangeText={setProductDescription}
                                            multiline={true}
                                            numberOfLines={4}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Product Status</Text>
                                        <View style={styles.statusToggleContainer}>
                                            <Text style={styles.statusLabel}>
                                                {status ? 'Active' : 'Inactive'}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.statusToggle, status && styles.statusToggleActive]}
                                                onPress={() => setStatus(!status)}
                                            >
                                                <View style={[styles.statusToggleHandle, status && styles.statusToggleHandleActive]} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Brand (Optional)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter brand name"
                                            value={brand}
                                            onChangeText={setBrand}
                                        />
                                    </View>

                                    <View style={styles.row}>
                                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                            <Text style={styles.label}>Price (Birr) *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter price"
                                                value={productPrice}
                                                onChangeText={setProductPrice}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                            <Text style={styles.label}>Quantity *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter quantity"
                                                value={productQuantity}
                                                onChangeText={setProductQuantity}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Unit *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter unit (e.g., kg, piece, box)"
                                            value={productUnit}
                                            onChangeText={setProductUnit}
                                        />
                                    </View>

                                    {/* Category Selection */}
                                    <View style={styles.formGroup}>
                                        <View style={styles.labelRow}>
                                            <Text style={styles.label}>Category *</Text>
                                            <TouchableOpacity
                                                onPress={fetchAllCategories}
                                                style={styles.refreshButton}
                                                disabled={categoryLoading}
                                            >
                                                {categoryLoading ? (
                                                    <ActivityIndicator size="small" color="#4b5563" />
                                                ) : (
                                                    <>
                                                        <Feather name="refresh-cw" size={14} color="#4b5563" />
                                                        <Text style={styles.refreshText}>Refresh</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {categoryLoading ? (
                                            <View style={styles.loadingCategories}>
                                                <ActivityIndicator size="small" color="#4b5563" />
                                                <Text style={styles.loadingCategoriesText}>Loading categories...</Text>
                                            </View>
                                        ) : categoryError ? (
                                            <View style={styles.errorCategories}>
                                                <Text style={styles.errorCategoriesText}>Failed to load categories. Please try again.</Text>
                                                <TouchableOpacity style={styles.errorRetryButton} onPress={fetchAllCategories}>
                                                    <Text style={styles.errorRetryButtonText}>Retry</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : allCategories.length === 0 ? (
                                            <View style={styles.emptyCategories}>
                                                <Text style={styles.emptyCategoriesText}>No categories found</Text>
                                                <TouchableOpacity
                                                    onPress={() => router.push("/suplier/(tabs)/categories")}
                                                    style={styles.emptyCategoriesButton}
                                                >
                                                    <Text style={styles.emptyCategoriesButtonText}>Manage Categories</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <>
                                                <View style={styles.pickerContainer}>
                                                    <Picker
                                                        selectedValue={selectedCategoryId}
                                                        onValueChange={(itemValue) => {
                                                            console.log("Selected category changed to:", itemValue);
                                                            setSelectedCategoryId(itemValue);
                                                        }}
                                                        style={styles.picker}
                                                    >
                                                        <Picker.Item label="Select a category" value="" />
                                                        {allCategories.map((category) => (
                                                            <Picker.Item
                                                                key={category.id}
                                                                label={category.name}
                                                                value={category.id}
                                                            />
                                                        ))}
                                                    </Picker>
                                                </View>
                                                <Text style={styles.pickerHelp}>Selected: {allCategories.find(c => c.id === selectedCategoryId)?.name || 'None'}</Text>
                                            </>
                                        )}
                                    </View>

                                    {/* Category Information */}
                                    {selectedCategoryId && (
                                        <View style={styles.categoryChangeInfo}>
                                            <AntDesign name="infocirlce" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                                            <Text style={styles.categoryChangeInfoText}>
                                                This product will be updated in the "
                                                {allCategories.find(c => c.id === selectedCategoryId)?.name || 'Selected'}
                                                " category.
                                            </Text>
                                        </View>
                                    )}

                                    {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            submitLoading && styles.submitButtonDisabled
                                        ]}
                                        onPress={handleUpdateProduct}
                                        disabled={submitLoading}
                                    >
                                        {submitLoading ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <View style={styles.submitButtonContent}>
                                                <AntDesign name="save" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                                                <Text style={styles.submitButtonText}>Update Product</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </Animated.View>
                    </ScrollView>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    formContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        alignItems: "center",
        marginBottom: 20,
        width: "100%",
    },
    formGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111827",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        backgroundColor: "#f9fafb",
        overflow: "hidden",
    },
    picker: {
        height: 50,
    },
    categoryInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 16,
    },
    categoryInfoText: {
        fontSize: 14,
        color: "#4b5563",
        marginLeft: 8,
    },
    errorText: {
        color: "#ef4444",
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#93c5fd",
    },
    submitButtonContent: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    noProducts: {
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    noProductsText: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: "600",
        color: "#4b5563",
    },
    noProductsSubtext: {
        marginBottom: 16,
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        maxWidth: "80%",
    },
    actionButtonsRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 8,
    },
    actionButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    categoryChangeInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e0f2fe",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    categoryChangeInfoText: {
        fontSize: 14,
        color: "#0369a1",
        flex: 1,
    },
    pickerHelp: {
        marginTop: 8,
        fontSize: 12,
        color: "#6b7280",
        textAlign: "center",
    },
    statusToggleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginRight: 8,
    },
    statusToggle: {
        width: 50,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#e5e7eb",
        position: "relative",
    },
    statusToggleActive: {
        backgroundColor: "#bfdbfe",
    },
    statusToggleHandle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#9ca3af",
        position: "absolute",
        top: 2,
        left: 2,
        transition: "0.3s",
    },
    statusToggleHandleActive: {
        backgroundColor: "#3b82f6",
        transform: [{ translateX: 26 }],
    },
    productDetailSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    detailCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    detailCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    detailCardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginRight: 8,
    },
    detailValue: {
        fontSize: 14,
        color: "#4b5563",
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: "#e5e7eb",
    },
    statusActive: {
        backgroundColor: "#d1fae5",
    },
    statusInactive: {
        backgroundColor: "#fef2f2",
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#15803d",
    },
    descriptionContainer: {
        marginTop: 12,
    },
    descriptionLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: "#4b5563",
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
    },
    refreshText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "500",
        color: "#4b5563",
    },
    emptyCategories: {
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    emptyCategoriesText: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: "600",
        color: "#4b5563",
    },
    emptyCategoriesButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyCategoriesButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    loadingCategories: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    loadingCategoriesText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#4b5563',
        fontWeight: '500',
    },
    errorCategories: {
        padding: 24,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ef4444',
        alignItems: 'center',
    },
    errorCategoriesText: {
        marginVertical: 8,
        fontSize: 14,
        color: '#b91c1c',
        fontWeight: '500',
        textAlign: 'center',
    },
    errorRetryButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    errorRetryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    productImagePreview: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    changeImageButton: {
        backgroundColor: "#3b82f6",
        borderRadius: 8,
        padding: 8,
        alignItems: "center",
        marginTop: 8,
    },
    changeImageText: {
        color: "white",
        fontWeight: "500",
    },
}); 