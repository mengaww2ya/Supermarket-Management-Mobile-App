import React from 'react';
import { View, StyleSheet,SafeAreaView } from 'react-native';
import {
  Avatar,
  Title,
  Caption,
  Text,
  TouchableRipple,

} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.userInfoSection}>
        <View style={{flexDirection:'row',marginTop:15}}>
          <Avatar.Image
            source={{
              uri: 'https://imgs.search.brave.com/bmJ1LAEWM719WwIyOg_2jUoZ8-QsFekaeIr_eU5C0WI/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cGF3bGljeS5jb20v/X25leHQvaW1hZ2Uv/P3VybD1odHRwczov/L2ltYWdlcy5jdGZh/c3NldHMubmV0L3Vi/M2J3ZmQ1M213eS8z/ZTJxdkVlRFh3OEx5/ZVY2NjE2QlJuL2Uw/NWVjOTY3MTA0NmQw/ODJiYjE2MjNjODkz/NDgyYmU1L09yYW5n/ZV9jYXRfc2xlZXBp/bmcucG5nJnc9Mzg0/MCZxPTc1.jpeg',
            }}
            size={80}
          />
          <View style={{marginLeft:20}}>
            <Title style={[styles.title,{marginTop:15,marginBottom:5}]}>John D</Title>
            <Caption style={styles.caption}> johnny</Caption>
          </View>
        </View>
      </View>
      <View style={styles.userInfoSection}>
      <View style={styles.row}> 
        <Icon name="map-marker-radius" type="material-community"size={20}></Icon>
      <Text style={{color:"#777777",marginLeft:20}}>Guraghe Wolkite</Text>
      </View>
      <View style={styles.row}> 
        <Icon name="phone" type="material-community"size={20}></Icon>
      <Text style={{color:"#777777",marginLeft:20}}>+2519766543</Text>
      </View>
      <View style={styles.row}> 
        <Icon name="email" type="material-community"size={20}></Icon>
      <Text style={{color:"#777777",marginLeft:20}}>G@gmail.com</Text>
      </View>
      </View>

      <View style={styles.infoBoxWrapper}>
     <View style={[styles.infoBox,{borderRightColor:'#dddddd',borderRightWidth:1}]}>
        <Title>$150</Title>
        <Caption>wallet</Caption>
     </View>
     <View style={styles.infoBox}>
        <Title>12</Title>
        <Caption>orders</Caption>
     </View>
      </View>
      <View style={styles.menuWrapper}>
        <TouchableRipple>
            <View style={styles.menuItem}>
                <Icon name='heart-outline' type="material-community" color="#ff6347" size={25}></Icon>
           <Text style={styles.menuItemText}> Your favourites</Text>
            </View>
        </TouchableRipple>
        <TouchableRipple>
            <View style={styles.menuItem}>
                <Icon name='credit-card' type="material-community" color="#ff6347" size={25}></Icon>
           <Text style={styles.menuItemText}> Payment</Text>
            </View>
        </TouchableRipple>
        <TouchableRipple>
            <View style={styles.menuItem}>
                <Icon name='share-outline' type="material-community" color="#ff6347" size={25}></Icon>
           <Text style={styles.menuItemText}> Tell Your Friends</Text>
            </View>
        </TouchableRipple>
        <TouchableRipple>
            <View style={styles.menuItem}>
                <Icon name='account-check-outline' type="material-community" color="#ff6347" size={25}></Icon>
           <Text style={styles.menuItemText}> Support</Text>
            </View>
        </TouchableRipple>
        <TouchableRipple>
            <View style={styles.menuItem}>
                <Icon name='cog-outline' type="material-community" color="#ff6347" size={25}></Icon>
           <Text style={styles.menuItemText}> Settings</Text>
            </View>
        </TouchableRipple>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoSection: {
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoBoxWrapper: {
    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    borderTopColor: '#dddddd',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 100,
  },
  infoBox: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuWrapper: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  menuItemText: {
    color: '#777777',
    marginLeft: 20,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 26,
  },
});
