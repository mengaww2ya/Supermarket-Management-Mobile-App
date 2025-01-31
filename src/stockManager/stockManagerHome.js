import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";
const ScreenWidth=useWindowDimensions().width;
const ScreenHeight=useWindowDimensions().height;
export default function stockManagerHome({navigation}){
    return (
      <SafeAreaView>
        <ScrollView>
          <View style={styles.container}>
            <Text style={styles.titltxt}>Welcome to Stock Management</Text>
            <Pressable
              style={styles.btn}
              onPress={() => {navigation.navigate("manageStock")}}
            >
              <Text style={styles.btntxt}>Stock Management</Text>
            </Pressable>
            <Pressable style={styles.btn}>
              <Text style={styles.btntxt}>Review Stock Status</Text>
            </Pressable>
            <Pressable style={styles.btn}>
              <Text style={styles.btntxt}>Suplier Order Management</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
    justifyContent: "space-evenly",
  },
  titltxt: {
    marginBottom: 10,
    padding: 10,
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
    backgroundColor: colors.grey5,
    fontWeight: "bold",
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
});