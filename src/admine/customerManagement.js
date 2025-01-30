import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";

export default function acustomerManagement() {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text>Customer Management</Text>
        <Pressable style={styles.btn}>
          <Text style={styles.btntxt}>add customer</Text>
        </Pressable>
        <Pressable style={styles.btn}>
          <Text style={styles.btntxt}>delet customer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: "space-evenly",
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 10,
    rowGap: 10,
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
});
