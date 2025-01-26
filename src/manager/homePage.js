import React from "react";
import {Text, View, Pressable, StyleSheet, FlatList, ScrollView, useWindowDimensions, Image} from "react-native";
import data from "../global/data";
import { ScreenWidth } from "react-native-elements/dist/helpers";
export default function ManagerHomePage(){
    return(
        <View style={styles.homecontainer}>
            <ScrollView 
            style={{flex:1, paddingBottom:20}} 
            showsVerticalScrollIndicator={true} 
            contentContainerStyle={{flexGrow:1}}>
                <View style={styles.homecard}>
                    <Text> employee management</Text>
                </View>
                <View style={styles.homecard}>
                    <Text> customer management</Text>
                </View>
                <View style={styles.homecard}>
                    <Text> product performance matrix</Text>
                </View>
                <View style={styles.homecard}>
                    <Text> management</Text>
                </View>
                <View style={styles.homecard}>
                    <Text> employee management</Text>
                </View>
                <View style={styles.homecard}>
                    <Text> employee management</Text>
                </View>
            </ScrollView>
        </View>
    );
}
const styles= StyleSheet.create({
    homecontainer:{
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap',


    },
    homecard:{
        width:ScreenWidth*0.4,
        height:ScreenWidth*0.2,
        backgroundColor:"whete",
    }
})