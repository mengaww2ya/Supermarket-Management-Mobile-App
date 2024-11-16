import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet ,Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors} from 'react-native-elements';
import {Header} from '../subscrean/header.js'
import { ScrollView } from 'react-native';
import Swiper from 'react-native-swiper';
import { Link, router } from 'expo-router';
export default function Welcome(){
    const image1=require("../../assets/images/goodinbag.png");
    const image2=require("../../assets/images/welImage.jpg");
    const image3=require("../../assets/images/good5.png");
    const image4=require("../../assets/images/good2.png");
    const image5=require("../../assets/images/good3.png");
    const image6=require("../../assets/images/cartwithgoods.png");
    const image7=require("../../assets/images/goods.png");


    return(
<SafeAreaView style={[styles.SafeAreaView,{flex:"100%"}]}>
    {/* <View><Header/>
    </View> */}
    <ScrollView>
    <View >
    <View style={[styles.welcMessagView,{flex:"10%"}]}>
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

     <View style={[styles.welcImagContainer,{flex:"20%"}]}>
     <Swiper autoplay={true}>
     <View     style={styles.slidImageOnWelcView}>
        <Image 
        source={image1}
        style={{width:"100%", height:"100%"}}

        />
    </View>

    <View     style={styles.slidImageOnWelcView}>  
        <Image
       source={image2}
       style={{width:"100%", height:"100%"}}

       />

     
        </View>
    <View    style={styles.slidImageOnWelcView}>
        <Image
    
    source={image3}
    style={{width:"100%", height:"100%"}}

    />
    
    </View>
    <View   style={styles.slidImageOnWelcView}>
        <Image 
        source={image4}
        style={{width:"100%", height:"100%"}}

        />
    </View>

    <View   style={styles.slidImageOnWelcView}>  
        <Image
       source={image5}
       style={{width:"100%", height:"100%"}}

       />

     
        </View>
        <View  style={styles.slidImageOnWelcView}>
        <Image 
        source={image6}
        style={{width:"100%", height:"100%"}}

        />
    </View>

    <View style={styles.slidImageOnWelcView} >  
        <Image
       source={image7}
       style={{width:"100%", height:"100%"}}

       />

     
        </View>
    
</Swiper>
    </View>
    </View>
    <View style={[styles.buttonContainer,{flex:"10%"}] }>
    
   {/* <Link href={"src/screans/login.js"}> */}
    <TouchableOpacity style={styles.button} onPress={()=>{router.push("../src/screans/login.js")}}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          {/* </Link> */}
          <TouchableOpacity style={styles.button} >
            <Text style={styles.buttonText}>create account</Text>
          </TouchableOpacity>
    </View>
    </ScrollView>
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
    welcMessagView:{
        justifyContent:"flex-start",
        alignItems:"center",
     backgroundColor:"wheet",
     marginHorizontal:"10%",
     marginVertical:"10%",


    },
    buttonContainer:{
        alignContent:"center",

    },
    button: {
        backgroundColor: 'hsl(23, 100%, 66%)',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
        marginHorizontal:"10%",

      },
      buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
      },
      slidImageOnWelc:{
      width:"100%",
      height:"100%",
      },
      slidImageOnWelcView:{
      flex:1,
      justifyContent:"center",
      alignItems:"center",
      },
      SafeAreaView:{
    //     display:"flex",
    // flexDirection:"column",
      }
})