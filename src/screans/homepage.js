import React,{useState} from "react";
import { Text,View , StyleSheet,TouchableOpacity, ScrollView} from "react-native";
import HomeHeader from '../subscrean/home_page_header';
import Header from "../subscrean/header";
import { colors,Icon } from "react-native-elements";
export default function Homepage({navigation}){
  const [Delivery,setDelivery]=useState(false);
    return(
    <View style={{flex:1}}>
        <View>
        {/* <Header  type="arrow-left" navigation={navigation}/> */}
         <HomeHeader title="sign in" type="arrow-left" navigation={navigation}/>
         </View>
      <ScrollView
      showsVerticalScrollIndicator={true}
      stickyHeaderIndices={[0]}
      >
         <View style={[styles.container]}>
          <TouchableOpacity 
          onPress={()=>{
            setDelivery(true)
          }}
          >
            <View style={{...styles.deliveryButon,backgroundColor:Delivery? "hsl(27, 88%, 58%)":colors.grey5}}>
              <Text style={styles.deliveryText}>
                Delivery
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
          onPress={()=>{
            setDelivery(false)
          }}>
            <View style={{...styles.setDeliveryButon,backgroundColor:Delivery?colors.grey5 :"hsl(27, 88%, 58%)"}}>
              <Text style={styles.deliveryText}>
               pick up
              </Text>
            </View>
          </TouchableOpacity>
               
          </View>
        <View style={styles.filterWholContainer}>

        <View style={styles.mepTimeContainer}>
       <View style={[{flexDirection:"row" ,padding:5}]}>
       <Icon
        type="material-community"
        name="map-marker"
        color="hsl(0, 71%, 58%)"
        // onPress={() => {navigation.menu()}} 
        size={32}
      />
     <Text>gurd shola</Text>
     </View>
     <View style={styles.timeIconCntainer}>
     <Icon
        type="material-community"
        name="clock-time-four"
        color={colors.grey3}
        // onPress={() => {navigation.menu()}} 
        size={32}
      />
     <Text style={{paddingRight:5}}>now</Text>
    </View>
    </View>
    <View style={styles.filterView}>
    <Icon
        type="material-community"
        name="tune"
        color={colors.grey2}
        // onPress={() => {navigation.menu()}} 
        size={32}
      />
    </View>

    </View>
          </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      // flex:1,
      alignItems: "center",
     justifyContent:"space-evenly",   
     flexDirection:"row"
      
    },
    deliveryButon:{
      paddingHorizontal:20,
      borderRadius:15,
      paddingVertical:15,
      marginVertical:20,

    },
    setDeliveryButon:{
      paddingHorizontal:20,
      borderRadius:15,
      paddingVertical:15,
      marginVertical:20,
    },
    deliveryText:{
      marginLeft:15,
      fontSize:16,
      color:"black",
    },
   filterWholContainer :{
    flexDirection:"row" ,
    paddingLeft:10,
    justifyContent:"space-evenly",
    alignItems:"center",
  },
  mepTimeContainer:{
    flexDirection:"row" ,
    borderRadius:15,
    backgroundColor:colors.grey5,
    paddingVertical:5,
    paddingHorizontal:20,

    justifyContent:"space-evenly",
  },
  timeIconCntainer:{
    flexDirection:"row",
    alignItems:"center",
    paddingHorizontal:5,
  backgroundColor:"white",
  marginHorizontal:20,
  borderRadius:15,
},
filterView:{
  alignItems:"center",
 marginRight:5,
}
  });