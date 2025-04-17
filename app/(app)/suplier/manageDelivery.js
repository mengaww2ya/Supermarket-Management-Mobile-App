import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  FadeIn,
  interpolate
} from 'react-native-reanimated';
import HomeHeader from "../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const MAP_PLACEHOLDER = 'https://i.imgur.com/TkMiYSU.png'; // Replace with your actual map implementation

// Sample delivery data
const DELIVERIES = [
  {
    id: 'DEL-001',
    orderId: 'ORD-0001',
    store: 'Main Street Supermarket',
    address: '123 Main St, Cityville',
    status: 'in-transit',
    driver: 'John Doe',
    estimatedArrival: '2023-07-15 16:30',
    items: 23,
  },
  {
    id: 'DEL-002',
    orderId: 'ORD-0002',
    store: 'Central Market',
    address: '456 Center Ave, Townsburg',
    status: 'pending',
    driver: 'Unassigned',
    estimatedArrival: '-',
    items: 15,
  },
  {
    id: 'DEL-003',
    orderId: 'ORD-0003',
    store: 'Downtown Grocery',
    address: '789 Market St, Villageton',
    status: 'delivered',
    driver: 'Sarah Johnson',
    estimatedArrival: '2023-07-13 14:15',
    items: 32,
  },
  {
    id: 'DEL-004',
    orderId: 'ORD-0004',
    store: 'Food Plus',
    address: '101 Grocery Rd, Foodville',
    status: 'scheduled',
    driver: 'Mike Wilson',
    estimatedArrival: '2023-07-16 10:00',
    items: 18,
  },
];

// Memo-ize the FilterCategory component for better performance
const FilterCategory = memo(({ title, active, count, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.filterCategory, active && styles.activeFilterCategory]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterCategoryText, active && styles.activeFilterCategoryText]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Memo-ize the DeliveryCard component as well
const DeliveryCard = memo(({ delivery, onPress, index }) => {
  const scaleY = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scaleY.value = withTiming(1, { 
      duration: 500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      delay: index * 100 
    });
    opacity.value = withTiming(1, { 
      duration: 500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      delay: index * 100 
    });
  }, []);
  
  const animStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scaleY: scaleY.value }
      ]
    };
  });
  
  // Status info based on delivery status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: <MaterialIcons name="pending-actions" size={18} color="#FFA940" />,
          color: '#FFA940',
          bgColor: '#FFF4DE',
          text: 'Pending'
        };
      case 'scheduled':
        return {
          icon: <Ionicons name="calendar" size={18} color="#1890FF" />,
          color: '#1890FF',
          bgColor: '#E6F7FF',
          text: 'Scheduled'
        };
      case 'in-transit':
        return {
          icon: <FontAwesome5 name="truck-moving" size={16} color="#722ED1" />,
          color: '#722ED1',
          bgColor: '#F9F0FF',
          text: 'In Transit'
        };
      case 'delivered':
        return {
          icon: <Ionicons name="checkmark-circle" size={18} color="#52C41A" />,
          color: '#52C41A',
          bgColor: '#F6FFED',
          text: 'Delivered'
        };
      default:
        return {
          icon: <Ionicons name="help-circle" size={18} color="#8C8C8C" />,
          color: '#8C8C8C',
          bgColor: '#F5F5F5',
          text: 'Unknown'
        };
    }
  };
  
  const statusInfo = getStatusInfo(delivery.status);
  
  // Format date
  const formatDate = (dateStr) => {
    if (dateStr === '-') return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Animated.View style={[styles.deliveryCard, animStyle]}>
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryTitleContainer}>
          <Text style={styles.deliveryId}>{delivery.id}</Text>
          <Text style={styles.orderId}>Order: {delivery.orderId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          {statusInfo.icon}
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
        </View>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="store" size={16} color="#666" />
          <Text style={styles.infoText}>{delivery.store}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.infoText}>{delivery.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.infoText}>Driver: {delivery.driver}</Text>
        </View>
      </View>
      
      <View style={styles.deliveryFooter}>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>Estimated Arrival</Text>
          <Text style={styles.etaValue}>{formatDate(delivery.estimatedArrival)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => onPress(delivery)}
        >
          <Text style={styles.trackButtonText}>Track</Text>
          <Feather name="arrow-right" size={16} color="#5E7CE2" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default function ManageDelivery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [filteredDeliveries, setFilteredDeliveries] = useState(DELIVERIES);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Animation values for modal
  const modalAnimation = useSharedValue(0);
  
  // Calculate counts for each status - memoize this calculation
  const getDeliveryCountByStatus = useCallback((status) => {
    return DELIVERIES.filter(delivery => status === 'all' || delivery.status === status).length;
  }, []);
  
  // Filter deliveries when tab changes or search query changes
  useEffect(() => {
    // Debounce search for better responsiveness
    const debounceTimer = setTimeout(() => {
      try {
        // Simple check for the most common case
        if (activeTab === 'all' && !searchQuery.trim()) {
          setFilteredDeliveries(DELIVERIES);
          return;
        }
        
        // Apply filters
        let filtered = [...DELIVERIES];
        
        // Apply status filter
        if (activeTab !== 'all') {
          filtered = filtered.filter(delivery => delivery.status === activeTab);
        }
        
        // Apply search filter if there's a query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(delivery => 
            delivery.id.toLowerCase().includes(query) ||
            delivery.orderId.toLowerCase().includes(query) ||
            delivery.store.toLowerCase().includes(query) ||
            delivery.address.toLowerCase().includes(query) ||
            (delivery.driver && delivery.driver.toLowerCase().includes(query))
          );
        }
        
        setFilteredDeliveries(filtered);
      } catch (error) {
        console.error("Error filtering deliveries:", error);
        // Fallback to showing all deliveries if there's an error
        setFilteredDeliveries(DELIVERIES);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [activeTab, searchQuery]);
  
  // Memoize callback functions
  const handleDeliveryPress = useCallback((delivery) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDelivery(delivery);
  }, []);
  
  // Handle filter selection
  const handleFilterSelect = useCallback((filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab(filter);
    // Close modal after selection
    closeFilterModal();
  }, []);
  
  // Show filter modal
  const openFilterModal = useCallback(() => {
    if (showFilterModal) return; // Prevent multiple opens
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilterModal(true);
    modalAnimation.value = withTiming(1, { duration: 300 });
  }, [showFilterModal, modalAnimation]);
  
  // Hide filter modal
  const closeFilterModal = useCallback(() => {
    if (!showFilterModal) return; // Prevent multiple closes
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    modalAnimation.value = withTiming(0, { duration: 200 });
    
    // Ensure state updates happen after animation
    const timer = setTimeout(() => {
      setShowFilterModal(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [showFilterModal, modalAnimation]);
  
  // Modal animation styles
  const modalContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: modalAnimation.value,
    };
  }, []);
  
  const modalContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(modalAnimation.value, [0, 1], [20, 0]) }
      ],
      opacity: modalAnimation.value,
    };
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  }, []);
  
  // Reset all filters
  const handleResetFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab('all');
    setSearchQuery('');
  }, []);

  // Prepare filter items outside of the render to avoid re-calculation
  const filterItems = [
    {
      title: "All Deliveries",
      value: "all",
      count: getDeliveryCountByStatus('all')
    },
    {
      title: "Pending",
      value: "pending",
      count: getDeliveryCountByStatus('pending')
    },
    {
      title: "Scheduled",
      value: "scheduled",
      count: getDeliveryCountByStatus('scheduled')
    },
    {
      title: "In Transit",
      value: "in-transit",
      count: getDeliveryCountByStatus('in-transit')
    },
    {
      title: "Delivered",
      value: "delivered",
      count: getDeliveryCountByStatus('delivered')
    }
  ];
  
  // Handle back press
  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);
  
  // If map is showing, render only that
  if (selectedDelivery) {
    return (
        <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <HomeHeader 
          title="Manage Deliveries" 
          showBackButton={true} 
          onBackPress={handleBackPress}
        />
        
        {/* Delivery Map View */}
        <View style={styles.mapContainer}>
          <Image 
            source={{ uri: MAP_PLACEHOLDER }} 
            style={styles.map}
            resizeMode="cover"
          />
            <TouchableOpacity
            style={styles.closeMapButton}
            onPress={() => setSelectedDelivery(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.deliveryDetailCard}>
            <View style={styles.deliveryDetailHeader}>
              <Text style={styles.deliveryDetailTitle}>Delivery #{selectedDelivery.id}</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusInfo(selectedDelivery.status).bgColor }
              ]}>
                {getStatusInfo(selectedDelivery.status).icon}
                <Text style={[
                  styles.statusText, 
                  { color: getStatusInfo(selectedDelivery.status).color }
                ]}>
                  {getStatusInfo(selectedDelivery.status).text}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.deliveryDetailInfo}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Store:</Text>
                <Text style={styles.detailValue}>{selectedDelivery.store}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{selectedDelivery.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Driver:</Text>
                <Text style={styles.detailValue}>{selectedDelivery.driver}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ETA:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedDelivery.estimatedArrival)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.detailAction} activeOpacity={0.7}>
                <Feather name="phone" size={16} color="#5E7CE2" />
                <Text style={styles.detailActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailAction} activeOpacity={0.7}>
                <Feather name="message-square" size={16} color="#5E7CE2" />
                <Text style={styles.detailActionText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailAction} activeOpacity={0.7}>
                <MaterialIcons name="assignment" size={16} color="#5E7CE2" />
                <Text style={styles.detailActionText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
  
  // Main delivery list view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <HomeHeader 
        title="Manage Deliveries" 
        showBackButton={true} 
        onBackPress={handleBackPress}
      />
      
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries..."
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
            placeholderTextColor="#999"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={openFilterModal}
          activeOpacity={0.7}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="filter" size={22} color="#5E7CE2" />
          {activeTab !== 'all' && (
            <View style={styles.filterActiveIndicator} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Active filter indicator */}
      {activeTab !== 'all' && (
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterLabel}>Active filter:</Text>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterChipText}>
              {activeTab === 'in-transit' 
                ? 'In Transit' 
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Text>
            <TouchableOpacity 
              onPress={() => setActiveTab('all')}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={16} color="#5E7CE2" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Delivery List */}
      <ScrollView 
        style={styles.deliveryList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.deliveryListContent}
      >
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery, index) => (
            <DeliveryCard 
              key={delivery.id}
              delivery={delivery}
              onPress={handleDeliveryPress}
              index={index}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="truck" size={50} color="#ddd" />
            <Text style={styles.emptyStateText}>No deliveries found</Text>
            {(activeTab !== 'all' || searchQuery.trim() !== '') && (
              <TouchableOpacity 
                style={styles.resetFiltersButton}
                onPress={handleResetFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Filter Modal - Only render when visible */}
      {showFilterModal && (
        <Modal
          transparent={true}
          visible={true}
          animationType="none"
          onRequestClose={closeFilterModal}
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
          <TouchableWithoutFeedback onPress={closeFilterModal}>
            <Animated.View style={[styles.modalOverlay, modalContainerStyle]}>
              <TouchableWithoutFeedback>
                <Animated.View 
                  style={[styles.modalContent, modalContentStyle]}
                  entering={FadeIn.duration(300)}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Deliveries</Text>
                    <TouchableOpacity 
                      onPress={closeFilterModal}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView 
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {filterItems.map((item) => (
                      <FilterCategory 
                        key={item.value}
                        title={item.title} 
                        active={activeTab === item.value} 
                        count={item.count}
                        onPress={() => handleFilterSelect(item.value)} 
                      />
                    ))}
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

// Helper function for status info (used in detail view)
const getStatusInfo = (status) => {
  switch (status) {
    case 'pending':
      return {
        icon: <MaterialIcons name="pending-actions" size={18} color="#FFA940" />,
        color: '#FFA940',
        bgColor: '#FFF4DE',
        text: 'Pending'
      };
    case 'scheduled':
      return {
        icon: <Ionicons name="calendar" size={18} color="#1890FF" />,
        color: '#1890FF',
        bgColor: '#E6F7FF',
        text: 'Scheduled'
      };
    case 'in-transit':
      return {
        icon: <FontAwesome5 name="truck-moving" size={16} color="#722ED1" />,
        color: '#722ED1',
        bgColor: '#F9F0FF',
        text: 'In Transit'
      };
    case 'delivered':
      return {
        icon: <Ionicons name="checkmark-circle" size={18} color="#52C41A" />,
        color: '#52C41A',
        bgColor: '#F6FFED',
        text: 'Delivered'
      };
    default:
      return {
        icon: <Ionicons name="help-circle" size={18} color="#8C8C8C" />,
        color: '#8C8C8C',
        bgColor: '#F5F5F5',
        text: 'Unknown'
      };
  }
};

// Format date helper function
const formatDate = (dateStr) => {
  if (dateStr === '-') return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButton: {
    padding: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#5E7CE2',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: width / 5,
    backgroundColor: '#5E7CE2',
  },
  deliveryList: {
    flex: 1,
  },
  deliveryListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryTitleContainer: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderId: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  deliveryInfo: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  etaContainer: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
  },
  etaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5E7CE2',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  closeMapButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryDetailCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  deliveryDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  deliveryDetailInfo: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 70,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  detailActionText: {
    marginLeft: 6,
    color: '#5E7CE2',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f0f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5E7CE2',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  activeFilterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterChipText: {
    fontSize: 13,
    color: '#5E7CE2',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: height * 0.5,
  },
  filterCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9fc',
  },
  activeFilterCategory: {
    backgroundColor: '#EBF2FF',
  },
  filterCategoryText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    flex: 1,
  },
  activeFilterCategoryText: {
    color: '#5E7CE2',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#5E7CE2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  resetFiltersButton: {
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    marginTop: 20,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E7CE2',
    textAlign: 'center',
  },
});
