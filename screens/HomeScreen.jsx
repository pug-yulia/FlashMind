import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
} from "react-native";
import { useDB } from "../storage/db";
import { colors, radius, font } from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { getStreak } = useDB();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reload data every time the screen comes into focus
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const streakRow = await getStreak();
      setStreak(streakRow?.currentStreak ?? 0);
    } catch (error) {
      console.error("HomeScreen loadData failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/home-bg2.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Streak badge, independent of main content */}
        <View style={[styles.streakBadge, { top: insets.top + 170 }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>
            {/* Show days count if streak exists, otherwise prompt to start */}
            {streak > 0
              ? `Streak: ${streak} day${streak === 1 ? "" : "s"}!`
              : "No streak yet — start studying!"}
          </Text>
        </View>

        {/* Main content, centered vertically and horizontally independently */}
        <View style={styles.mainContent}>
          {/* Logo / title area */}
          <View style={styles.logoArea}>
            <Image
              source={require("../assets/logo3.png")}
              style={{ width: 80, height: 80, marginBottom: 5 }}
            />
            <Text style={styles.title}>FlashMind</Text>
            <Text style={styles.subtitle}>Welcome back! Ready to study?</Text>
          </View>

          {/* Navigation buttons */}
          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateCard")}
            >
              <Text style={styles.createButtonText}>Create Flashcards</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.decksButton}
              onPress={() => navigation.navigate("Decks")}
            >
              <Text style={styles.decksButtonText}>My Decks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  streakBadge: {
    position: "absolute",
    alignSelf: "center",
    //top: 240,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.streakBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.badge,
    gap: 6,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakText: {
    fontSize: font.sm,
    fontWeight: "600",
    color: colors.streakText,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  buttonArea: {
    width: "100%",
    gap: 12,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: "center",
  },
  createButtonText: {
    color: colors.background,
    fontSize: font.md,
    fontWeight: "600",
  },
  decksButton: {
    backgroundColor: colors.dark,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: "center",
  },
  decksButtonText: {
    color: colors.background,
    fontSize: font.md,
    fontWeight: "600",
  },
});
