import { View, Text, TouchableOpacity } from "react-native";

export default function CreateCardScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        style={{ position: "absolute", top: 60, left: 24 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#4361EE", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      <Text>Create Card</Text>
    </View>
  );
}
