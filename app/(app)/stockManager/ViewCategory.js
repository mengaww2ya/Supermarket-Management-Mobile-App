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
  FlatList,
  Keyboard
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
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    
    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const searchBarWidth = useRef(new Animated.Value(Dimensions.get('window').width - 40)).current;
    const searchInputRef = useRef(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const [activeCard, setActiveCard] = useState(null);
    
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
    
    // Card press animation handlers
    const handleCardPressIn = (id) => {
        setActiveCard(id);
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };
    
    const handleCardPressOut = () => {
        setActiveCard(null);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };
    
    const renderCategoryItem = ({ item }) => {
        const rowTranslate = rowTranslateAnimatedValues[item.id] || new Animated.Value(1);
        
        return (
            <Animated.View 
                style={{
                    transform: [{ scale: rowTranslate }],
                    opacity: rowTranslate
                }}
            >
                <TouchableOpacity 
                    onPress={() => {
                        setSelectedCategory(item);
                        setModalVisible(true);
                    }}
                    onPressIn={() => handleCardPressIn(item.id)}
                    onPressOut={handleCardPressOut}
                    className={`mb-4 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm ${
                        activeCard === item.id ? 'shadow-lg border-orange-500' : ''
                    }`}
                >
                    <View className="flex-row p-4">
                        {/* Category Image */}
                        <View className="w-20 h-20 rounded-lg overflow-hidden mr-4">
                            {item.image ? (
                                <Image 
                                    source={{ uri: item.image }} 
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full bg-gray-100 justify-center items-center">
                                    <Ionicons name="image-outline" size={24} color="#9ca3af" />
                                </View>
                            )}
                            </View>
                            
                        {/* Category Info */}
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text className="text-lg font-semibold text-gray-800 flex-1">
                                    {item.categoryName}
                                    </Text>
                                <View className="flex-row">
                                    {/* Edit Button */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            router.push({
                                                pathname: "/stockManager/addCategory",
                                                params: {
                                                    editMode: "true",
                                                    categoryId: item.id,
                                                    categoryName: item.categoryName,
                                                    description: item.description || "",
                                                    status: item.status || "Active",
                                                    discountAvailable: item.discountAvailable || "false",
                                                    discountPercentage: item.discountPercentage || "0",
                                                    image: item.image || ""
                                                }
                                            });
                                        }}
                                        className="p-2 mr-2"
                                    >
                                        <Ionicons name="create-outline" size={20} color="#4f46e5" />
                                    </TouchableOpacity>

                                    {/* Delete Button */}
                                    <TouchableOpacity
                                        onPress={() => confirmDelete(item)}
                                        className="p-2"
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                        </View>
                        
                            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                                {item.description || "No description available"}
                                </Text>
                            
                            <View className="flex-row items-center">
                                <View className={`px-2 py-1 rounded-full ${
                                    item.status === "Active" ? "bg-green-100" : "bg-red-100"
                                }`}>
                                    <Text className={`text-xs font-medium ${
                                        item.status === "Active" ? "text-green-800" : "text-red-800"
                                    }`}>
                                        {item.status || "Inactive"}
                                </Text>
                            </View>
                            
                                {item.discountAvailable && (
                                    <View className="ml-2 px-2 py-1 rounded-full bg-amber-100">
                                        <Text className="text-xs font-medium text-amber-800">
                                            {item.discountPercentage}% OFF
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
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
                
                <Text className="text-2xl font-bold text-gray-800 mb-4">Categories</Text>
                
                <TouchableOpacity 
                    onPress={() => router.push("/stockManager/addCategory")}
                    className="w-10 h-10 rounded-full bg-orange-100 justify-center items-center"
                >
                    <Ionicons name="add" size={24} color="#f97316" />
                </TouchableOpacity>
            </View>
            
            {/* Search and Filter Bar */}
            <Animated.View 
                style={{
                    transform: [{ translateY }],
                    opacity: fadeAnim,
                    width: '100%',
                    marginBottom: 10
                }}
            >
                {/* Filters and Search Section */}
                <View className="flex-row items-center justify-between mb-4">
                    <Animated.View 
                        style={{ width: searchBarWidth }}
                        className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2"
                    >
                        <Ionicons name="search-outline" size={20} color="#9ca3af" />
                        <TextInput
                            ref={searchInputRef}
                            className="flex-1 ml-2 text-gray-700"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => {
                                setSearchFocused(true);
                                Animated.timing(searchBarWidth, {
                                    toValue: Dimensions.get('window').width - 100,
                                    duration: 300,
                                    useNativeDriver: false
                                }).start();
                            }}
                            onBlur={() => {
                                setSearchFocused(false);
                                Animated.timing(searchBarWidth, {
                                    toValue: Dimensions.get('window').width - 40,
                                    duration: 300,
                                    useNativeDriver: false
                                }).start();
                            }}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    Keyboard.dismiss();
                                }}
                            >
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                    
                    {!searchFocused && (
                        <TouchableOpacity 
                            onPress={() => setFilterModalVisible(true)}
                            className="bg-gray-100 p-3 rounded-xl"
                        >
                            <Ionicons name="options-outline" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Stats and Filter Pills */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-500 text-sm">
                        {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found
                    </Text>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4 }}
                    >
                        <TouchableOpacity
                            className={`mr-2 px-3 py-1.5 rounded-full border ${
                                statusFilter === "All" 
                                    ? "bg-blue-100 border-blue-200" 
                                    : "bg-gray-50 border-gray-200"
                            }`}
                            onPress={() => setStatusFilter("All")}
                        >
                            <Text 
                                className={`text-xs font-medium ${
                                    statusFilter === "All" ? "text-blue-700" : "text-gray-500"
                                }`}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`mr-2 px-3 py-1.5 rounded-full border ${
                                statusFilter === "Active" 
                                    ? "bg-green-100 border-green-200" 
                                    : "bg-gray-50 border-gray-200"
                            }`}
                            onPress={() => setStatusFilter("Active")}
                        >
                            <Text 
                                className={`text-xs font-medium ${
                                    statusFilter === "Active" ? "text-green-700" : "text-gray-500"
                                }`}
                            >
                                Active
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`mr-2 px-3 py-1.5 rounded-full border ${
                                statusFilter === "Inactive" 
                                    ? "bg-gray-200 border-gray-300" 
                                    : "bg-gray-50 border-gray-200"
                            }`}
                            onPress={() => setStatusFilter("Inactive")}
                        >
                            <Text 
                                className={`text-xs font-medium ${
                                    statusFilter === "Inactive" ? "text-gray-700" : "text-gray-500"
                                }`}
                            >
                                Inactive
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`px-3 py-1.5 rounded-full border ${
                                sortOrder === "discountDesc" 
                                    ? "bg-amber-100 border-amber-200" 
                                    : "bg-gray-50 border-gray-200"
                            }`}
                            onPress={() => setSortOrder(
                                sortOrder === "discountDesc" ? "nameAsc" : "discountDesc"
                            )}
                        >
                            <Text 
                                className={`text-xs font-medium ${
                                    sortOrder === "discountDesc" ? "text-amber-700" : "text-gray-500"
                                }`}
                            >
                                Discounts {sortOrder === "discountDesc" && "↓"}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                            </View>
            </Animated.View>
            
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
                    keyExtractor={(item) => item.id}
                    renderItem={renderCategoryItem}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#3b82f6"
                            colors={["#3b82f6"]}
                        />
                    }
                    numColumns={1}
                    key={`category-list-${statusFilter}-${sortOrder}-columns-1`}
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
                animationType="slide"
                transparent={true}
                visible={modalVisible && selectedCategory !== null}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/60 justify-end items-center"
                    onPress={() => setModalVisible(false)}
                >
                    <Animated.View 
                        style={[
                            {
                                width: '100%',
                                backgroundColor: 'white',
                                borderTopLeftRadius: 25,
                                borderTopRightRadius: 25,
                                maxHeight: '85%',
                                transform: [{ translateY: translateY }]
                            }
                        ]}
                    >
                        <Pressable 
                            className="w-full"
                            onPress={e => e.stopPropagation()}
                        >
                            {selectedCategory && (
                                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                                    {/* Handle Bar */}
                                    <View className="items-center pt-2 pb-4">
                                        <View className="w-16 h-1 rounded-full bg-gray-300" />
                                    </View>
                                    
                                    {/* Image Section */}
                                    <View className="w-full h-[220] relative">
                                        {selectedCategory.image ? (
                                            <Image 
                                                source={{ uri: selectedCategory.image }} 
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <LinearGradient
                                                colors={['#f3f4f6', '#e5e7eb']}
                                                className="w-full h-full justify-center items-center"
                                            >
                                                <Ionicons name="image-outline" size={60} color="#9ca3af" />
                                                <Text className="text-gray-400 mt-2">No image available</Text>
                                            </LinearGradient>
                                        )}
                                        
                                        {/* Status Badge */}
                                        <View 
                                            className={`absolute bottom-3 right-3 px-4 py-2 rounded-full ${
                                                selectedCategory.status === "Active" 
                                                    ? "bg-green-500/90" 
                                                    : "bg-gray-500/90"
                                            }`}
                                        >
                                            <Text className="text-white text-sm font-semibold">
                                                {selectedCategory.status}
                                            </Text>
                                        </View>
                                        
                                        {/* Close Button */}
                                        <TouchableOpacity 
                                            onPress={() => setModalVisible(false)}
                                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 justify-center items-center"
                                            style={{ backdropFilter: 'blur(2px)' }}
                                        >
                                            <Ionicons name="close" size={22} color="white" />
                                        </TouchableOpacity>
                                        
                                        {/* Discount Badge */}
                                        {selectedCategory.discountAvailable && selectedCategory.discountPercentage > 0 && (
                                            <View className="absolute top-3 left-3 bg-amber-500/90 px-4 py-2 rounded-full flex-row items-center">
                                                <FontAwesome5 name="tags" size={14} color="white" style={{marginRight: 4}} />
                                                <Text className="text-white font-bold">{selectedCategory.discountPercentage}% OFF</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    {/* Details Section */}
                                    <View className="p-5">
                                        <Text className="text-2xl font-bold text-gray-800">{selectedCategory.categoryName}</Text>
                                        
                                        <View className="flex-row items-center mt-2 mb-4">
                                            <View className="flex-row items-center">
                                                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                                <Text className="text-gray-500 text-sm ml-1">
                                                    Added: {selectedCategory.dateAdded ? new Date(selectedCategory.dateAdded).toLocaleDateString() : "Unknown"}
                                                </Text>
                                            </View>
                                            <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                                            <View className="flex-row items-center">
                                                <Ionicons name="time-outline" size={16} color="#6b7280" />
                                                <Text className="text-gray-500 text-sm ml-1">
                                                    {selectedCategory.dateAdded ? new Date(selectedCategory.dateAdded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Unknown"}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        {/* Description Card */}
                                        <View className="bg-gray-50 p-4 rounded-xl mb-4 shadow-sm">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="information-circle" size={18} color="#4b5563" />
                                                <Text className="text-base font-semibold text-gray-700 ml-2">Description</Text>
                                            </View>
                                            <Text className="text-gray-600">{selectedCategory.description || "No description provided"}</Text>
                                        </View>
                                        
                                        {/* Discount Information */}
                                        {selectedCategory.discountAvailable ? (
                                            <View className="bg-amber-50 p-4 rounded-xl mb-4 shadow-sm">
                                                <View className="flex-row items-center mb-2">
                                                    <Ionicons name="pricetag" size={18} color="#b45309" />
                                                    <Text className="text-base font-semibold text-amber-700 ml-2">Discount Information</Text>
                                                </View>
                                                <Text className="text-amber-600">
                                                    This category has a {selectedCategory.discountPercentage}% discount applied to all products.
                                                </Text>
                                                <View className="mt-3 p-3 bg-amber-100 rounded-lg">
                                                    <Text className="text-amber-800 text-xs font-medium">
                                                        Example: A $100 product would be discounted to ${(100 - (100 * selectedCategory.discountPercentage / 100)).toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View className="bg-gray-50 p-4 rounded-xl mb-4 shadow-sm">
                                                <View className="flex-row items-center mb-2">
                                                    <Ionicons name="pricetag-outline" size={18} color="#4b5563" />
                                                    <Text className="text-base font-semibold text-gray-700 ml-2">Discount Information</Text>
                                                </View>
                                                <Text className="text-gray-600">No discounts applied to this category.</Text>
                                            </View>
                                        )}
                                        
                                        {/* Products info */}
                                        <View className="bg-blue-50 p-4 rounded-xl mb-4 shadow-sm">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="cube-outline" size={18} color="#1e40af" />
                                                <Text className="text-base font-semibold text-blue-700 ml-2">Products</Text>
                                            </View>
                                            <TouchableOpacity 
                                                className="flex-row items-center justify-between p-3 bg-blue-100 rounded-lg"
                                                onPress={() => {
                                                    setModalVisible(false);
                                                    router.push({
                                                        pathname: "/stockManager/ProductList",
                                                        params: { categoryFilter: selectedCategory.categoryName }
                                                    });
                                                }}
                                            >
                                                <Text className="text-blue-600">View products in this category</Text>
                                                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Action Buttons */}
                                        <View className="flex-row space-x-3 mt-3 mb-6">
                                            <TouchableOpacity 
                                                className="flex-1 py-3.5 rounded-xl border border-gray-300 flex-row justify-center items-center"
                                                onPress={() => {
                                                    setModalVisible(false);
                                                    setTimeout(() => confirmDelete(selectedCategory), 300);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                <Text className="text-red-500 font-medium ml-2">Delete</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                className="flex-1 py-3.5 rounded-xl bg-blue-500 flex-row justify-center items-center"
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
                                </ScrollView>
                            )}
                        </Pressable>
                    </Animated.View>
                        </Pressable>
            </Modal>
            
            {/* Filter/Sort Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={() => setFilterModalVisible(false)}
                >
                    <Pressable 
                        className="bg-white rounded-xl w-[90%] max-w-[350] max-h-[80%]"
                        onPress={e => e.stopPropagation()}
                    >
                        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                            <View className="p-5">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xl font-bold text-gray-800">Filter & Sort</Text>
                                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#4b5563" />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Status Filter */}
                                <Text className="text-base font-semibold text-gray-700 mb-3">Status</Text>
                                <View className="flex-row flex-wrap mb-5">
                                    {["All", "Active", "Inactive"].map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setStatusFilter(status)}
                                            className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                                                statusFilter === status 
                                                    ? status === "Active" 
                                                        ? "bg-green-100 border border-green-200" 
                                                        : status === "Inactive" 
                                                            ? "bg-gray-200 border border-gray-300"
                                                            : "bg-blue-100 border border-blue-200"
                                                    : "bg-gray-50 border border-gray-200"
                                            }`}
                                        >
                                            <Text 
                                                className={`text-sm font-medium ${
                                                    statusFilter === status 
                                                        ? status === "Active" 
                                                            ? "text-green-700" 
                                                            : status === "Inactive" 
                                                                ? "text-gray-700"
                                                                : "text-blue-700"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {status}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                
                                {/* Sort Options */}
                                <Text className="text-base font-semibold text-gray-700 mb-3">Sort By</Text>
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
                                            sortOrder === option.id ? "bg-blue-50" : "bg-gray-50"
                                        }`}
                                        onPress={() => setSortOrder(option.id)}
                                    >
                                        <MaterialCommunityIcons 
                                            name={option.icon} 
                                            size={20} 
                                            color={sortOrder === option.id ? "#3b82f6" : "#6b7280"} 
                                        />
                                        <Text 
                                            className={`ml-3 ${
                                                sortOrder === option.id 
                                                    ? "text-blue-700 font-medium" 
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {option.label}
                                        </Text>
                                        {sortOrder === option.id && (
                                            <Ionicons name="checkmark-circle" size={20} color="#3b82f6" style={{ marginLeft: 'auto' }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                                
                                {/* Apply Button */}
                                <View className="flex-row mt-4 space-x-3">
                                    <TouchableOpacity 
                                        className="flex-1 py-3 rounded-lg bg-gray-200"
                                        onPress={() => {
                                            setStatusFilter("All");
                                            setSortOrder("nameAsc");
                                        }}
                                    >
                                        <Text className="text-gray-700 font-medium text-center">Reset</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        className="flex-1 py-3 rounded-lg bg-blue-500"
                                        onPress={() => setFilterModalVisible(false)}
                                    >
                                        <Text className="text-white font-medium text-center">Apply</Text>
                                    </TouchableOpacity>
                                </View>
                    </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}