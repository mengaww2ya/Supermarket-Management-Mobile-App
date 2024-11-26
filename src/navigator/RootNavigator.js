import { NavigationContainer } from "@react-navigation/native";
import AuthicStackNavig from '../navigator/authenticatior.js';
import React from 'react';

export default function RootNavigator(){
    return(
<NavigationContainer >
<AuthicStackNavig />
</NavigationContainer>
    );
}