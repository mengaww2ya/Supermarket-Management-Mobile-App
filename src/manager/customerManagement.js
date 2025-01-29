import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "react-native-elements";
import { ScreenHeight, ScreenWidth } from "react-native-elements/dist/helpers";

export default function customerManagement() {
  return (
    <SafeAreaView>
      <ScrollView>
        <Text style={styles.textTitle}>Customer management</Text>

        <View style={styles.container}>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>customer list</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>customer Feedback</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>customer Loyalty Program</Text>
          </Pressable>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>customer Reports and Insights</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },
  textTitle: {
    backgroundColor: colors.grey3,
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign:"center",
    padding: 10,
    margin: 10,
  },
  btn: {
    margin:10,
    padding:10,
    width: ScreenWidth * 0.3,
    height: ScreenHeight * 0.2,
    borderColor: colors.grey3,
    borderWidth: 1,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 20,
  },
});
