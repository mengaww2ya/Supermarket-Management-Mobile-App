import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    StatusBar,
    StyleSheet,
    Dimensions,
    Alert,
    Modal,
    ScrollView
} from 'react-native';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AllSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState('All');
    const [sortBy, setSortBy] = useState('nameAsc');
    const [productTypes, setProductTypes] = useState([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const router = useRouter();
    const navigation = useNavigation();

    // Animation values
    const scrollY = useSharedValue(0);
    const headerOpacity = useSharedValue(1);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [suppliers, searchQuery, filterBy, sortBy]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            // Query users collection where role is "supplier"
            const usersCollection = collection(db, 'users');
            const usersQuery = query(usersCollection, where("role", "==", "supplier"));
            const suppliersSnapshot = await getDocs(usersQuery);

            const suppliersList = suppliersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Calculate some metrics for filtering if they don't exist in the data
                ordersCount: doc.data().ordersCount || 0,
                active: doc.data().active !== undefined ? doc.data().active : true,
            }));

            // Extract unique product types for filtering
            const types = new Set();
            suppliersList.forEach(supplier => {
                if (supplier.productType) {
                    if (Array.isArray(supplier.productType)) {
                        supplier.productType.forEach(type => types.add(type));
                    } else {
                        types.add(supplier.productType);
                    }
                }
            });

            setProductTypes(['All', ...Array.from(types)]);
            setSuppliers(suppliersList);
            setFilteredSuppliers(suppliersList);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            Alert.alert("Error", "Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...suppliers];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(supplier =>
                (supplier.companyName && supplier.companyName.toLowerCase().includes(query)) ||
                (supplier.email && supplier.email.toLowerCase().includes(query)) ||
                (supplier.phone && supplier.phone.includes(query)) ||
                (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(query))
            );
        }

        // Apply product type filter
        if (filterBy !== 'All') {
            result = result.filter(supplier => {
                if (!supplier.productType) return false;

                if (Array.isArray(supplier.productType)) {
                    return supplier.productType.includes(filterBy);
                } else {
                    return supplier.productType === filterBy;
                }
            });
        }

        // Apply sorting
        if (sortBy === 'nameAsc') {
            result.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
        } else if (sortBy === 'nameDesc') {
            result.sort((a, b) => (b.companyName || '').localeCompare(a.companyName || ''));
        } else if (sortBy === 'ordersDesc') {
            result.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
        } else if (sortBy === 'ordersAsc') {
            result.sort((a, b) => (a.ordersCount || 0) - (b.ordersCount || 0));
        }

        setFilteredSuppliers(result);
    };

    const provideFeedback = (type) => {
        switch (type) {
            case 'light':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            default:
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const navigateToSupplierDetails = (supplier) => {
        provideFeedback('light');
        Alert.alert(
            supplier.companyName || 'Supplier Details',
            `Name: ${supplier.companyName || 'Unnamed Supplier'}\n` +
            `${supplier.contactPerson ? 'Contact: ' + supplier.contactPerson + '\n' : ''}` +
            `${supplier.email ? 'Email: ' + supplier.email + '\n' : ''}` +
            `${supplier.phone ? 'Phone: ' + supplier.phone + '\n' : ''}` +
            `${supplier.address ? 'Address: ' + supplier.address + '\n' : ''}` +
            `Orders: ${supplier.ordersCount || 0}\n` +
            `Product Types: ${Array.isArray(supplier.productType) ?
                supplier.productType.join(', ') : supplier.productType || 'N/A'}\n` +
            `Status: ${supplier.active ? 'Active' : 'Inactive'}`,
            [
                {
                    text: "Close",
                    style: "cancel"
                },
                {
                    text: "View Products",
                    onPress: () => {
                        provideFeedback('medium');
                        router.push({
                            pathname: "/stockManager/SupplierCatalog",
                            params: { supplierId: supplier.id }
                        });
                    }
                }
            ]
        );
    };

    const handleAddNewSupplier = () => {
        provideFeedback('medium');
        // Navigate to add supplier page
        router.push('/admine/manageSuppliers');
    };

    const toggleFilterModal = () => {
        provideFeedback('light');
        setFilterModalVisible(!filterModalVisible);
    };

    const selectFilter = (filter) => {
        setFilterBy(filter);
        setFilterModalVisible(false);
        provideFeedback('light');
    };

    const renderSupplierCard = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.supplierCard}
        >
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigateToSupplierDetails(item)}
            >
                {/* Supplier Logo/Image */}
                <View style={styles.supplierImageContainer}>
                    {item.photoURL ? (
                        <Image
                            source={{ uri: item.photoURL }}
                            style={styles.supplierImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.supplierImagePlaceholder}>
                            <MaterialCommunityIcons name="domain" size={28} color="#9CA3AF" />
                        </View>
                    )}
                </View>

                {/* Supplier Details */}
                <View style={styles.supplierDetails}>
                    <Text style={styles.supplierName}>{item.companyName || 'Unnamed Supplier'}</Text>

                    <View style={styles.contactInfo}>
                        {item.contactPerson && (
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>{item.contactPerson}</Text>
                            </View>
                        )}

                        {item.email && (
                            <View style={styles.infoRow}>
                                <Ionicons name="mail-outline" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>{item.email}</Text>
                            </View>
                        )}

                        {item.phone && (
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>{item.phone}</Text>
                            </View>
                        )}
                    </View>

                    {/* Product Type and Order Count */}
                    <View style={styles.statusRow}>
                        {item.productType && (
                            <View style={styles.productTypeBadge}>
                                <Text style={styles.productTypeText}>
                                    {Array.isArray(item.productType)
                                        ? item.productType.join(', ')
                                        : item.productType}
                                </Text>
                            </View>
                        )}

                        <View style={styles.orderBadge}>
                            <Text style={styles.orderText}>
                                {item.ordersCount || 0} Orders
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Button */}
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
        </Animated.View>
    );

    const renderFilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter by Product Type</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={productTypes}
                            keyExtractor={(item, index) => `filter-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.filterItem,
                                        filterBy === item && styles.selectedFilterItem
                                    ]}
                                    onPress={() => selectFilter(item)}
                                >
                                    <Text style={[
                                        styles.filterItemText,
                                        filterBy === item && styles.selectedFilterItemText
                                    ]}>
                                        {item}
                                    </Text>
                                    {filterBy === item && (
                                        <Ionicons name="checkmark" size={18} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.filterList}
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderSupplierDetailsModal = () => (
        <Modal
            visible={detailsModalVisible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={() => setDetailsModalVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                paddingHorizontal: 16,
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    overflow: 'hidden',
                    maxHeight: '80%',
                    width: '100%',
                }}>
                    {selectedSupplier && (
                        <>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: '#E5E7EB',
                            }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#111827',
                                }}>Supplier Details</Text>
                                <TouchableOpacity
                                    onPress={() => setDetailsModalVisible(false)}
                                    style={{ padding: 4 }}
                                >
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: '100%' }}>
                                {/* Supplier Profile */}
                                <View style={{
                                    alignItems: 'center',
                                    padding: 16,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E5E7EB',
                                }}>
                                    <View style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        marginBottom: 12,
                                        overflow: 'hidden',
                                        borderWidth: 2,
                                        borderColor: '#E5E7EB',
                                    }}>
                                        {selectedSupplier.photoURL ? (
                                            <Image
                                                source={{ uri: selectedSupplier.photoURL }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#F3F4F6',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <MaterialCommunityIcons name="domain" size={36} color="#9CA3AF" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        color: '#111827',
                                    }}>{selectedSupplier.companyName || 'Unnamed Supplier'}</Text>
                                </View>

                                {/* Contact Information */}
                                <View style={{
                                    padding: 16,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E5E7EB',
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: '#4B5563',
                                        marginBottom: 12,
                                    }}>Contact Information</Text>

                                    {selectedSupplier.contactPerson && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Ionicons name="person" size={20} color="#4F46E5" />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Contact Person</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#111827',
                                                    fontWeight: '500',
                                                }}>{selectedSupplier.contactPerson}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {selectedSupplier.email && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Ionicons name="mail" size={20} color="#4F46E5" />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Email</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#111827',
                                                    fontWeight: '500',
                                                }}>{selectedSupplier.email}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {selectedSupplier.phone && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Ionicons name="call" size={20} color="#4F46E5" />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Phone</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#111827',
                                                    fontWeight: '500',
                                                }}>{selectedSupplier.phone}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {selectedSupplier.address && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Ionicons name="location" size={20} color="#4F46E5" />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Address</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#111827',
                                                    fontWeight: '500',
                                                }}>{selectedSupplier.address}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Business Information */}
                                <View style={{
                                    padding: 16,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E5E7EB',
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: '#4B5563',
                                        marginBottom: 12,
                                    }}>Business Information</Text>

                                    {selectedSupplier.productType && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <MaterialIcons name="category" size={20} color="#4F46E5" />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Product Types</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: '#111827',
                                                    fontWeight: '500',
                                                }}>
                                                    {Array.isArray(selectedSupplier.productType)
                                                        ? selectedSupplier.productType.join(', ')
                                                        : selectedSupplier.productType}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={{
                                        flexDirection: 'row',
                                        marginBottom: 16,
                                    }}>
                                        <View style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 18,
                                            backgroundColor: '#EEF2FF',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 12,
                                        }}>
                                            <MaterialIcons name="shopping-bag" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{
                                            flex: 1,
                                            justifyContent: 'center',
                                        }}>
                                            <Text style={{
                                                fontSize: 14,
                                                color: '#6B7280',
                                                marginBottom: 2,
                                            }}>Orders</Text>
                                            <Text style={{
                                                fontSize: 16,
                                                color: '#111827',
                                                fontWeight: '500',
                                            }}>{selectedSupplier.ordersCount || 0}</Text>
                                        </View>
                                    </View>

                                    {selectedSupplier.active !== undefined && (
                                        <View style={{
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#EEF2FF',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <MaterialIcons
                                                    name="verified"
                                                    size={20}
                                                    color={selectedSupplier.active ? "#10B981" : "#6B7280"}
                                                />
                                            </View>
                                            <View style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    marginBottom: 2,
                                                }}>Status</Text>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: selectedSupplier.active ? "#10B981" : "#6B7280",
                                                    fontWeight: '500',
                                                }}>
                                                    {selectedSupplier.active ? "Active" : "Inactive"}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View style={{
                                    padding: 16,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#4F46E5',
                                            paddingVertical: 12,
                                            paddingHorizontal: 24,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                        }}
                                        onPress={() => {
                                            setDetailsModalVisible(false);
                                            provideFeedback('medium');
                                            router.push({
                                                pathname: "/stockManager/SupplierCatalog",
                                                params: { supplierId: selectedSupplier.id }
                                            });
                                        }}
                                    >
                                        <Text style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: 16,
                                        }}>View Products</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: headerOpacity.value,
            transform: [
                {
                    translateY: scrollY.value > 20 ? withTiming(-10) : withTiming(0)
                }
            ]
        };
    });

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.y;
        scrollY.value = scrollPosition;

        // Fade out header on scroll down
        if (scrollPosition > 20) {
            headerOpacity.value = withTiming(0.5, { duration: 150 });
        } else {
            headerOpacity.value = withTiming(1, { duration: 150 });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Suppliers</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddNewSupplier}
                >
                    <Ionicons name="add" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <Animated.View style={[styles.searchContainer, headerAnimatedStyle]}>
                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search suppliers..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                            >
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Button - Moved to right side of search input */}
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={toggleFilterModal}
                    >
                        <Ionicons name="filter" size={20} color="#4F46E5" />
                        {filterBy !== 'All' && (
                            <View style={styles.filterActiveDot} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Filter indicator and Sort button */}
                <View style={styles.filterInfoContainer}>
                    {filterBy !== 'All' && (
                        <View style={styles.activeFilterChip}>
                            <Text style={styles.activeFilterText}>{filterBy}</Text>
                            <TouchableOpacity
                                style={styles.clearFilterButton}
                                onPress={() => {
                                    setFilterBy('All');
                                    provideFeedback('light');
                                }}
                            >
                                <Ionicons name="close-circle" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => {
                            provideFeedback('light');
                            // Toggle sort order
                            if (sortBy === 'nameAsc') setSortBy('nameDesc');
                            else if (sortBy === 'nameDesc') setSortBy('ordersDesc');
                            else if (sortBy === 'ordersDesc') setSortBy('ordersAsc');
                            else setSortBy('nameAsc');
                        }}
                    >
                        <MaterialCommunityIcons
                            name={
                                sortBy === 'nameAsc' ? 'sort-alphabetical-ascending' :
                                    sortBy === 'nameDesc' ? 'sort-alphabetical-descending' :
                                        sortBy === 'ordersDesc' ? 'sort-numeric-descending' :
                                            'sort-numeric-ascending'
                            }
                            size={20}
                            color="#4F46E5"
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Suppliers List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading suppliers...</Text>
                </View>
            ) : filteredSuppliers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="domain-off" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>
                        {searchQuery || filterBy !== 'All' ? "No matching suppliers" : "No suppliers found"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery || filterBy !== 'All'
                            ? "Try a different search term or filter"
                            : "Add suppliers to manage your inventory"
                        }
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => {
                            if (searchQuery) setSearchQuery('');
                            if (filterBy !== 'All') setFilterBy('All');
                            if (!searchQuery && filterBy === 'All') handleAddNewSupplier();
                        }}
                    >
                        <Text style={styles.emptyButtonText}>
                            {searchQuery || filterBy !== 'All' ? "Clear Filters" : "Add New Supplier"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredSuppliers}
                    renderItem={renderSupplierCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.resultCount}>
                                {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'} found
                                {filterBy !== 'All' ? ` in ${filterBy}` : ''}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Filter Modal */}
            {renderFilterModal()}

            {/* Supplier Details Modal */}
            {renderSupplierDetailsModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backButton: {
        padding: 8,
    },
    addButton: {
        padding: 8,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#4B5563',
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E7FF',
        position: 'relative',
    },
    filterActiveDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4F46E5',
    },
    filterInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    activeFilterText: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '500',
    },
    clearFilterButton: {
        marginLeft: 6,
    },
    sortButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    listHeader: {
        marginBottom: 12,
    },
    resultCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    supplierCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2.84,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    supplierImageContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 16,
        overflow: 'hidden',
    },
    supplierImage: {
        width: '100%',
        height: '100%',
    },
    supplierImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    supplierDetails: {
        flex: 1,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    contactInfo: {
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    productTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: '#DBEAFE',
        marginBottom: 4,
    },
    productTypeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1E40AF',
    },
    orderBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        marginBottom: 4,
    },
    orderText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4F46E5',
    },
    // Filter Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalContent: {
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    filterList: {
        padding: 8,
        maxHeight: 300,
    },
    filterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedFilterItem: {
        backgroundColor: '#F9FAFB',
    },
    filterItemText: {
        fontSize: 16,
        color: '#4B5563',
    },
    selectedFilterItemText: {
        color: '#4F46E5',
        fontWeight: '500',
    },
    // Supplier Details Modal Styles
    detailsModalContainer: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    detailsModalContent: {
        width: '100%',
        maxHeight: '100%',
    },
    detailsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detailsModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    supplierProfile: {
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    supplierAvatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    supplierAvatar: {
        width: '100%',
        height: '100%',
    },
    supplierAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsSupplierName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    detailsSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailsIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailsTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    detailsLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    detailsValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    detailsActions: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    viewProductsButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    viewProductsButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 