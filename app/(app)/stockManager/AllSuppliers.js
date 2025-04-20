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
    ScrollView,
    Platform
} from 'react-native';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
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
import { LinearGradient } from 'expo-linear-gradient';

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
    const [loadingSupplierDetails, setLoadingSupplierDetails] = useState(false);

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

    // Add an effect to fetch complete supplier details when one is selected
    useEffect(() => {
        if (selectedSupplier && selectedSupplier.id) {
            fetchCompleteSupplierDetails(selectedSupplier.id);
        }
    }, [selectedSupplier?.id]);

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

    // Function to fetch complete supplier details
    const fetchCompleteSupplierDetails = async (supplierId) => {
        if (!supplierId) return;

        try {
            setLoadingSupplierDetails(true);
            const supplierDocRef = doc(db, 'users', supplierId);
            const supplierDocSnap = await getDoc(supplierDocRef);

            if (supplierDocSnap.exists()) {
                // Update the selected supplier with full details
                setSelectedSupplier({
                    id: supplierId,
                    ...supplierDocSnap.data(),
                });
                console.log("Supplier details loaded successfully");
            } else {
                console.log("No supplier found with ID:", supplierId);
            }
        } catch (error) {
            console.error("Error fetching supplier details:", error);
            Alert.alert("Error", "Failed to load supplier details");
        } finally {
            setLoadingSupplierDetails(false);
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
        // Use the supplier data directly for the modal instead of relying on fetching again
        setSelectedSupplier({
            ...supplier,
            // Add any default values for potentially missing fields
            active: supplier.active !== undefined ? supplier.active : true,
            ordersCount: supplier.ordersCount || 0,
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            website: supplier.website || '',
            productType: supplier.productType || [],
            yearEstablished: supplier.yearEstablished || '',
            taxId: supplier.taxId || '',
            paymentTerms: supplier.paymentTerms || '',
            minOrderQuantity: supplier.minOrderQuantity || '',
            discountRate: supplier.discountRate || '',
        });
        setDetailsModalVisible(true);
    };

    const handleAddNewSupplier = () => {
        provideFeedback('medium');
        // Navigate to add supplier page
        router.push('/stockManager/manageSuppliers');
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

    const renderSupplierDetailsModal = () => {
        if (!selectedSupplier) return null;

        return (
            <Modal
                visible={detailsModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                    {/* Basic header */}
                    <View style={{
                        backgroundColor: '#4F46E5',
                        padding: 16,
                        paddingTop: Platform.OS === 'ios' ? 50 : 20
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => setDetailsModalVisible(false)}
                                style={{ padding: 8 }}
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>

                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                                Supplier Details
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedSupplier) {
                                        setDetailsModalVisible(false);
                                        router.push({
                                            pathname: "/stockManager/SupplierCatalog",
                                            params: { supplierId: selectedSupplier.id }
                                        });
                                    }
                                }}
                                style={{ padding: 8 }}
                            >
                                <Ionicons name="grid-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12
                            }}>
                                <MaterialCommunityIcons name="domain" size={30} color="#9CA3AF" />
                            </View>

                            <View>
                                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                                    {selectedSupplier.companyName || 'Unnamed Supplier'}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                                    {selectedSupplier.active ? 'Active Supplier' : 'Inactive Supplier'} • {selectedSupplier.ordersCount || 0} Orders
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Simple content with basic styling */}
                    <ScrollView style={{ flex: 1 }}>
                        {/* Contact Information */}
                        <View style={{ margin: 16, padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                                Contact Information
                            </Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Contact Person</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.contactPerson || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Email</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.email || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Phone</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.phone || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Address</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.address || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Website</Text>
                            <Text style={{ fontSize: 16 }}>{selectedSupplier.website || 'Not provided'}</Text>
                        </View>

                        {/* Product Types */}
                        <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                                Product Types
                            </Text>

                            {Array.isArray(selectedSupplier.productType) && selectedSupplier.productType.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {selectedSupplier.productType.map((type, index) => (
                                        <View key={index} style={{
                                            backgroundColor: '#F3F4F6',
                                            borderRadius: 16,
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            margin: 4
                                        }}>
                                            <Text>{type}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : typeof selectedSupplier.productType === 'string' && selectedSupplier.productType ? (
                                <View style={{
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: 16,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    alignSelf: 'flex-start'
                                }}>
                                    <Text>{selectedSupplier.productType}</Text>
                                </View>
                            ) : (
                                <Text>No product types specified</Text>
                            )}
                        </View>

                        {/* Business Information */}
                        <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                                Business Information
                            </Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Year Established</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.yearEstablished || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Tax ID</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.taxId || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Payment Terms</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.paymentTerms || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Minimum Order Quantity</Text>
                            <Text style={{ fontSize: 16, marginBottom: 12 }}>{selectedSupplier.minOrderQuantity || 'Not provided'}</Text>

                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Discount Rate</Text>
                            <Text style={{ fontSize: 16 }}>{selectedSupplier.discountRate ? `${selectedSupplier.discountRate}%` : 'Not provided'}</Text>
                        </View>

                        {/* Action Button */}
                        <View style={{ margin: 16, marginBottom: 32 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#4F46E5',
                                    padding: 16,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setDetailsModalVisible(false);
                                    router.push({
                                        pathname: "/stockManager/SupplierCatalog",
                                        params: { supplierId: selectedSupplier.id }
                                    });
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Supplier Products</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

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
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoIcon: {
        backgroundColor: '#EEF2FF',
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
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
    detailsTextContainer: {
        flex: 1,
        justifyContent: 'center',
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