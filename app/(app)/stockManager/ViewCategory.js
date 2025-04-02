import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  TextInput, 
  Modal, 
  Pressable, 
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Platform,
  RefreshControl,
  StatusBar,
  FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons, AntDesign } from '@expo/vector-icons';

export default function ViewCategory() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("nameAsc");
    
    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const searchBarWidth = useRef(new Animated.Value(Dimensions.get('window').width - 40)).current;
    const searchInputRef = useRef(null);
    const [searchFocused, setSearchFocused] = useState(false);
    
    // Delete animation
    const rowTranslateAnimatedValues = useRef({}).current;

    useEffect(() => {
        // Enter animation sequence
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
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
        
        // Fetch categories on initial load
        fetchCategories();
    }, []);

    useEffect(() => {
        // Initialize animate values for swipe animations
        categories.forEach(category => {
            rowTranslateAnimatedValues[category.id] = new Animated.Value(1);
        });
    }, [categories]);

    useEffect(() => {
        // Filter and sort categories when search query, status filter, or sort order changes
        filterAndSortCategories();
    }, [searchQuery, statusFilter, sortOrder, categories]);
    
    const filterAndSortCategories = () => {
        let result = [...categories];
        
        // Apply search filter
        if (searchQuery) {
            result = result.filter(category => 
                category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        // Apply status filter
        if (statusFilter !== "All") {
            result = result.filter(category => category.status === statusFilter);
        }
        
        // Apply sorting
        switch (sortOrder) {
            case "nameAsc":
                result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
                break;
            case "nameDesc":
                result.sort((a, b) => b.categoryName.localeCompare(a.categoryName));
                break;
            case "dateDesc":
                result.sort((a, b) => {
                    const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
                    const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
                    return dateB - dateA;
                });
                break;
            case "dateAsc":
                result.sort((a, b) => {
                    const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
                    const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
                    return dateA - dateB;
                });
                break;
            case "discountDesc":
                result.sort((a, b) => {
                    const discountA = a.discountAvailable ? (a.discountPercentage || 0) : 0;
                    const discountB = b.discountAvailable ? (b.discountPercentage || 0) : 0;
                    return discountB - discountA;
                });
                break;
        }
        
        setFilteredCategories(result);
    };

        const fetchCategories = async () => {
        setLoading(true);
        setError(null);
            try {
                const querySnapshot = await getDocs(collection(db, "AddCategory"));
                const fetchedCategories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCategories(fetchedCategories);
            // Success haptic feedback
            provideFeedback('success');
            } catch (err) {
                console.error("Error fetching categories:", err);
            setError("Could not load categories. Please check your connection and try again.");
            // Error haptic feedback
            provideFeedback('error');
            } finally {
                setLoading(false);
            setRefreshing(false);
            }
        };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCategories();
    };
    
    const provideFeedback = (type) => {
        if (Platform.OS === 'ios') {
            try {
                const Haptics = require('expo-haptics');
                if (type === 'success') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else if (type === 'error') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            } catch (e) {
                // Fallback to basic vibration if Haptics module is not available
                Vibration.vibrate(type === 'error' ? 500 : 20);
            }
        } else {
            // Android vibration
            Vibration.vibrate(type === 'error' ? 500 : 20);
        }
    };

    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setDeleteConfirmVisible(true);
        provideFeedback('light');
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        
        try {
            setDeleteConfirmVisible(false);
            
            // Animate row removal
            Animated.timing(rowTranslateAnimatedValues[categoryToDelete.id], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(async () => {
                const categoryRef = doc(db, "AddCategory", categoryToDelete.id);
                await deleteDoc(categoryRef);
                
                // Update local state
                setCategories(prevCategories => 
                    prevCategories.filter(category => category.id !== categoryToDelete.id)
                );
                
                // Show success message
                Alert.alert(
                    "Success", 
                    `Category "${categoryToDelete.categoryName}" has been deleted.`,
                    [{ text: "OK" }]
                );
                
                // Reset state
                setCategoryToDelete(null);
                provideFeedback('success');
            });
        } catch (err) {
            console.error("Error deleting category:", err);
            Alert.alert(
                "Error", 
                "Failed to delete category: " + err.message,
                [{ text: "OK" }]
            );
            provideFeedback('error');
        }
    };

    const navigateToUpdate = (category) => {
        // Navigate to add category form with edit mode and category data
        router.push({
            pathname: "/stockManager/addCategory",
            params: { 
                editMode: "true", 
                categoryId: category.id,
                categoryName: category.categoryName,
                description: category.description || "",
                status: category.status || "Active",
                discountAvailable: category.discountAvailable ? "true" : "false",
                discountPercentage: category.discountPercentage?.toString() || "0",
                image: category.image || null
            }
        });
    };
    
    const toggleSearch = () => {
        if (searchFocused) {
            // Reset search
            setSearchQuery("");
            setSearchFocused(false);
            searchInputRef.current?.blur();
            Animated.spring(searchBarWidth, {
                toValue: Dimensions.get('window').width - 40,
                friction: 8,
                useNativeDriver: false
            }).start();
        } else {
            // Focus search
            setSearchFocused(true);
            searchInputRef.current?.focus();
            Animated.spring(searchBarWidth, {
                toValue: Dimensions.get('window').width - 100,
                friction: 8,
                useNativeDriver: false
            }).start();
        }
    };
    
    const handleSortOrderChange = (newOrder) => {
        setSortOrder(newOrder);
        provideFeedback('light');
    };
    
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        provideFeedback('light');
    };
    
    const renderCategoryItem = ({ item }) => {
        const dateAdded = item.dateAdded ? new Date(item.dateAdded) : null;
        const formattedDate = dateAdded ? 
            `${dateAdded.toLocaleDateString()} at ${dateAdded.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
            : "No date";
            
        const hasDiscount = item.discountAvailable && item.discountPercentage > 0;
        
        return (
            <TouchableOpacity 
                onPress={() => {
                    setSelectedCategory(item);
                    setModalVisible(true);
                    provideFeedback('light');
                }}
                activeOpacity={0.7}
            >
                <Animated.View 
                    style={[
                        { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
                        { marginVertical: 8 }
                    ]}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                >
                    <View className="flex-row">
                        {/* Category Image */}
                        <View className="w-[100] h-[100] justify-center items-center relative">
                            {item.image ? (
                                <Image 
                                    source={{ uri: item.image }} 
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full bg-gray-200 justify-center items-center">
                                    <Ionicons name="image-outline" size={24} color="#9ca3af" />
                                </View>
                            )}
                            
                            {/* Status Badge */}
                            <View 
                                className={`absolute bottom-1 right-1 px-2 py-1 rounded-md ${
                                    item.status === "Active" ? "bg-green-500" : "bg-gray-500"
                                }`}
                            >
                                <Text className="text-white text-[10px] font-medium">
                                    {item.status}
                                </Text>
                            </View>
                            
                            {/* Discount Badge */}
                            {hasDiscount && (
                                <View className="absolute top-1 left-1 bg-amber-500 px-2 py-1 rounded-md">
                                    <Text className="text-white text-[10px] font-bold">
                                        {item.discountPercentage}% OFF
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Category Details */}
                        <View className="flex-1 p-3">
                            <Text className="text-lg font-bold text-gray-800">{item.categoryName}</Text>
                            
                            {item.description && (
                                <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                                    {item.description}
                                </Text>
                            )}
                            
                            <View className="flex-row items-center mt-2">
                                <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                                <Text className="text-gray-500 text-xs ml-1">
                                    Added: {formattedDate}
                                </Text>
                            </View>

                            {/* Hint to tap for more actions */}
                            <View className="flex-row items-center justify-end mt-2">
                                <Text className="text-gray-400 text-xs mr-1">Tap for details</Text>
                                <Ionicons name="chevron-forward" size={12} color="#9ca3af" />
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };
    
    const renderEmptyList = () => (
        <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="folder-open-outline" size={60} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4 font-medium">No categories found</Text>
            <Text className="text-gray-400 text-sm mt-1 max-w-[250px] text-center">
                {searchQuery || statusFilter !== "All" 
                    ? "Try changing your search or filters" 
                    : "Get started by adding your first category"}
            </Text>
            
            {!searchQuery && statusFilter === "All" && (
                <TouchableOpacity 
                    className="mt-6 bg-orange-500 px-4 py-2 rounded-lg"
                    onPress={() => router.push("/stockManager/addCategory")}
                >
                    <Text className="text-white font-medium">Add Category</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <StatusBar style="dark" />
                <View className="bg-white p-6 rounded-xl shadow-sm items-center">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-600 font-medium mt-4">Loading categories...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            
            {/* Header */}
            <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
                >
                    <Ionicons name="arrow-back" size={20} color="#4b5563" />
                </TouchableOpacity>
                
                <Text className="text-xl font-bold text-gray-800">Categories</Text>
                
                <TouchableOpacity 
                    onPress={() => router.push("/stockManager/addCategory")}
                    className="w-10 h-10 rounded-full bg-orange-100 justify-center items-center"
                >
                    <Ionicons name="add" size={24} color="#f97316" />
                </TouchableOpacity>
            </View>
            
            {/* Search and Filter Bar */}
            <View className="px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <Animated.View style={{ width: searchBarWidth }} className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3 py-2">
                        <Ionicons name="search-outline" size={18} color="#9ca3af" />
                        <TextInput
                            ref={searchInputRef}
                            className="flex-1 pl-2 text-gray-700"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setSearchFocused(true)}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                    
                    {searchFocused && (
                        <TouchableOpacity 
                            onPress={toggleSearch}
                            className="pl-2"
                        >
                            <Text className="text-orange-500 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Filter and Sort Options */}
                <View className="flex-row justify-between items-center mt-3">
                    {/* Status Filter */}
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                    >
                        {["All", "Active", "Inactive"].map(status => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => handleStatusFilterChange(status)}
                                className={`px-3 py-1.5 rounded-full mr-2 ${
                                    statusFilter === status 
                                        ? "bg-orange-500" 
                                        : "bg-gray-200"
                                }`}
                            >
                                <Text 
                                    className={`text-xs font-medium ${
                                        statusFilter === status 
                                            ? "text-white" 
                                            : "text-gray-700"
                                    }`}
                                >
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    {/* Sort Dropdown */}
                    <View className="relative">
                        <TouchableOpacity 
                            onPress={() => setModalVisible(true)}
                            className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200"
                        >
                            <Ionicons name="filter-outline" size={16} color="#9ca3af" />
                            <Text className="text-xs text-gray-700 ml-1">Sort</Text>
                        </TouchableOpacity>
                    </View>
                            </View>
                        </View>
            
            {/* Category List */}
            {error ? (
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="cloud-offline-outline" size={50} color="#ef4444" />
                    <Text className="text-red-500 text-lg font-bold mt-4">Something went wrong</Text>
                    <Text className="text-gray-500 text-center mt-2">{error}</Text>
                    <TouchableOpacity 
                        className="mt-6 bg-orange-500 px-4 py-2 rounded-lg"
                        onPress={fetchCategories}
                    >
                        <Text className="text-white font-medium">Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredCategories}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#f97316', '#fb923c']}
                            tintColor="#f97316"
                            title="Pull to refresh..."
                            titleColor="#f97316"
                        />
                    }
                />
            )}
            
            {/* Sort Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable 
                        className="bg-white rounded-xl w-[300] p-5"
                        onPress={e => e.stopPropagation()}
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-800">Sort Categories</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                        
                        {[
                            { id: "nameAsc", label: "Name (A-Z)", icon: "sort-alphabetical-ascending" },
                            { id: "nameDesc", label: "Name (Z-A)", icon: "sort-alphabetical-descending" },
                            { id: "dateDesc", label: "Newest first", icon: "clock-time-eight" },
                            { id: "dateAsc", label: "Oldest first", icon: "clock-time-eight-outline" },
                            { id: "discountDesc", label: "Highest discount", icon: "percent" },
                        ].map((option) => (
                            <TouchableOpacity 
                                key={option.id}
                                className={`flex-row items-center p-3 rounded-lg mb-2 ${
                                    sortOrder === option.id ? "bg-orange-100" : "bg-gray-50"
                                }`}
                                onPress={() => {
                                    handleSortOrderChange(option.id);
                                    setModalVisible(false);
                                }}
                            >
                                <MaterialCommunityIcons 
                                    name={option.icon} 
                                    size={20} 
                                    color={sortOrder === option.id ? "#f97316" : "#6b7280"} 
                                />
                                <Text 
                                    className={`ml-3 ${
                                        sortOrder === option.id 
                                            ? "text-orange-700 font-medium" 
                                            : "text-gray-700"
                                    }`}
                                >
                                    {option.label}
                                </Text>
                                {sortOrder === option.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#f97316" style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteConfirmVisible}
                onRequestClose={() => setDeleteConfirmVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={() => setDeleteConfirmVisible(false)}
                >
                    <Pressable 
                        className="bg-white rounded-xl w-[300] p-5"
                        onPress={e => e.stopPropagation()}
                    >
                        <View className="items-center mb-4">
                            <View className="w-16 h-16 rounded-full bg-red-100 justify-center items-center mb-3">
                                <Ionicons name="trash" size={30} color="#ef4444" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">Delete Category</Text>
                            {categoryToDelete && (
                                <Text className="text-gray-500 text-center mt-2">
                                    Are you sure you want to delete "{categoryToDelete.categoryName}"? This action cannot be undone.
                                </Text>
                            )}
                        </View>
                        
                        <View className="flex-row space-x-3">
                            <TouchableOpacity 
                                className="flex-1 py-2.5 rounded-lg bg-gray-200"
                                onPress={() => setDeleteConfirmVisible(false)}
                            >
                                <Text className="text-gray-700 font-medium text-center">Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                className="flex-1 py-2.5 rounded-lg bg-red-500"
                                onPress={handleDelete}
                            >
                                <Text className="text-white font-medium text-center">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
            
            {/* Category Detail Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible && selectedCategory !== null}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable 
                        className="bg-white rounded-xl w-[90%] max-w-[400] overflow-hidden"
                        onPress={e => e.stopPropagation()}
                    >
                        {selectedCategory && (
                            <View>
                                {/* Modal Header with Close Button */}
                                <View className="p-4 bg-orange-500 flex-row justify-between items-center">
                                    <Text className="text-white text-lg font-bold">Category Details</Text>
                                    <TouchableOpacity 
                                        onPress={() => setModalVisible(false)}
                                        className="w-8 h-8 rounded-full bg-white/20 justify-center items-center"
                                    >
                                        <Ionicons name="close" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Image Section */}
                                <View className="w-full h-[200] relative">
                                    {selectedCategory.image ? (
                                        <Image 
                                            source={{ uri: selectedCategory.image }} 
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="w-full h-full bg-gray-200 justify-center items-center">
                                            <Ionicons name="image-outline" size={50} color="#9ca3af" />
                                        </View>
                                    )}
                                    
                                    {/* Status Badge */}
                                    <View 
                                        className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-full ${
                                            selectedCategory.status === "Active" ? "bg-green-500" : "bg-gray-500"
                                        }`}
                                    >
                                        <Text className="text-white text-xs font-medium">
                                            {selectedCategory.status}
                                        </Text>
                                    </View>
                                    
                                    {/* Discount Badge */}
                                    {selectedCategory.discountAvailable && selectedCategory.discountPercentage > 0 && (
                                        <View className="absolute top-2 left-2 bg-amber-500 px-3 py-1.5 rounded-full flex-row items-center">
                                            <FontAwesome5 name="tags" size={12} color="white" style={{marginRight: 4}} />
                                            <Text className="text-white font-bold text-xs">{selectedCategory.discountPercentage}% OFF</Text>
                                        </View>
                                    )}
                                </View>
                                
                                {/* Details Section */}
                                <View className="p-4">
                                    <Text className="text-2xl font-bold text-gray-800">{selectedCategory.categoryName}</Text>
                                    
                                    <View className="flex-row items-center mt-2 mb-3">
                                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                        <Text className="text-gray-500 text-xs ml-1">
                                            Added: {selectedCategory.dateAdded ? new Date(selectedCategory.dateAdded).toLocaleString() : "No date"}
                                        </Text>
                                    </View>
                                    
                                    <View className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                                        <Text className="text-gray-600">{selectedCategory.description || "No description provided"}</Text>
                                    </View>
                                    
                                    {/* Discount Information */}
                                    {selectedCategory.discountAvailable ? (
                                        <View className="bg-amber-50 p-3 rounded-lg mb-4">
                                            <Text className="text-sm font-medium text-amber-700 mb-1">Discount Information</Text>
                                            <Text className="text-amber-600">
                                                This category has a {selectedCategory.discountPercentage}% discount applied to all products.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="bg-gray-50 p-3 rounded-lg mb-4">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Discount Information</Text>
                                            <Text className="text-gray-600">No discounts applied to this category.</Text>
                                        </View>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <View className="flex-row space-x-3 mt-2">
                                        <TouchableOpacity 
                                            className="flex-1 py-3 rounded-lg border border-gray-300 flex-row justify-center items-center"
                                            onPress={() => {
                                                setModalVisible(false);
                                                setTimeout(() => confirmDelete(selectedCategory), 300);
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            <Text className="text-red-500 font-medium ml-2">Delete</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            className="flex-1 py-3 rounded-lg bg-orange-500 flex-row justify-center items-center"
                                            onPress={() => {
                                                setModalVisible(false);
                                                setTimeout(() => navigateToUpdate(selectedCategory), 300);
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={18} color="white" />
                                            <Text className="text-white font-medium ml-2">Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        </Pressable>
                        </Pressable>
            </Modal>
        </SafeAreaView>
    );
}