import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Modal, TextInput, TouchableOpacity } from 'react-native';
import {
  Avatar,
  Title,
  Caption,
  Text,
  TouchableRipple,
  Button,
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const ProfileScreen = ({ navigation }) => {
  const [bio, setBio] = useState('Tech enthusiast and coffee lover. Always learning.');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newBio, setNewBio] = useState('');

  const handleEditBio = () => {
    setBio(newBio);
    setModalVisible(false);
  };

  // Set the header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.editButtonContainer}>
          <MaterialCommunityIcons.Button
            name="account-edit"
            size={25}
            backgroundColor="#FFDC2B"
            color="#000"
            onPress={() => navigation.navigate("EditProfileScreen")}
          />
        </View>
      ),
                // headerLeft: () => (
          //   <Icon.Button
          //     name="menu"
          //     type="ionicon"
          //     size={25}
          //     backgroundColor="#FFDC2B"
          //     color="#fff"
          //     onPress={() => navigation.navigate('EditProfileScreen')}
          //   />
          // ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.userInfoSection}>
        <View style={{ flexDirection: 'row', marginTop: 15 }}>
          <Avatar.Image
            source={{
              uri: 'https://imgs.search.brave.com/bmJ1LAEWM719WwIyOg_2jUoZ8-QsFekaeIr_eU5C0WI/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cGF3bGljeS5jb20v/X25leHQvaW1hZ2Uv/P3VybD1odHRwczov/L2ltYWdlcy5jdGZh/c3NldHMubmV0L3Vi/M2J3ZmQ1M213eS8z/ZTJxdkVlRFh3OEx5/ZVY2NjE2QlJuL2Uw/NWVjOTY3MTA0NmQw/ODJiYjE2MjNjODkz/NDgyYmU1L09yYW5n/ZV9jYXRfc2xlZXBp/bmcucG5nJnc9Mzg0/MCZxPTc1.jpeg',
            }}
            size={80}
          />
          <View style={{ marginLeft: 20 }}>
            <Title style={styles.title}>John D</Title>
            <Caption style={styles.caption}>@johnny</Caption>
            <Text style={styles.bio}>{bio}</Text>
            <TouchableOpacity onPress={() => {
              setNewBio(bio);
              setModalVisible(true);
            }}>
              <Text style={styles.editBioText}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.userInfoSection}>
        <View style={styles.row}>
          <Icon name="map-marker-radius" type="material-community" size={20} />
          <Text style={styles.infoText}>Guraghe Wolkite</Text>
        </View>
        <View style={styles.row}>
          <Icon name="phone" type="material-community" size={20} />
          <Text style={styles.infoText}>+2519766543</Text>
        </View>
        <View style={styles.row}>
          <Icon name="email" type="material-community" size={20} />
          <Text style={styles.infoText}>G@gmail.com</Text>
        </View>
      </View>

      <View style={styles.infoBoxWrapper}>
        <View style={[styles.infoBox, { borderRightColor: '#dddddd', borderRightWidth: 1 }]}>
          <Title>$150</Title>
          <Caption>Wallet</Caption>
        </View>
        <View style={styles.infoBox}>
          <Title>12</Title>
          <Caption>Orders</Caption>
        </View>
      </View>

      <View style={styles.menuWrapper}>
        <TouchableRipple>
          <View style={styles.menuItem}>
            <Icon name='heart-outline' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Your Favourites</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple>
          <View style={styles.menuItem}>
            <Icon name='credit-card' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Payment</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple>
          <View style={styles.menuItem}>
            <Icon name='share-outline' type="material-community" color="#ff6347" size={25} />
            <Text style={styles.menuItemText}>Tell Your Friends</Text>
          </View>
        </TouchableRipple>
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

      {/* Modal for Editing Bio */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Bio</Text>
            <TextInput
              value={newBio}
              onChangeText={setNewBio}
              placeholder="Enter your new bio"
              style={styles.modalTextInput}
              multiline
            />
            <Button mode="contained" onPress={handleEditBio}>
              Save
            </Button>
            <Button onPress={() => setModalVisible(false)} color="red">
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  infoBoxWrapper: {
    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    borderTopColor: '#dddddd',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 100,
  },
  infoBox: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
});