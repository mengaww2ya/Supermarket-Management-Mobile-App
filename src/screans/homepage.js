import React from "react";
import { Text,View , StyleSheet} from "react-native";
import Header from '../subscrean/header.js';
export default function Homepage({navigation}){
    return(
        <View style={{flex:1}}>
        <View>
        <Header title="sign in" type="arrow-left" navigation={navigation}/>
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
      
    },
  });