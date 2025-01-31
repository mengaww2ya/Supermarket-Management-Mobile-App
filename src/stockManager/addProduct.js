import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { TextInput } from "react-native-web";

export default function addProduct(){
    return (
      <SafeAreaView>
        <ScrollView>
          <View>
            <Text>fill product detail</Text>
            <View>
              <TextInput placeholder="Product Name" />
              <TextInput placeholder="Product image" />
              <TextInput placeholder="Product Id" />
              <TextInput placeholder="Product Category" />
              <TextInput placeholder="Product price" />
              <TextInput placeholder="Product discount" />
              <TextInput placeholder="Product discription" />
              <TextInput placeholder="Product ingridients" />
              <TextInput placeholder="Product nutration" />
              <TextInput placeholder="Product package type" />
              <TextInput placeholder="Product suplier name" />
              <TextInput placeholder="Product Origin" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
}