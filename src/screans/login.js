import React ,{useState,useRef} from 'react';
import { TouchableOpacity } from 'react-native';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from'react-native-animatable';
import { colors, Icon } from 'react-native-elements';
import  Header from '../subscrean/header.js';
export default function Login() {
  const [textInput2focused,settextInput2focused]=useState(false)
  const textInput1=useRef(1)
  const textInput2=useRef(2)
  return (
    <SafeAreaView style={styles.safeContainer}>

      <Header/>
      <View style={styles.container}>
        <Text style={styles.wlcome}>Welcome to Queen Supermarket System</Text>

        <View style={styles.login}>
          <TextInput
           style={styles.textInput1}
            placeholder="Enter your username here" 
            ref={textInput1}
            />
          <View style={styles.textInput2}>
            <Animatable.View animation={textInput2focused?"":"fadeInLeft"}  direction={400}>
             <Icon
             name='lock'
             iconStyle={colors.grey3}
             type='material'
             style={{marginRight:10}}
             />
            </Animatable.View>
          <TextInput  
          placeholder="Enter your password here" 
          secureTextEntry
          style={{width:"80%",padding:10}}
          ref={textInput2}
          onFocus={()=>{settextInput2focused(false)}}
          onBlur={()=>{settextInput2focused(true)}}
           />

          <Animatable.View animation={textInput2focused?"":"fadeInLeft"} direction='400'>
          <Icon
             name='visibility-off'
             iconStyle={colors.grey3}
             type='material'
             style={{marginLeft:10}}
             />
          </Animatable.View >

          </View>
          <View >
            <TouchableOpacity  style={[styles.button]} onPress={() => {}} >
              <Text>Log in</Text>
              </TouchableOpacity>
          </View>
          <Text style={styles.text}>
            You don't have an account?
            <TouchableOpacity style={styles.button}  onPress={() => {}} >
              <Text>Sign Up</Text>
              </TouchableOpacity>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    button:{
      width:300,
      padding:10,
      alignItems:"center",
        backgroundColor: 'hsl(23, 100%, 66%)',
      },
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
    marginVertical: 10,
  },
  textInput1: {
    fontSize: 20,
    borderRadius: 5,
    borderWidth:1,
    marginBottom: 10,
    padding: 10,
  },
  textInput2: {
    fontSize: 20,
    borderRadius: 5,
    borderWidth:1,
    marginBottom: 10,
    flexDirection:'row',
  },
  login: {
    width: "70%",
  },

  buttonContainer: {
    width: "50%",
    alignItems:"center",
    borderRadius:"2%",
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'hsl(23, 100%, 66%)',
  },
  wlcome:{
    fontSize:22,
  }
});
