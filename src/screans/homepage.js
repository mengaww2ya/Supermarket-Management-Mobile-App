import React from "react";
import { Text,View , StyleSheet} from "react-native";
import HomeHeader from '../subscrean/home_page_header';
import Header from "../subscrean/header";
export default function Homepage({navigation}){
    return(
        <View style={{flex:1}}>
        <View>
        {/* <Header  type="arrow-left" navigation={navigation}/> */}
        <HomeHeader title="sign in" type="arrow-left" navigation={navigation}/>
      </View>
        <View style={[styles.container, {flex:1}]}>
            <Text>hello this is home page</Text>
        </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      alignItems: "center",
     justifyContent:"center",   
     backgroundColor:"gray", 
      
    },
  });