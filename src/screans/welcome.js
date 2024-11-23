import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet ,Image,ScrollView ,Dimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import { colors } from 'react-native-elements';
const screenwidth=Dimensions.get("window").width;
const screenheight=Dimensions.get("window").height;

export default function Welcome( {navigation}){
    const image1=require("../../assets/images/goodinbag.png");
    const image2=require("../../assets/images/welImage.jpg");
    const image3=require("../../assets/images/good5.png");
    const image4=require("../../assets/images/good2.png");
    const image5=require("../../assets/images/good3.png");
    const image6=require("../../assets/images/cartwithgoods.png");
    const image7=require("../../assets/images/goods.png");
    return(
<SafeAreaView style={styles.SafeAreaView}>
  <ScrollView 
  showsVerticalScrollIndicator={true}
  >
      <View style={styles.welcMessagView}>
        <Text style={styles.welcomSlogan}>Start Your Smart Shopping Here:</Text>
        <Text style={styles.welcomSlogan}>Discover Groceries at Your Fingertips Better Living</Text>
        <Text style={styles.welcomSlogan}>Anytime, Anywhere!</Text>
      </View>
      <View style={[styles.welcImagContainer]}>
        <Swiper autoplay={true}>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image1} style={{ width: "90%", height: "90%"}} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image2} style={{ width: "90%", height: "90%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image3} style={{  width: "90%", height: "90%"}} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image4} style={{ width: "90%", height: "90%"}} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image5} style={{width: "90%", height: "90%"}} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image6} style={{  width: "90%", height: "90%"}} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image7} style={{  width: "90%", height: "90%" }} />
          </View>
        </Swiper>
      </View>
    <View style={[styles.buttonContainer]}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Create Account</Text>
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
    justifyContent:"center",
    alignContent:"center",
    alignSelf:"center",
    backgroundColor:colors.grey3,
    width:screenwidth*0.6,
   height:screenheight*0.4,
    padding:5,
     },
    welcMessagView:{
      alignItems:"center",
      justifyContent:"center",
      margin:"1%",
     backgroundColor:"white",
     marginHorizontal:10,
     paddingVertical:5,
     width:screenwidth*0.8,
     
    },
    buttonContainer:{
      width:screenwidth*0.6,
      alignSelf:"center",
     alignContent:"center",
     alignItems:"center",
     // justifyContent:"center",

    },
    button: {
      alignSelf:"center",
      width:"100%",
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
      slidImageOnWelcView:{
       // alignSelf:"center",
       alignItems:"center",
      flex:1,
       marginHorizontal:10,

      },
})