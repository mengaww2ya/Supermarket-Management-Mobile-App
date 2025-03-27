import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Avatar, Title, Caption, Text, TouchableRipple, Button } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const ProfileScreen = ({ navigation }) => {
    const [bio, setBio] = useState('');
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const documentId = "SPECIFIC_DOCUMENT_ID"; // Replace with the specific document ID you want to fetch

    const fetchUserData = async () => {
        console.log("Fetching user data for document ID:", documentId); // Log the document ID

        const userDoc = await getDoc(doc(db, 'stock_manager', documentId));

        if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("User data fetched:", data); // Log the fetched data
            setUserData(data);
            setBio(data.bio || '');
            setProfileImage(data.profilePicture || null);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setAddress(data.address || '');
            setPhone(data.phone || '');
            setEmail(data.email || '');
        } else {
            console.error("User document does not exist.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleEditProfile = async () => {
        const userRef = doc(db, 'stock_manager', documentId); // Use the specific document ID

        await updateDoc(userRef, {
            firstName,
            lastName,
            address,
            phone,
            email,
            bio,
        });

        setEditModalVisible(false);
        fetchUserData();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (result.canceled) {
            return;
        }

        if (result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setProfileImage(imageUri);

            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result;

                    const userRef = doc(db, 'stock_manager', documentId); // Use the specific document ID
                    await updateDoc(userRef, {
                        profilePicture: base64data,
                    });
                };
            } catch (error) {
                console.error("Error converting image to base64:", error);
            }
        } else {
            console.error("No image selected.");
        }
    };

    useLayoutEffect(() => {
        if (navigation) {
            navigation.setOptions({
                headerLeft: () => (
                    <View style={styles.editButtonContainer}>
                        <MaterialCommunityIcons.Button
                            name="account-edit"
                            size={25}
                            backgroundColor="#FFDC2B"
                            color="#000"
                            onPress={() => setEditModalVisible(true)}
                        />
                    </View>
                ),
            });
        }
    }, [navigation]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.userInfoSection}>
                <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 15 }}>
                    <TouchableOpacity onPress={pickImage}>
                        <Avatar.Image
                            source={{ uri: profileImage || 'https://example.com/default-image.png' }}
                            size={80}
                        />
                    </TouchableOpacity>
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                        <Title style={styles.title}>{userData?.firstName || 'Your First Name'}</Title>
                        <Caption style={styles.caption}>{userData?.lastName || 'Your Last Name'}</Caption>
                        <Text style={styles.bio}>{bio}</Text>
                        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                            <Text style={styles.editBioText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.userInfoSection}>
                <View style={styles.row}>
                    <Icon name="map-marker-radius" type="material-community" size={20} />
                    <Text style={styles.infoText}>{userData?.address || 'Your Address'}</Text>
                </View>
                <View style={styles.row}>
                    <Icon name="phone" type="material-community" size={20} />
                    <Text style={styles.infoText}>{userData?.phone || 'Your Phone'}</Text>
                </View>
                <View style={styles.row}>
                    <Icon name="email" type="material-community" size={20} />
                    <Text style={styles.infoText}>{userData?.email || 'Your Email'}</Text>
                </View>
            </View>

            {/* Modal for Editing Profile */}
            <Modal
                transparent={true}
                visible={isEditModalVisible}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First Name"
                            style={styles.modalTextInput}
                        />
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last Name"
                            style={styles.modalTextInput}
                        />
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Address"
                            style={styles.modalTextInput}
                        />
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone Number"
                            style={styles.modalTextInput}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            style={styles.modalTextInput}
                            keyboardType="email-address"
                        />
                        <Button mode="contained" onPress={handleEditProfile}>
                            Save
                        </Button>
                        <Button onPress={() => setEditModalVisible(false)} color="red">
                            Cancel
                        </Button>
                    </View>
                </View>
            </Modal>

            <View style={styles.menuWrapper}>
                <TouchableRipple>
                    <View style={styles.menuItem}>
                        <Icon name='account-check-outline' type="material-community" color="#ff6347" size={25} />
                        <Text style={styles.menuItemText}>Support</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple>
                    <View style={styles.menuItem}>
                        <Icon name='cog-outline' type="material-community" color="#ff6347" size={25} />
                        <Text style={styles.menuItemText}>Settings</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple>
                    <View style={styles.menuItem}>
                        <Icon name='logout' type="material-community" color="#ff6347" size={25} />
                        <Text style={styles.menuItemText}>Logout</Text>
                    </View>
                </TouchableRipple>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    editButtonContainer: {
        marginRight: 20,
    },
    userInfoSection: {
        paddingHorizontal: 30,
        marginBottom: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    caption: {
        fontSize: 14,
        lineHeight: 14,
        fontWeight: '500',
    },
    bio: {
        fontSize: 12,
        color: '#777777',
        marginTop: 5,
    },
    editBioText: {
        color: '#ff6347',
        marginTop: 5,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    infoText: {
        color: "#777777",
        marginLeft: 20,
    },
    menuWrapper: {
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    menuItemText: {
        color: '#777777',
        marginLeft: 20,
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 26,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalTextInput: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
});

export default ProfileScreen;