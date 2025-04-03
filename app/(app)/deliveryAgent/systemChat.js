import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal,
  SafeAreaView, Pressable, ActivityIndicator, Image, Alert, ScrollView, Keyboard, Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection, query, where, getDocs, doc, getDoc, setDoc, addDoc,
  serverTimestamp, orderBy, updateDoc, writeBatch, increment
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function SystemChat() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const currentUser = auth.currentUser;
  const [filterAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedRole, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Query users collection for all users except the current user
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('uid', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => {
        const userData = doc.data();
        
        // Normalize role values - treat both 'deliveryAgent' and 'delivery' as valid delivery agent roles
        // This ensures that if there's any inconsistency in how roles are stored, we handle all cases
        let normalizedRole = userData.role;
        
        // Handle delivery role variations
        if (normalizedRole === 'delivery') {
          normalizedRole = 'deliveryAgent';
        }
        
        // Handle supplier role variations (if any exist)
        if (normalizedRole === 'suplier' || normalizedRole === 'vendor') {
          normalizedRole = 'supplier';
        }
        
        return {
          id: doc.id,
          ...userData,
          role: normalizedRole // Assign the normalized role
        };
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply role filter
    if (selectedRole) {
      filtered = filtered.filter(user => {
        // For deliveryAgent, match both 'deliveryAgent' and 'delivery' roles 
        // even if normalization wasn't perfect
        if (selectedRole === 'deliveryAgent') {
          return user.role === 'deliveryAgent' || user.role === 'delivery';
        }
        return user.role === selectedRole;
      });
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        // Comprehensive search across multiple user fields using optional chaining
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const fullName = user.fullName?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const phone = user.phone || '';
        
        return firstName.includes(query) || 
               lastName.includes(query) ||
               fullName.includes(query) ||
               name.includes(query) ||
               email.includes(query) || 
               phone.includes(query);
      });
    }

    setFilteredUsers(filtered);
  };

  const handleRoleSelect = (role) => {
    if (selectedRole === role) {
      // If the same role is selected again, deselect it
      setSelectedRole(null);
    } else {
      setSelectedRole(role);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animateFilterModal = (show) => {
    Animated.spring(filterAnimation, {
      toValue: show ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const toggleFilterModal = () => {
    if (!filterModalVisible) {
      setFilterModalVisible(true);
      animateFilterModal(true);
    } else {
      animateFilterModal(false);
      setTimeout(() => setFilterModalVisible(false), 200);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const applyFilter = (role) => {
    handleRoleSelect(role);
    setFilterModalVisible(false);
  };

  const clearFilter = () => {
    setSelectedRole(null);
    
    // Close modal with animation
    animateFilterModal(false);
    setTimeout(() => setFilterModalVisible(false), 200);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToChat = (user) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      router.push({
        pathname: "/chatRoom",
        params: { 
          uid: user.uid,
          name: user.name || user.email || 'User'
        }
      });
    } catch (navError) {
      console.error("Navigation error:", navError);
      
      // Fallback navigation method if the first fails
      setTimeout(() => {
        router.push(`/chatRoom?uid=${user.uid}&name=${encodeURIComponent(user.name || user.email || 'User')}`);
      }, 100);
    }
  };

  const RoleFilterChip = ({ title, onPress, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.roleChip,
        isSelected && styles.selectedRoleChip
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.roleChipText,
        isSelected && styles.selectedRoleChipText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyImageContainer}>
        <Feather name="search" size={80} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No users found</Text>
      <Text style={styles.emptyText}>
        {searchQuery.trim() !== '' 
          ? "Try a different search term or clear filters" 
          : selectedRole 
            ? "Try removing role filters" 
            : "There are no users available to message"}
      </Text>
      {(searchQuery.trim() !== '' || selectedRole) && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedRole(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderUserItem = ({ item }) => {
    // Extract name from various possible user properties
    const getName = () => {
      if (item.name) return item.name;
      if (item.fullName) return item.fullName;
      if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
      if (item.firstName) return item.firstName;
      return item.email || 'Unknown User';
    };
    
    // Extract initials for avatar placeholder
    const getInitials = () => {
      if (item.firstName && item.lastName) {
        return `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`;
      } else if (item.name) {
        const nameParts = item.name.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
        }
        return item.name.charAt(0);
      } else if (item.fullName) {
        const nameParts = item.fullName.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
        }
        return item.fullName.charAt(0);
      }
      return item.email ? item.email.charAt(0).toUpperCase() : '?';
    };
    
    // Get role details (label and color)
    const getRoleDetails = (role) => {
      // Default values
      let details = { label: 'User', color: '#6c757d' };
      
      // Normalize role for display purposes
      const normalizedRole = role === 'delivery' ? 'deliveryAgent' : role;
      
      switch (normalizedRole) {
        case 'admin':
          details = { label: 'Admin', color: '#dc3545' }; // Red
          break;
        case 'manager':
          details = { label: 'Manager', color: '#fd7e14' }; // Orange
          break;
        case 'customer':
          details = { label: 'Customer', color: '#20c997' }; // Teal
          break;
        case 'stockManager':
          details = { label: 'Stock Manager', color: '#6f42c1' }; // Purple
          break;
        case 'customerAssistance':
          details = { label: 'Support', color: '#0dcaf0' }; // Cyan
          break;
        case 'deliveryAgent':
          details = { label: 'Delivery', color: '#4F46E5' }; // Blue
          break;
        case 'supplier':
          details = { label: 'Supplier', color: '#f59e0b' }; // Amber
          break;
        default:
          details = { 
            label: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User', 
            color: '#6c757d' 
          }; // Gray
      }
      
      return details;
    };
    
    const displayName = getName();
    const roleDetails = getRoleDetails(item.role);
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => navigateToChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.noAvatar]}>
              <Text style={styles.avatarText}>
                {getInitials()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email || ''}
          </Text>
        </View>
        
        <View style={[styles.roleBadge, { backgroundColor: `${roleDetails.color}20` }]}>
          <Text style={[styles.roleText, { color: roleDetails.color }]}>
            {roleDetails.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Messaging</Text>
        
        <TouchableOpacity 
          style={styles.messagesButton}
          onPress={() => router.push('/deliveryAgent/(tabs)/messages')}
        >
          <Feather name="message-circle" size={18} color="white" />
          <Text style={styles.messagesButtonText}>Messages</Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar with Filter Icon */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#4F46E5" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Feather name="x" size={18} color="#999" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleFilterModal}
        >
          <Feather 
            name="filter" 
            size={20} 
            color={selectedRole ? "#4F46E5" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Selected Filter Chip (if any) */}
      {selectedRole && (
        <View style={styles.selectedFilterContainer}>
          <View style={styles.selectedFilterChip}>
            <Text style={styles.selectedFilterText}>
              {selectedRole === 'customer' ? 'Customers' : 
               selectedRole === 'deliveryAgent' ? 'Delivery Agents' : 
               selectedRole === 'stockManager' ? 'Stock Managers' : 
               selectedRole === 'customerAssistance' ? 'Customer Support' : 
               selectedRole === 'manager' ? 'Managers' : 
               selectedRole === 'admin' ? 'Admins' : 
               selectedRole === 'supplier' ? 'Suppliers' :
               selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => setSelectedRole(null)}>
              <Feather name="x" size={16} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredUsers.length === 0 ? 
            {flex: 1} : 
            {paddingVertical: 10, paddingBottom: 30}
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleFilterModal}
      >
        <TouchableOpacity 
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={toggleFilterModal}
        >
          <Animated.View 
            style={[
              styles.filterModalContainer,
              {
                transform: [
                  { scale: filterAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })},
                ],
                opacity: filterAnimation
              }
            ]}
          >
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filter By Role</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={toggleFilterModal}
                >
                  <Feather name="x" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.roleListContainer}
                showsVerticalScrollIndicator={false}
              >
                {['customer', 'deliveryAgent', 'stockManager', 'customerAssistance', 'manager', 'admin', 'supplier'].map((role) => (
                  <TouchableOpacity 
                    key={role}
                    style={[
                      styles.roleListItem,
                      selectedRole === role && styles.selectedRoleListItem
                    ]}
                    onPress={() => {
                      // Set the selected role
                      setSelectedRole(selectedRole === role ? null : role);
                      
                      // Close the modal with slight delay to show the selection
                      setTimeout(() => {
                        animateFilterModal(false);
                        setTimeout(() => setFilterModalVisible(false), 200);
                      }, 300);
                      
                      // Provide haptic feedback
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.roleListText,
                      selectedRole === role && styles.selectedRoleListText
                    ]}>
                      {role === 'customer' ? 'Customers' : 
                       role === 'deliveryAgent' ? 'Delivery Agents' : 
                       role === 'stockManager' ? 'Stock Managers' : 
                       role === 'customerAssistance' ? 'Customer Assistances' : 
                       role === 'manager' ? 'Managers' : 
                       role === 'admin' ? 'Admins' : 
                       role === 'supplier' ? 'Suppliers' : role}
                    </Text>
                    
                    {selectedRole === role && (
                      <View style={styles.radioSelected} />
                    )}
                    {selectedRole !== role && (
                      <View style={styles.radioUnselected} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.clearFilterButton}
                  onPress={clearFilter}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearFilterText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 60, // Adjust for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  messagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  messagesButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 15,
    margin: 16,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
    color: '#4F46E5',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    color: '#1f2937',
  },
  clearSearch: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
    marginLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
  },
  selectedFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 5,
  },
  selectedFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5f1ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedFilterText: {
    color: '#4F46E5',
    marginRight: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  filterModalContent: {
    padding: 24,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  roleGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleGridItem: {
    width: '48%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedRoleGridItem: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
    elevation: 3,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  roleIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  roleGridText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  selectedRoleText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  checkIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  clearFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clearFilterText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userAvatarContainer: {
    marginRight: 14,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  noAvatar: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  roleListContainer: {
    maxHeight: 350,
  },
  roleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRoleListItem: {
    backgroundColor: '#f5f3ff',
  },
  roleListText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedRoleListText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: '#4f46e5',
    backgroundColor: '#fff',
  },
}); 