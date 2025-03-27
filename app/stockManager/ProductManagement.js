import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    SafeAreaView,
    Alert,
    ScrollView,
    Image,
    Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from '../../firebaseConfig'; // Ensure this path is correct
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function ProductManagement() {
    const router = useRouter();
    const { productId } = useLocalSearchParams(); // Get the productId from URL params
    console.log("Received productId:", productId); // Debugging line

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [image, setImage] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            console.log("Fetching product with ID:", productId);
            if (!productId) {
                console.error("No productId provided.");
                setError("Product ID is missing.");
                setLoading(false);
                return;
            }

            try {
                const productRef = doc(db, "Products", productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    const data = productSnap.data();
                    setProduct({ id: productSnap.id, ...data });
                    setSelectedCategory(data.categoryId); // Set the selected category
                    setImage(data.image); // Set the current image
                } else {
                    setError("Product not found.");
                }
            } catch (err) {
                console.error("Error fetching product: ", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            const querySnapshot = await getDocs(collection(db, "AddCategory"));
            const fetchedCategories = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCategories(fetchedCategories);
        };

        fetchProduct();
        fetchCategories();
    }, [productId]);

    const handleUpdate = async () => {
        if (!product) return;
        try {
            const productRef = doc(db, "Products", productId);
            await updateDoc(productRef, { ...product, categoryId: selectedCategory, image });
            Alert.alert("Success", "Product updated successfully.");
        } catch (err) {
            console.error("Error updating product: ", err);
            Alert.alert("Error", err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const productRef = doc(db, "Products", productId);
            await deleteDoc(productRef);
            Alert.alert("Success", "Product deleted successfully.");
            router.push("/stockManager/ProductList"); // Navigate back to the product list
        } catch (err) {
            console.error("Error deleting product: ", err);
            Alert.alert("Error", err.message);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Error", "Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.cancelled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setImage(uri);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <ScrollView>
                <Text style={{ fontSize: 24 }}>Product Management</Text>

                <Pressable onPress={pickImage} style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 10, height: 200, justifyContent: "center", alignItems: "center", marginVertical: 10 }}>
                    {image ? (
                        <Image source={{ uri: image }} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
                    ) : (
                        <Text style={{ color: "#aaa", fontSize: 16 }}>Select Product Image</Text>
                    )}
                </Pressable>

                <TextInput
                    placeholder="Product Name"
                    value={product.productName}
                    onChangeText={(text) => setProduct({ ...product, productName: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Description"
                    value={product.description}
                    onChangeText={(text) => setProduct({ ...product, description: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Price"
                    value={String(product.price)} // Ensure it's a string for the input
                    keyboardType="numeric"
                    onChangeText={(text) => setProduct({ ...product, price: Number(text) })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Discount Price"
                    value={String(product.discountPrice)} // Ensure it's a string for the input
                    keyboardType="numeric"
                    onChangeText={(text) => setProduct({ ...product, discountPrice: Number(text) })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Stock Quantity"
                    value={String(product.stockQuantity)} // Ensure it's a string for the input
                    keyboardType="numeric"
                    onChangeText={(text) => setProduct({ ...product, stockQuantity: Number(text) })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Unit Type"
                    value={product.unitType}
                    onChangeText={(text) => setProduct({ ...product, unitType: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Brand"
                    value={product.brand}
                    onChangeText={(text) => setProduct({ ...product, brand: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Supplier"
                    value={product.supplier}
                    onChangeText={(text) => setProduct({ ...product, supplier: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Production Date (YYYY-MM-DD)"
                    value={product.productionDate}
                    onChangeText={(text) => setProduct({ ...product, productionDate: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />
                <TextInput
                    placeholder="Expiration Date (YYYY-MM-DD)"
                    value={product.expirationDate}
                    onChangeText={(text) => setProduct({ ...product, expirationDate: text })}
                    style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
                />

                <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    style={{ marginVertical: 10 }}
                >
                    {categories.map((category) => (
                        <Picker.Item key={category.id} label={category.categoryName} value={category.id} />
                    ))}
                </Picker>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button title="Update" onPress={handleUpdate} />
                    <Button title="Delete" onPress={handleDelete} color="red" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}