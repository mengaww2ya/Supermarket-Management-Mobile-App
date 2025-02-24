import React, { useState, useLayoutEffect } from "react";
import { View, SafeAreaView, Modal, TextInput, TouchableOpacity } from "react-native";
import { Avatar, Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Icon } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const ProfileScreen = () => {
  const [bio, setBio] = useState("Tech enthusiast and coffee lover. Always learning.");
  const [isModalVisible, setModalVisible] = useState(false);
  const [newBio, setNewBio] = useState("");
  const router = useRouter();

  useLayoutEffect(() => {
    router.setOptions({
      headerRight: () => (
        <TouchableOpacity className="mr-4" onPress={() => router.push("/screens/EditProfileScreen")}> 
          <MaterialCommunityIcons name="account-edit" size={25} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [router]);

  const handleEditBio = () => {
    setBio(newBio);
    setModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <View className="items-center py-6">
        <Avatar.Image
          source={{ uri: "https://example.com/avatar.jpg" }}
          size={80}
        />
        <Text className="text-xl font-bold mt-2">John D</Text>
        <Text className="text-gray-500">@johnny</Text>
        <Text className="text-gray-600 mt-2 text-center">{bio}</Text>
        <TouchableOpacity onPress={() => { setNewBio(bio); setModalVisible(true); }}>
          <Text className="text-blue-500 font-bold mt-2">Edit Bio</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 space-y-2">
        <View className="flex-row items-center space-x-2">
          <Icon name="map-marker-radius" type="material-community" size={20} />
          <Text className="text-gray-700">Guraghe Wolkite</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <Icon name="phone" type="material-community" size={20} />
          <Text className="text-gray-700">+2519766543</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <Icon name="email" type="material-community" size={20} />
          <Text className="text-gray-700">G@gmail.com</Text>
        </View>
      </View>

      <View className="flex-row justify-around border-t border-b py-4 mt-4">
        <View className="items-center">
          <Text className="text-lg font-bold">$150</Text>
          <Text className="text-gray-500">Wallet</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold">12</Text>
          <Text className="text-gray-500">Orders</Text>
        </View>
      </View>

      <View className="mt-4 space-y-3">
        {[
          { icon: "heart-outline", text: "Your Favourites" },
          { icon: "credit-card", text: "Payment" },
          { icon: "share-outline", text: "Tell Your Friends" },
          { icon: "account-check-outline", text: "Support" },
          { icon: "cog-outline", text: "Settings" },
          { icon: "logout", text: "Logout" },
        ].map((item, index) => (
          <TouchableOpacity key={index} className="flex-row items-center p-3 border-b">
            <Icon name={item.icon} type="material-community" color="#ff6347" size={25} />
            <Text className="ml-4 text-gray-700 font-semibold text-lg">{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal for Editing Bio */}
      <Modal transparent visible={isModalVisible} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-4/5 bg-white p-6 rounded-lg">
            <Text className="text-lg font-bold">Edit Bio</Text>
            <TextInput
              value={newBio}
              onChangeText={setNewBio}
              placeholder="Enter your new bio"
              className="border rounded p-2 mt-2"
              multiline
            />
            <View className="flex-row justify-between mt-4">
              <Button mode="contained" onPress={handleEditBio}>Save</Button>
              <Button onPress={() => setModalVisible(false)} color="red">Cancel</Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
