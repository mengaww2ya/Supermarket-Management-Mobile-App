import { NavigationContainer } from "@react-navigation/native";
import AuthicStackNavig from '../navigator/authenticatior.js';
export default function RootNavigator(){
    return(
<NavigationContainer>
<AuthicStackNavig/>
</NavigationContainer>
    );
}