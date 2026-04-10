import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useDB } from "../storage/db";

export default function HomeScreen({ navigation }) {
  const { getStreak, getDecks } = useDB();
  const [streak, setStreak] = useState(0);
  const [decksCount, setDecksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const streakRow = await getStreak();
      const decks = await getDecks();
      setStreak(streakRow?.currentStreak ?? 0);
      setDecksCount(decks.length);
    } catch (error) {
      console.error("HomeScreen loadData failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Streak: {streak}</Text>
      <Text>Decks: {decksCount}</Text>

      <TouchableOpacity onPress={() => navigation.navigate("CreateCard")}>
        <Text>Create Flashcards</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Decks")}>
        <Text>My Decks</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
