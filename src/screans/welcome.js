import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet ,Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import Swiper from 'react-native-swiper';
export default function Welcome( {navigation}){
    const image1=require("../../assets/images/goodinbag.png");
    const image2=require("../../assets/images/welImage.jpg");
    const image3=require("../../assets/images/good5.png");
    const image4=require("../../assets/images/good2.png");
    const image5=require("../../assets/images/good3.png");
    const image6=require("../../assets/images/cartwithgoods.png");
    const image7=require("../../assets/images/goods.png");
    return(
<SafeAreaView style={[styles.SafeAreaView, { flex: 1 }]}>
  <ScrollView>
      <View style={[styles.welcMessagView, { flex: 3 }]}>
        <Text style={styles.welcomSlogan}>Start Your Smart Shopping Here:</Text>
        <Text style={styles.welcomSlogan}>Discover Groceries at Your Fingertips Better Living</Text>
        <Text style={styles.welcomSlogan}>Anytime, Anywhere!</Text>
      </View>
      <View style={[styles.welcImagContainer, { flex: 4 }]}>
        <Swiper autoplay={true}>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image1} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image2} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image3} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image4} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image5} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image6} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={styles.slidImageOnWelcView}>
            <Image source={image7} style={{ width: "100%", height: "100%" }} />
          </View>
        </Swiper>
      </View>
    <View style={[styles.buttonContainer, { flex: 4 }]}>
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
    margin:"3%",
     },
    welcMessagView:{
      alignItems:"center",
        justifyContent:"flex-start",
     backgroundColor:"wheet",
     marginHorizontal:"3%",
     padding:"3%",
    },
    buttonContainer:{
      marginBottom:20,
      justifyContent:"flex-end",
      marginHorizontal:"3%",

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
      marginHorizontal:"3%",

      },
})