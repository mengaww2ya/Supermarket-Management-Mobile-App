import {
  ScrollView,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";
const ScreenWidth = useWindowDimensions().width;
const ScreenHeight = useWindowDimensions().height;
export default function manageStock({ navigation }) {
  return (
    <SafeAreaView>
      <ScrollView
        style={{ paddingBottom: 20 }}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text style={styles.titltxt}>Welcome </Text>
        <View style={styles.container}>
          <Pressable style={styles.btn}>
            <Text
              style={styles.btntxt}
              onPress={()=>navigation.navigate("addProduct")}
            >
              Add product
            </Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>remove product</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>update product</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>view product list</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>Add new catagories</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>update catagories</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>remove catagories</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btntxt}>view catagories list</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    justifyContent: "space-evenly",
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },
  btn: {
    backgroundColor: colors.grey5,
    width: ScreenWidth * 0.3,
    height: ScreenHeight * 0.2,
    justifyContent: "center",
    borderColor: colors.grey4,
    borderWidth: 1,
    borderRadius: 5,
    bordershadowColor: colors.grey0,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  btntxt: {
    padding: 10,
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
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
});
