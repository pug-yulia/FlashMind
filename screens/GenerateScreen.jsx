// All functionality moved inside CreateCardScreen, leaving this for reference

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDB } from "../storage/db";
import { generateFlashcards } from "../services/aiService";
import { colors, radius, font } from "../constants/theme";

export default function GenerateScreen({ navigation, route }) {
  const { getDecks, createDeck, addCards } = useDB();

  // Optional pre selected deck passed from CreateCardScreen
  const { deckId: preselectedDeckId, deckName: preselectedDeckName } =
    route.params || {};

  const [notes, setNotes] = useState("");
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState(
    preselectedDeckId || null,
  );
  const [selectedDeckName, setSelectedDeckName] = useState(
    preselectedDeckName || "Choose a deck...",
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Generated cards shown in preview before saving
  const [generatedCards, setGeneratedCards] = useState([]);
  const [generating, setGenerating] = useState(false);
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
    }
  };

  // Creates a new deck and auto selects it
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

  // Generate flashcards from notes via DeepSeek API
  const handleGenerate = async () => {
    if (!notes.trim()) {
      Alert.alert("No notes", "Please enter some study notes first.");
      return;
    }

    setGenerating(true);
    setGeneratedCards([]); // clear previous results

    try {
      const cards = await generateFlashcards(notes);
      setGeneratedCards(cards);
    } catch (error) {
      console.error("generateFlashcards failed:", error);
      Alert.alert(
        "Generation failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  // Remove a card from the preview before saving
  const handleRemoveCard = (index) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all remaining preview cards to the selected deck
  // Uses addCards() which wraps everything in a single transaction
  const handleSave = async () => {
    if (!selectedDeckId) {
      Alert.alert("No deck selected", "Please select or create a deck first.");
      return;
    }
    if (generatedCards.length === 0) {
      Alert.alert("No cards", "No cards to save.");
      return;
    }

    setSaving(true);
    try {
      await addCards(selectedDeckId, generatedCards);
      Alert.alert(
        "Saved!",
        `${generatedCards.length} cards added to "${selectedDeckName}".`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error("addCards failed:", error);
      Alert.alert("Save failed", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
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

      {/* Section 1: Select a Deck */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select a Deck</Text>

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
            <TouchableOpacity
              style={styles.createDeckRow}
              onPress={handleCreateNewDeck}
            >
              <Text style={styles.createDeckText}>+ Create New Deck</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section 2: Notes input */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Generate Flashcards from Notes</Text>
        <Text style={styles.sectionSubtitle}>
          Paste or type your study notes below. The more detail you provide, the
          better the flashcards.
        </Text>

        <TextInput
          style={styles.notesInput}
          placeholder={
            "Paste or type your study notes here...\n\nExample:\n- Photosynthesis converts light energy to chemical energy\n- The mitochondria is the powerhouse of the cell"
          }
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.generateButton,
            (!notes.trim() || generating) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={!notes.trim() || generating}
        >
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              ✨ Generate Flashcards
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Section 3: Preview generated cards */}
      {generatedCards.length > 0 && (
        <View style={styles.card}>
          <View style={styles.previewHeader}>
            <Text style={styles.sectionTitle}>
              Preview ({generatedCards.length} cards)
            </Text>
            <Text style={styles.previewHint}>Tap 🗑️ to remove a card</Text>
          </View>

          {/* Preview list. Not a FlatList since it's inside ScrollView */}
          {generatedCards.map((card, index) => (
            <View key={index} style={styles.previewCard}>
              <View style={styles.previewCardContent}>
                <Text style={styles.previewQuestion}>{card.question}</Text>
                <Text style={styles.previewAnswer}>{card.answer}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveCard(index)}
              >
                <Text style={styles.removeBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Save to deck button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !selectedDeckId && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedDeckId || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save {generatedCards.length} Cards to "{selectedDeckName}"
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
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
  notesInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.md,
    color: colors.dark,
    backgroundColor: "#fafafa",
    marginBottom: 16,
    minHeight: 160,
    textAlignVertical: "top",
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
  },
  generateButtonDisabled: {
    backgroundColor: "#b0bec5",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: font.md,
    fontWeight: "600",
  },
  generatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  previewHint: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.button,
    padding: 14,
    marginBottom: 10,
  },
  previewCardContent: {
    flex: 1,
  },
  previewQuestion: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 4,
  },
  previewAnswer: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  removeBtn: {
    padding: 8,
    marginLeft: 8,
  },
  removeBtnText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#b0bec5",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: font.md,
    fontWeight: "600",
  },
});
