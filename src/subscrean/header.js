import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
export default function Header({title, type,navigation }) {
  return (
    <View style={styles.header}>
      <Icon
        type="material-community"
        name="arrow-left"
        color="white"
        onPress={() => {navigation.goBack()}} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "hsl(227, 86%, 55%)",
    padding: 10,
  },
});
