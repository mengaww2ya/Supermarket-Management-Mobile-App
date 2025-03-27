import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

const EditProfileScreen = () => {
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        setFeedback('Profile updated successfully!');
    };

    return (
        <View className="flex-1 bg-gray-100 p-5">
            <View className="items-center">
                <TouchableOpacity onPress={() => {}}>
                    <View className="h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-300">
                        <ImageBackground
                            source={{ uri: 'https://imgs.search.brave.com/bmJ1LAEWM719WwIyOg_2jUoZ8-QsFekaeIr_eU5C0WI/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly93d3cucGF3bGljeS5jb20vX25leHQvaW1hZ2UvP3VybD1odHRwczovL2ltYWdlcy5jdGZhc3NldHMubmV0L3ViM2J3ZmQ1M213eS8zZTJxdkVlRFh3OEx5ZVY2NjE2QlJuL2UwNWVjOTY3MTA0NmQwODJiYjE2MjNjODkzNDgyYmU1L09yYW5nZV9jYXRfc2xlZXBpbmcucG5nJnc9Mzg0MCZxPTc1.jpeg' }}
                            className="h-full w-full"
                        >
                            <View className="flex-1 justify-center items-center bg-black/40">
                                <Icon name='camera' size={30} color="#fff" className="opacity-80" />
                            </View>
                        </ImageBackground>
                    </View>
                </TouchableOpacity>
                <Text className="mt-3 text-lg font-bold">John Doe</Text>
            </View>

            {['First Name', 'Last Name', 'Phone', 'Email', 'Address', 'Change Password'].map((placeholder, index) => (
                <View key={index} className="flex-row items-center border-b border-gray-300 py-2 my-2">
                    {placeholder === 'Phone' ? (
                        <Feather name='phone' size={20} className="text-gray-600 mr-3" />
                    ) : placeholder === 'Email' ? (
                        <FontAwesome name='envelope-o' size={20} className="text-gray-600 mr-3" />
                    ) : placeholder === 'Address' ? (
                        <FontAwesome name='globe' size={20} className="text-gray-600 mr-3" />
                    ) : placeholder === 'Change Password' ? (
                        <FontAwesome name='lock' size={20} className="text-gray-600 mr-3" />
                    ) : (
                        <FontAwesome name='user-o' size={20} className="text-gray-600 mr-3" />
                    )}
                    <TextInput 
                        placeholder={placeholder}
                        placeholderTextColor="#676767"
                        className="flex-1 text-base text-gray-800"
                        secureTextEntry={placeholder === 'Change Password'}
                    />
                </View>
            ))}

            <TouchableOpacity onPress={handleSubmit} className="bg-yellow-400 py-3 rounded-lg items-center mt-5 active:opacity-80">
                <Text className="text-lg font-semibold text-white">Submit</Text>
            </TouchableOpacity>

            {feedback ? <Text className="mt-4 text-green-600 font-bold text-center">{feedback}</Text> : null}
        </View>
    );
};

export default EditProfileScreen;
