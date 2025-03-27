import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, Alert, Button, TextInput, Modal, Pressable, Image } from "react-native";
import { db } from '../../firebaseConfig'; // Ensure this path is correct
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

export default function ViewCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [updatedCategoryName, setUpdatedCategoryName] = useState("");
    const [updatedDescription, setUpdatedDescription] = useState("");
    const [updatedImage, setUpdatedImage] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "AddCategory"));
                const fetchedCategories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCategories(fetchedCategories);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleDelete = async (id) => {
        try {
            const categoryRef = doc(db, "AddCategory", id);
            await deleteDoc(categoryRef);
            Alert.alert("Success", "Category deleted successfully.");
            setCategories(categories.filter(category => category.id !== id));
        } catch (err) {
            console.error("Error deleting category:", err);
            Alert.alert("Error", err.message);
        }
    };

    const handleUpdate = async () => {
        if (!selectedCategory || !updatedCategoryName) return;
        try {
            const categoryRef = doc(db, "AddCategory", selectedCategory.id);
            await updateDoc(categoryRef, {
                categoryName: updatedCategoryName,
                description: updatedDescription,
                image: updatedImage // Update the image
            });
            Alert.alert("Success", "Category updated successfully.");
            setCategories(categories.map(category =>
                category.id === selectedCategory.id ? { ...category, categoryName: updatedCategoryName, description: updatedDescription, image: updatedImage } : category
            ));
            setModalVisible(false);
            setSelectedCategory(null);
            setUpdatedCategoryName("");
            setUpdatedDescription("");
            setUpdatedImage(null); // Reset the updated image
        } catch (err) {
            console.error("Error updating category:", err);
            Alert.alert("Error", err.message);
        }
    };

    const selectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Please grant access to the media library.");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            setUpdatedImage(result.assets[0].uri);
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
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Categories</Text>
                {categories.length > 0 ? (
                    categories.map(category => (
                        <View key={category.id} style={{ marginVertical: 10, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 10 }}>
                            <Text style={{ fontSize: 18 }}>{category.categoryName}</Text>
                            <Text>{category.description}</Text>
                            {category.image && (
                                <Image source={{ uri: category.image }} style={{ width: 100, height: 100, borderRadius: 10, marginVertical: 10 }} />
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <Button title="Update" onPress={() => {
                                    setSelectedCategory(category);
                                    setUpdatedCategoryName(category.categoryName);
                                    setUpdatedDescription(category.description);
                                    setUpdatedImage(category.image); // Set current image for updating
                                    setModalVisible(true);
                                }} />
                                <Button title="Delete" onPress={() => handleDelete(category.id)} color="red" />
                            </View>
                        </View>
                    ))
                ) : (
                    <Text>No categories available.</Text>
                )}
            </ScrollView>

            {/* Update Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
                        <Text style={{ fontSize: 20, marginBottom: 10 }}>Update Category</Text>
                        <TextInput
                            placeholder="Category Name"
                            value={updatedCategoryName}
                            onChangeText={setUpdatedCategoryName}
                            style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
                        />
                        <TextInput
                            placeholder="Description"
                            value={updatedDescription}
                            onChangeText={setUpdatedDescription}
                            style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
                        />
                        <Pressable onPress={selectImage} style={{ marginBottom: 20, padding: 10, backgroundColor: '#ccc', borderRadius: 5 }}>
                            <Text style={{ textAlign: 'center' }}>{updatedImage ? "Change Image" : "Select Image"}</Text>
                        </Pressable>
                        {updatedImage && <Image source={{ uri: updatedImage }} style={{ width: 100, height: 100, borderRadius: 10, marginBottom: 20 }} />}
                        <Button title="Save Changes" onPress={handleUpdate} />
                        <Pressable onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
                            <Text style={{ color: 'blue' }}>Cancel</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}