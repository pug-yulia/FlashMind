import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useDB } from "../storage/db";
import { colors, radius, font } from "../constants/theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 340;

export default function ReviewScreen({ navigation, route }) {
  const { deckId, deckName } = route.params;
  const { getCardsByDeck, recordStudySession } = useDB();

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  // Animated value for the flip, 0 = front, 1 = back
  // https://react.dev/reference/react/useRef
  // so it doesnt cause re renders
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getCardsByDeck(deckId);
      setCards(data);
    } catch (error) {
      console.error("loadCards failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Flip animation using Animated.timing + Easing for a smooth ease in out curve
  // Front face: interpolates 0deg - 180deg (rotates away)
  // Back face:  interpolates 180deg - 360deg (comes around from behind)
  // backfaceVisibility: 'hidden' on each face prevents bleed through
  // https://reactnative.dev/docs/animated
  // https://docs.swmansion.com/react-native-reanimated/examples/flipCard/
  // https://reactnative.dev/docs/easing
  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(flipAnim, {
      toValue,
      duration: 400,
      easing: Easing.inOut(Easing.ease), // slow start, fast middle, slow end
      useNativeDriver: true, // runs on UI thread for better performance
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  // Snap back to front instantly when changing cards
  const resetFlip = () => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  };

  // Card navigation
  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      resetFlip();
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSessionEnd();
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      resetFlip();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSessionEnd = async () => {
    await recordStudySession(deckId); // updates lastStudied + streak
    setSessionDone(true);
  };

  // Normal: front = question, back = answer
  // Reverse: front = answer, back = question
  const currentCard = cards[currentIndex];
  const frontText = reverseMode ? currentCard?.answer : currentCard?.question;
  const backText = reverseMode ? currentCard?.question : currentCard?.answer;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No cards in this deck.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Session complete screen
  if (sessionDone) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Session Complete!</Text>
        <Text style={styles.doneSubtitle}>
          You reviewed all {cards.length} cards.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Back to Deck</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonArea}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Progress counter */}
      <Text style={styles.progress}>
        {currentIndex + 1} / {cards.length}
      </Text>

      {/* Flip card (tap anywhere to flip) */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={flipCard}
        style={styles.cardContainer}
      >
        {/* Front face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            { transform: [{ rotateY: frontRotate }] },
          ]}
        >
          <Text style={styles.cardText}>{frontText}</Text>
        </Animated.View>

        {/* Back face, starts rotated away, comes around on flip */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: backRotate }] },
          ]}
        >
          <Text style={styles.cardText}>{backText}</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Tap to flip hint */}
      <Text style={styles.hint}>Tap card to flip</Text>

      {/* Previous / Next buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={goPrevious}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goNext}>
          <Text style={styles.navButtonText}>
            {currentIndex === cards.length - 1 ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reverse mode toggle */}
      <TouchableOpacity
        style={styles.reverseToggle}
        onPress={() => {
          resetFlip();
          setReverseMode(!reverseMode);
        }}
      >
        <View style={[styles.checkbox, reverseMode && styles.checkboxActive]} />
        <Text style={styles.reverseLabel}>Reverse Mode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  header: {
    width: "100%",
    marginTop: 10,
    marginBottom: 8,
  },
  backButtonArea: {
    paddingVertical: 8,
  },
  backButton: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "500",
  },
  progress: {
    fontSize: font.md,
    color: colors.textMuted,
    marginBottom: 20,
    marginTop: 40,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 16,
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    // ios shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // android
    elevation: 4,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: "#fff",
  },
  cardBack: {
    backgroundColor: "#f0f4ff", // blue tint on answer side to differenciate
  },
  cardText: {
    fontSize: font.lg,
    fontWeight: "600",
    color: colors.dark,
    textAlign: "center",
    lineHeight: 32,
  },
  hint: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 28,
  },
  navButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
  },
  reverseToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.dark,
    backgroundColor: "transparent",
  },
  checkboxActive: {
    backgroundColor: colors.dark,
  },
  doneEmoji: {
    fontSize: 64,
  },
  doneTitle: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.dark,
  },
  doneSubtitle: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.button,
    marginTop: 8,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: font.md,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: font.md,
    color: colors.dark,
    fontWeight: "600",
  },
  backLink: {
    fontSize: font.md,
    color: colors.primary,
  },
});
