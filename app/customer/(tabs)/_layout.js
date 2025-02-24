import { Tabs } from "expo-router";

export default function Layout(){
    return(
        <Tabs screenOptions={{headerShown:false}}>
            <Tabs.Screen name="homePage"
             options={{

          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}/>
        </Tabs>
    )
}