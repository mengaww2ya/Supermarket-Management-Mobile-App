import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView,Text, Modal, TextInput,TouchableOpacity,   ActivityIndicator } from 'react-native';
import { Avatar, Title, Caption,  } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/authContext';
import HomeHeader from '../../../components/HomeHeader';
const ProfileScreen = () => {
  const router = useRouter(); 
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
  const {Logout } = useAuth(auth);
  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    if (!userId) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setBio(data.bio || "");
        setProfileImage(data.photoURL || null); // Use `photoURL`
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
      } else {
        console.warn("User document not found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        console.warn("User is not authenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update profile in Firestore
  const handleEditProfile = async () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);

    try {
      await updateDoc(userRef, {
        firstName,
        lastName,
        address,
        phone,
        email,
      });

      setEditModalVisible(false);
      fetchUserData(userId);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Image Picker for Profile Image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // TODO: Upload image to Firebase Storage and update Firestore
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }
const handleLogout = async () => {
    await Logout();
  }
  return (
    <SafeAreaView style={styles.container}>
             <HomeHeader title={"My Profile"}/>
      <View style={styles.userInfoSection}>
        <View style={{ flexDirection: 'row', marginTop: 15 }}>
          <TouchableOpacity onPress={pickImage}>
            <Avatar.Image
              source={{ uri: profileImage || 'https://via.placeholder.com/150' }}
              size={80}
            />
          </TouchableOpacity>
          <View style={{ marginLeft: 20 }}>
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
      {/* Overlay */}
      <View className="flex-1 justify-center items-center bg-black/50">
        {/* Modal Container */}
        <View className="w-11/12 bg-white rounded-lg p-6 shadow-lg">
          {/* Modal Title */}
          <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Edit Profile
          </Text>

          {/* Input Fields */}
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            className="bg-gray-100 rounded-lg p-3 mb-4 text-gray-800"
            placeholderTextColor="#6b7280"
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            className="bg-gray-100 rounded-lg p-3 mb-4 text-gray-800"
            placeholderTextColor="#6b7280"
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            className="bg-gray-100 rounded-lg p-3 mb-4 text-gray-800"
            placeholderTextColor="#6b7280"
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            className="bg-gray-100 rounded-lg p-3 mb-4 text-gray-800"
            placeholderTextColor="#6b7280"
            keyboardType="phone-pad"
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            className="bg-gray-100 rounded-lg p-3 mb-6 text-gray-800"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
          />

          {/* Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              mode="contained"
              onPress={handleEditProfile}
              className="flex-1 bg-blue-500 py-2 rounded-lg mr-2"
              labelStyle={{ color: 'white' }}
              >
                <Text>Save</Text>
              
            </TouchableOpacity>
            <TouchableOpacity
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              className="flex-1 border-red-500 py-2 rounded-lg"
              labelStyle={{ color: 'red' }}
              >
                                <Text>Cancel</Text>

              
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

      <View style={styles.menuWrapper}>
        <TouchableOpacity onPress={()=>{router.push('/customer/chat')}}>
          <View style={styles.menuItem}>
            <Icon name='account-check-outline' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Support</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <View style={styles.menuItem}>
            <Icon name='cog-outline' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.menuItem}>
            <Icon name='logout' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  userInfoSection: { paddingHorizontal: 30, marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold' },
  caption: { fontSize: 14, fontWeight: '500' },
  bio: { fontSize: 12, color: '#777777', marginTop: 5 },
  editBioText: { color: '#ff6347', marginTop: 5, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 10 },
  infoText: { color: "#777777", marginLeft: 20 },
});

export default ProfileScreen;
