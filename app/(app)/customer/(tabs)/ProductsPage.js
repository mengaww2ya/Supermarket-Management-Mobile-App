import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProductsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [filterType, setFilterType] = useState('all');

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Products</Text>
            </View>

            <View style={styles.searchAndFilterContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9ca3af"
                        />
                        {searchQuery.trim() !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilterOptions(!showFilterOptions)}
                    >
                        <Ionicons name="filter" size={22} color="#374151" />
                    </TouchableOpacity>
                </View>

                {showFilterOptions && (
                    <View style={styles.filterDropdown}>
                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'all' && styles.activeFilterOption]}
                            onPress={() => {
                                setFilterType('all');
                                setShowFilterOptions(false);
                            }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'all' && styles.activeFilterText]}>
                                All Products
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'discountProducts' && styles.activeFilterOption]}
                            onPress={() => {
                                setFilterType('discountProducts');
                                setShowFilterOptions(false);
                            }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'discountProducts' && styles.activeFilterText]}>
                                Discount Products
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'featured' && styles.activeFilterOption]}
                            onPress={() => {
                                setFilterType('featured');
                                setShowFilterOptions(false);
                            }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'featured' && styles.activeFilterText]}>
                                Featured Products
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        padding: 16,
        backgroundColor: '#fff',
        position: 'relative',
        zIndex: 10,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchAndFilterContainer: {
        padding: 16,
        backgroundColor: '#fff',
        position: 'relative',
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        borderRadius: 10,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#4b5563',
    },
    searchIcon: {
        marginRight: 8,
    },
    clearButton: {
        padding: 4,
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 44,
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterDropdown: {
        position: 'absolute',
        top: 70,
        right: 16,
        width: 200,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        zIndex: 20,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    activeFilterOption: {
        backgroundColor: '#ebf5ff',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#4b5563',
    },
    activeFilterText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});

export default ProductsPage; 