import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDB } from "../storage/db";
import { colors, radius, font } from "../constants/theme";

export default function CreateCardScreen({ navigation, route }) {
  const { getDecks, createDeck, addCard } = useDB();

  const [decks, setDecks] = useState([]);
  // Read optional params, set when navigating from DeckDetailScreen
  const { deckId: preselectedDeckId, deckName: preselectedDeckName } =
    route.params || {};

  const [selectedDeckId, setSelectedDeckId] = useState(
    preselectedDeckId || null,
  );
  const [selectedDeckName, setSelectedDeckName] = useState(
    preselectedDeckName || "Choose a deck...",
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const data = await getDecks();
      setDecks(data);
    } catch (error) {
      console.error("loadDecks failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Creates a new deck via alert prompt and selects it automatically
  // Alert.prompt shows a text input dialog, ios only to note
  // Creates the new deck, refreshes the list, and auto-selects it
  // so the user can immediately start adding cards without extra steps
  const handleCreateNewDeck = () => {
    Alert.prompt(
      "New Deck",
      "Enter a name for the new deck:",
      async (name) => {
        if (!name?.trim()) return;
        const newId = await createDeck(name.trim());
        await loadDecks();
        setSelectedDeckId(newId);
        setSelectedDeckName(name.trim());
        setDropdownOpen(false);
      },
      "plain-text",
    );
  };

  // Saves card to selected deck, clears inputs ready for next card
  const handleAddCard = async () => {
    if (!selectedDeckId) {
      Alert.alert("No deck selected", "Please select or create a deck first.");
      return;
    }
    if (!question.trim() || !answer.trim()) {
      Alert.alert(
        "Missing fields",
        "Please fill in both the question and answer.",
      );
      return;
    }

    setSaving(true);
    try {
      await addCard(selectedDeckId, question, answer);
      // Clear fields after save — deck selection stays
      setQuestion("");
      setAnswer("");
      Alert.alert("Card added!");
    } catch (error) {
      console.error("addCard failed:", error);
    } finally {
      setSaving(false);
    }
  };

  // checks all conditions, .trim() to trim whitespaces
  const canSave = selectedDeckId && question.trim() && answer.trim();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    // ScrollView used instead of View so content is scrollable when keyboard is open
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled" // keeps dropdown tappable when keyboard is open
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonArea}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Section select a deck */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select a Deck</Text>

        {/* Dropdown trigger */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text
            style={[
              styles.dropdownText,
              !selectedDeckId && styles.dropdownPlaceholder,
            ]}
          >
            {selectedDeckName}
          </Text>
          <Text style={styles.dropdownChevron}>{dropdownOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Dropdown list */}
        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDeckId(deck.id);
                  setSelectedDeckName(deck.name);
                  setDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{deck.name}</Text>
                <Text style={styles.dropdownItemCount}>
                  {deck.cardCount} cards
                </Text>
              </TouchableOpacity>
            ))}

            {/* Create new deck option inside dropdown */}
            <TouchableOpacity
              style={styles.createDeckRow}
              onPress={handleCreateNewDeck}
            >
              <Text style={styles.createDeckText}>+ Create New Deck</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section create a flashcard */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create a Flashcard</Text>

        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your question..."
          placeholderTextColor={colors.textMuted}
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <Text style={styles.label}>Answer</Text>
        <TextInput
          style={[styles.input, styles.answerInput]}
          placeholder="Enter the answer..."
          placeholderTextColor={colors.textMuted}
          value={answer}
          onChangeText={setAnswer}
          multiline
        />

        {/* Disabled until deck selected and both fields filled */}
        <TouchableOpacity
          style={[styles.addButton, !canSave && styles.addButtonDisabled]}
          onPress={handleAddCard}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Flashcard to Deck</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.saveHint}>Saved immediately in selected deck</Text>
      </View>

      {/* divider */}
      <Text style={styles.orText}>
        Or generate flashcards from notes using AI
      </Text>

      {/* Section generate from notes (placeholder) */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Generate")}
        activeOpacity={0.8}
      >
        <Text style={styles.sectionTitle}>Generate Flashcards from Notes</Text>
        <Text style={styles.generateSubtext}>
          Paste your study notes and let AI create flashcards automatically.
        </Text>
      </TouchableOpacity>

      {/* Tip box */}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 <Text style={styles.tipBold}>Tip:</Text> Create flashcards manually
          for precise control, or use AI to quickly generate cards from your
          notes. Both methods save to your selected deck.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f0f4ff",
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginTop: 10,
    marginBottom: 16,
  },
  backButtonArea: {
    paddingVertical: 8,
  },
  backButton: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // ios shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    // android
    elevation: 2,
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
  },
  dropdownText: {
    fontSize: font.md,
    color: colors.dark,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
  },
  dropdownChevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: radius.button,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: font.md,
    color: colors.dark,
  },
  dropdownItemCount: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  createDeckRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createDeckText: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "600",
  },
  label: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.md,
    color: colors.dark,
    backgroundColor: "#fafafa",
    marginBottom: 16,
    minHeight: 48,
  },
  answerInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonDisabled: {
    backgroundColor: "#b0bec5",
  },
  addButtonText: {
    color: "#fff",
    fontSize: font.md,
    fontWeight: "600",
  },
  saveHint: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  orText: {
    fontSize: font.sm,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  generateSubtext: {
    fontSize: font.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: "#fffde7",
    borderRadius: radius.button,
    padding: 14,
  },
  tipText: {
    fontSize: font.sm,
    color: colors.dark,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: "700",
  },
});
