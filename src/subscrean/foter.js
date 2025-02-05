import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Image,
  useWindowDimensions,
} from "react-native";
import { colors, Icon } from "react-native-elements";
const screenwidth = useWindowDimensions().width;
const screenheight = useWindowDimensions().height;
export default function Footer({ navigation }) {
  const [viewProfile, setviewProfile] = useState(false);
  const [viewFvorite, setviewFvorte]=useState(false)
   
  return (
    <View style={styles.footerContainer}>
      {/* Home */}
      <Icon
        name="home"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => navigation.navigate("Homepage")}
      />

      {/* Categories */}
      <Icon
        name="th-list"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          alert("Hey! this button is not functional right now.", "ok");
        }}
      />

      {/* Orders */}
      <Icon
        name="list-alt"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          // navigation.navigate("Orders")
          alert("Hey! this button is not functional right now.", "ok");
        }}
      />

      {/* Favorites (New) */}
      <Icon
        name="heart"
        type="font-awesome"
        color="red"
        size={30}
        onPress={() => {
          // navigation.navigate("Favorites");
          setviewFvorte(true)
        }}
      />

      {/* Profile */}
      <Icon
        name="user"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          // navigation.navigate("Profile");
          setviewProfile(true);
        }}
      />
      <Modal
        visible={viewProfile}
        onRequestClose={() => {
          setviewProfile(false);
        }}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalview}>
          <Text style={styles.titltxt}>Profile setting</Text>
          <View style={styles.container}>
            <Image />
            <TouchableOpacity
              onPress={() => {
                setviewProfile(false);
              }}
              style={styles.modalclosbtn}
            >
              <Text style={styles.btntxt}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={viewFvorite}
        onRequestClose={() => {
          setviewFvorte(false);
        }}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalview}>
          <Text style={styles.titltxt}>All favorite products</Text>
          <View style={styles.container}>
            <Image />
            <TouchableOpacity
              onPress={() => {
                setviewFvorte(false);
              }}
              style={styles.modalclosbtn}
            >
              <Text style={styles.btntxt}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "hsl(47, 93%, 54%)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  modalview: {
    backgroundColor: "white",
  },
  container:{
  },
  titltxt: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalclosbtn: {
    backgroundColor: colors.grey4,
    alignContent: "center",
    borderRadius: 5,
    borderWidth: 1,
    width: screenwidth * 0.3,
    alignSelf: "center",
  },
  btntxt: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
