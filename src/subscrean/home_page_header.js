import React, { useState } from "react";
import { View, StyleSheet ,Button,Text,Modal,Dimensions} from 'react-native';
import { colors, Icon,withBadge } from 'react-native-elements';
const screenwidth=Dimensions.get("window").width;
const screenheight=Dimensions.get("window").height;
export default function HomeHeader({title, type,navigation }) {
  const[ismodalVisible,setmodalVisible]=useState(false);
const BadgeIcon=withBadge(0)(Icon)
const closeicon=<Icon
    name="close"              
    type="font-awesome"      
    color="#517fa4"          
    size={30}               
    
  />
  return (
    <View style={styles.header}>
        {
        /* <View style={{justifyContent:"flex-end"}}>
      <Icon
        type="material-community"
        name="arrow-left"
        color="white"
        onPress={() => {navigation.goBack()}} 
      />
      </View> */}
        <View style={styles.menuIconViw}>
      <Icon
        type="material-community"
        name="menu"
        color="white"
        onPress={() => {setmodalVisible(true)}} 
        size={32}
      />
     
    </View>
     <View style={{alignItems:"center",justifyContent:"center",flexDirection:"row"}}>
        <Text style={styles.titleText}>
            Queen Spermarket
        </Text>
      </View>
      <View style={{alignItems:"center",justifyContent:"center",marginRight:15}}>
      <BadgeIcon
        type="material-community"
        name="cart"
        color="white"
        // onPress={() => {navigation.menu()}} 
        size={32}
      />
     
    </View>
    <Modal visible={ismodalVisible}
    onRequestClose={()=>{setmodalVisible(false)}}
    >

    <Button
    
    title={closeicon}
    onPress={() => {setmodalVisible(false)}}
    />
  <View style={{backgroundColor:colors.grey4,flex:1,padding:60}}>
    <Text style={styles.modaltext}>This is sample menu</Text>
    <Text>Content of menu will be writen here   </Text>
  </View>
   </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "hsl(27, 88%, 58%)",
    height:screenheight*0.05,
    justifyContent:"space-between",
    
  },
  menuIconViw:{
    alignContent:"center",
    justifyContent:"center",
    marginLeft:15,
  },
  titleText:{
    fontSize:25,
    fontWeight:"bold",
    textAlign:"center",
    marginLeft:50,
    color:"white",

  },
  modaltext:{
    fontSize:25,
    fontWeight:"bold",
    textAlign:"center",
    color:colors.grey0,

  }
});
