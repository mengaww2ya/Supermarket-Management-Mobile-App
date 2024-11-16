import React, { useState, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, TextInput ,Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { colors, Icon ,SocialIcon} from 'react-native-elements';
import { ScrollView } from 'react-native-web';
import Swiper from 'react-native-swiper';
export default function Welcome(){
    const image1=require("../../assets/images/dicus.jpeg");
    const image2=require("../../assets/images/welImage.jpg");
    const image3=require("../../assets/images/welc.png");

    return(
<SafeAreaView>
    <View >
    <View style={{flex:1}}>
        <Text style={styles.welcomSlogan}>Start Your Smart Shopping Here:
        </Text>
<Text style={styles.welcomSlogan}>
             Discover Groceries at Your Fingertips
             Better Living

</Text>
<Text style={styles.welcomSlogan}>
             Anytime, Anywhere!
</Text>
    </View>

    <View style={{flex:3}}>
<Swiper autoplay={true}>
    <View>
        <Image 
        source={image1}
        />
    </View>

    <View style={styles.welcImagContainer}>  
        <Image
       source={image2}/>

     
        </View>
    <View>
        <Image
    
    source={image3}
    />

 
    </View>
    
</Swiper>
    </View>
    </View>
    <View style={{flex:3}}>
    <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} >
            <Text style={styles.buttonText}>create account</Text>
          </TouchableOpacity>
    </View>
</SafeAreaView>
    );
}

const styles=StyleSheet.create({
    welcomSlogan:{
        fontSize:20,
        color:'hsl(227, 86%, 55%)',
        textAlign:"center",
      
    },
    welcImagContainer:{
        alignContent:"center",
        margin:"3%",
    },
    button: {
        backgroundColor: 'hsl(23, 100%, 66%)',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,

      },
      buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
      },
})