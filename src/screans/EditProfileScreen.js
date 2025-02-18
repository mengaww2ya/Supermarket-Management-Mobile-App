import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { Button } from 'react-native-paper';

const EditProfileScreen = () => {
    const { colors } = useTheme();
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        // Add your submission logic here
        setFeedback('Profile updated successfully!');
    };

    return (
      <View style={styles.container}>
        <View style={{ margin: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {}}>
              <View style={styles.avatarContainer}>
                <ImageBackground
                  source={{ uri: 'https://imgs.search.brave.com/bmJ1LAEWM719WwIyOg_2jUoZ8-QsFekaeIr_eU5C0WI/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cGF3bGljeS5jb20v/X25leHQvaW1hZ2Uv/P3VybD1odHRwczov/L2ltYWdlcy5jdGZh/c3NldHMubmV0L3Vi/M2J3ZmQ1M213eS8z/ZTJxdkVlRFh3OEx5/ZVY2NjE2QlJuL2Uw/NWVjOTY3MTA0NmQw/ODJiYjE2MjNjODkz/NDgyYmU1L09yYW5n/ZV9jYXRfc2xlZXBp/bmcucG5nJnc9Mzg0/MCZxPTc1.jpeg' }}
                  style={styles.avatarBackground}
                  imageStyle={styles.avatarImage}
                >
                  <View style={styles.cameraIconContainer}>
                    <Icon name='camera' size={35} color="#fff" style={styles.cameraIcon} />
                  </View>
                </ImageBackground>
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>John Doe</Text>
          </View>

          <View style={styles.action}>
            <FontAwesome name='user-o' color={colors.text} size={20} />
            <TextInput 
              placeholder="First Name"
              placeholderTextColor="#676767"
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.action}>
            <FontAwesome name='user-o' color={colors.text} size={20} />
            <TextInput 
              placeholder="Last Name"
              placeholderTextColor="#676767"
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.action}>
            <Feather name='phone' color={colors.text} size={20} />
            <TextInput 
              placeholder="Phone"
              placeholderTextColor="#676767"
              keyboardType='number-pad'
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.action}>
            <FontAwesome name='envelope-o' color={colors.text} size={20} />
            <TextInput 
              placeholder="Email"
              placeholderTextColor="#676767"
              keyboardType='email-address'
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.action}>
            <FontAwesome name='globe' color={colors.text} size={20} />
            <TextInput 
              placeholder="Address"
              placeholderTextColor="#676767"
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.action}>
            <FontAwesome name='lock' color={colors.text} size={20} />
            <TextInput 
              placeholder="Change Password"
              placeholderTextColor="#676767"
              secureTextEntry
              autoCorrect={false}
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          <TouchableOpacity style={styles.commandButton} onPress={handleSubmit}>
            <Text style={styles.panelButtonTitle}>Submit</Text>
          </TouchableOpacity>

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
        </View>
      </View>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    avatarContainer: {
      height: 100,
      width: 100,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarBackground: {
      height: 100,
      width: 100,
    },
    avatarImage: {
      borderRadius: 15,
    },
    cameraIconContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraIcon: {
      opacity: 0.7,
      borderWidth: 1,
      borderColor: '#fff',
      borderRadius: 10,
    },
    userName: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: 'bold',
    },
    action: {
      flexDirection: 'row',
      marginTop: 10,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f2f2f2',
      paddingBottom: 5,
    },
    textInput: {
      flex: 1,
      paddingLeft: 10,
      color: '#05375a',
    },
    commandButton: {
      padding: 15,
      borderRadius: 10,
      backgroundColor: '#FFDC2B',
      alignItems: 'center',
      marginTop: 10,
    },
    panelButtonTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: 'white',
    },
    feedbackText: {
      marginTop: 10,
      color: 'green',
      fontWeight: 'bold',
      textAlign: 'center',
    },
});