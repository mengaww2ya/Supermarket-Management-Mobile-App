import React , { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors } from "react-native-elements";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
} from "react-native";
export default function addProduct() {
  const [image, setImage] = useState(null);
  const selectImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  return (
    <SafeAreaView>
      <ScrollView
        style={{ flex: 1, paddingBottom: 20 }}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{margin:10,padding:10}}>
          <Text style={styles.titltxt}>fill product detail</Text>
          <View style={styles.container}>
            <TextInput style={styles.textInput} placeholder="Product Name" />
            <TextInput style={styles.textInput} placeholder="Product Id" />
            <TextInput
              style={styles.textInput}
              placeholder="Product Category"
            />
            <TextInput style={styles.textInput} placeholder="Product price" />
            <TextInput
              style={styles.textInput}
              placeholder="Product discount"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Product discription"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Product ingridients"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Product nutration"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Product package type"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Product suplier name"
            />
            <TextInput style={styles.textInput} placeholder="Product Origin" />
            <Pressable style={styles.btn} onPress={selectImage}>
              <Text style={styles.btntxt}>Uload image</Text>
              {image && <Image source={{ uri: image }} style={styles.image} />}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  btn: {
    backgroundColor: colors.grey4,
    borderColor: colors.grey2,
    borderWidth: 1,
    borderRadius: 5,
  },
  btntxt: {
    padding: 10,
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
  },
  textInput: {
    // width: screenwidth * 0.8,
    padding: 10,
    fontSize: 18,
    margin: 3,
    color: colors.grey4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  titltxt: {
    marginBottom: 10,
    padding: 10,
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
    backgroundColor: colors.grey5,
    fontWeight: "bold",
    fontVariant: ["small-caps"],
  },
  image: {
    width: 200,
    height: 200,
  },
});
