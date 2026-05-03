import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/HomeScreen";
import DecksScreen from "../screens/DecksScreen";
import DeckDetailScreen from "../screens/DeckDetailScreen";
import CreateCardScreen from "../screens/CreateCardScreen";
import ReviewScreen from "../screens/ReviewScreen";
import GenerateScreen from "../screens/GenerateScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // custom headers per screen
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Decks" component={DecksScreen} />
        <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
        <Stack.Screen name="CreateCard" component={CreateCardScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
