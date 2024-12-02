import React from 'react';
import { View, StyleSheet ,Text, Dimensions} from 'react-native';
import { Icon,withBadge } from 'react-native-elements';
const screenwidth=Dimensions.get("window").width;
const screenheight=Dimensions.get("window").height;
export default function HomeHeader({title, type,navigation }) {
const BadgeIcon=withBadge(0)(Icon)
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
        onPress={() => {navigation.menu()}} 
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

  }
});
