import React from 'react';
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
import { Platform } from 'react-native';
import { Button } from 'react-native-paper'
const EditProfileScreen =() => {
    const {colors}=useTheme();
        return (
          <View style={styles.container}>
            <View style={{ margin: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => {}}>
                  <View
                    style={{
                      height: 100,
                      width: 100,
                      borderRadius: 15,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <ImageBackground
                      source={{
                        uri: 'https://imgs.search.brave.com/bmJ1LAEWM719WwIyOg_2jUoZ8-QsFekaeIr_eU5C0WI/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cGF3bGljeS5jb20v/X25leHQvaW1hZ2Uv/P3VybD1odHRwczov/L2ltYWdlcy5jdGZh/c3NldHMubmV0L3Vi/M2J3ZmQ1M213eS8z/ZTJxdkVlRFh3OEx5/ZVY2NjE2QlJuL2Uw/NWVjOTY3MTA0NmQw/ODJiYjE2MjNjODkz/NDgyYmU1L09yYW5n/ZV9jYXRfc2xlZXBp/bmcucG5nJnc9Mzg0/MCZxPTc1.jpeg',
                    }}
                      style={{ height: 100, width: 100 }}
                      imageStyle={{ borderRadius: 15 }}
                    >
                        <View style={{                      flex:1,
                                                            alignItems:'center',
                                                            justifyContent:'center',
                        }}>
                            <Icon name='camera' size={35} color="#fff" style={{
                                opacity:0.7,
                                alignItems:'center',
                                justifyContent:'center',
                                borderWidth:1,
                                borderColor:'#fff',
                                borderRadius:10,
                            }}/>
                        </View>
                    </ImageBackground>
                  </View>
                </TouchableOpacity>
                <Text style={{marginTop:10,fontSize:18,fontWeight:'bold'}}>John Doe</Text>
              </View>
<View style={styles.action}>
    <FontAwesome name='user-o' color={colors.text} size={20}/>
    <TextInput 
    placeholder="First Name"
    placeholderTextColor="#676767"
    autoCorrect={false}
    style={[styles.textInput,{
color:colors.text
    }]}
    />
</View>

<View style={styles.action}>
    <FontAwesome name='user-o' color={colors.text} size={20}/>
    <TextInput 
    placeholder="Last Name"
    placeholderTextColor="#676767"
    autoCorrect={false}
    style={[styles.textInput,{
color:colors.text
    }]}
    />
</View>

<View style={styles.action}>
    <Feather name='phone' color={colors.text} size={20}/>
    <TextInput 
    placeholder="phone"
    placeholderTextColor="#676767"
    keyboardType='number-pad'
    autoCorrect={false}
    style={[styles.textInput,{
color:colors.text
    }]}
    />
</View>
<View style={styles.action}>
    <FontAwesome name='envelope-o' color={colors.text} size={20}/>
    <TextInput 
    placeholder="email"
    placeholderTextColor="#676767"
    keyboardType='email-address'
    autoCorrect={false}
    style={[styles.textInput,{
color:colors.text
    }]}
    />
</View>
<View style={styles.action}>
    <FontAwesome name='globe' color={colors.text} size={20}/>
    <TextInput 
    placeholder="address"
    placeholderTextColor="#676767"
    autoCorrect={false}
    style={[styles.textInput,{
color:colors.text
    }]}
    />
</View>
<TouchableOpacity style={styles.commandButton} onPress={()=>{}}>
    <Text style={styles.panelButtonTitle}>Submit</Text>
</TouchableOpacity>
            </View>
          </View>
        );
      };
      
export default EditProfileScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  
    commandButton: {
      padding: 15,
      borderRadius: 10,
      backgroundColor: '#FFDC2B',
      alignItems: 'center',
      marginTop: 10,
    },
  
    panel: {
      padding: 20,
      backgroundColor: '#FFFFFF',
      paddingTop: 20,
      // borderTopLeftRadius: 20,
      // borderTopRightRadius: 20,
      // shadowColor: '#000000',
      // shadowOffset: { width: 0, height: 0 },
      // shadowRadius: 5,
      // shadowOpacity: 0.4,
    },
  
    header: {
      backgroundColor: '#FFFE',
      shadowColor: '#333333',
      shadowOffset: { width: 1, height: -3 },
      shadowRadius: 2,
      shadowOpacity: 0.4,
      // elevation: 5,
      paddingTop: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
  
    panelHeader: {
      alignItems: 'center',
    },
  
    panelHandle: {
      width: 40,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#00000048',
      marginBottom: 18,
    },
  
    panelTitle: {
      fontSize: 27,
      height: 35,
    },
  
    panelSubtitle: {
      fontSize: 14,
      color: 'gray',
      height: 30,
      marginBottom: 10,
    },
  
    panelButton: {
      padding: 13,
      borderRadius: 10,
      backgroundColor: '#FF6347',
      alignItems: 'center',
      marginVertical: 7,
    },
  
    panelButtonTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: 'white',
    },
  
    action: {
      flexDirection: 'row',
      marginTop: 10,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f2f2f2',
      paddingBottom: 5,
    },
  
    actionError: {
      flexDirection: 'row',
      marginTop: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#FF0000',
      paddingBottom: 5,
    },
  
    textInput: {
      flex: 1,
      marginTop: Platform.OS === 'ios' ? 70 : -12,
      paddingLeft: 10,
      color: '#05375a',
    },
  });
  