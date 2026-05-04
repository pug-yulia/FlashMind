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
import { generateFlashcards } from "../services/aiService";
import { colors, radius, font } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function CreateCardScreen({ navigation, route }) {
  const { getDecks, createDeck, addCard, addCards } = useDB();

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

  // Manual card creation state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  // AI generation state
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [savingGenerated, setSavingGenerated] = useState(false);

  const [loading, setLoading] = useState(true);

  // Load existing decks when screen mounts so the dropdown is populated
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

  // All three must be true for save button to activate
  // .trim() ensures spaces alone don't count as valid input
  const canSave = selectedDeckId && question.trim() && answer.trim();

  // AI generation, shows preview before saving
  const handleGenerate = async () => {
    if (!notes.trim()) {
      Alert.alert("No notes", "Please enter some study notes first.");
      return;
    }

    setGenerating(true); // set button to re render
    setGeneratedCards([]); // clear previous results

    try {
      const cards = await generateFlashcards(notes);
      setGeneratedCards(cards); // preview appears
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

  // Remove a single card from the preview before saving

  // handleRemoveGeneratedCard removes one card from the preview by its position
  // Uses the functional update form setGeneratedCards((prev) => ...)
  // rather than reading generatedCards directly
  // this guarantees user always operate on the latest state
  // even they press multiple deletes in quick succession
  // https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state
  //
  // .filter() returns a new array excluding the item at the tapped index
  // The _ parameter (the card object) is intentionally unused, only the position i matters
  // i !== index keeps everything except the removed card
  const handleRemoveGeneratedCard = (index) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all remaining preview cards to the selected deck in one transaction
  const handleSaveGenerated = async () => {
    if (!selectedDeckId) {
      Alert.alert("No deck selected", "Please select or create a deck first.");
      return;
    }
    if (generatedCards.length === 0) {
      Alert.alert("No cards", "No cards to save.");
      return;
    }

    setSavingGenerated(true);
    try {
      await addCards(selectedDeckId, generatedCards);
      setGeneratedCards([]);
      setNotes("");
      Alert.alert(
        "Saved!",
        `${generatedCards.length} cards added to "${selectedDeckName}".`,
      );
    } catch (error) {
      console.error("addCards failed:", error);
      Alert.alert("Save failed", "Something went wrong. Please try again.");
    } finally {
      setSavingGenerated(false);
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
    // ScrollView so content is scrollable when keyboard is open
    // keyboardShouldPersistTaps="handled" keeps dropdown tappable when keyboard is open
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

        {/* Dropdown list - only rendered when dropdownOpen is true */}
        {/* Conditional rendering 
            Uses && short-circuit: false && anything = nothing rendered
            Component is fully unmounted when closed, not just hidden
            https://react.dev/learn/conditional-rendering#logical-and-operator- */}
        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {/* .map() transforms the decks array from the database into an array of JSX elements
              key={deck.id} uses the stable SQLite id, required so React can track which
              items changed, were added, or removed during re renders without re rendering
              the whole list. Advised to never use array index as key for database backed lists
              https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key */}
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

            {/* Create new deck option at the bottom of the dropdown */}
            <TouchableOpacity
              style={styles.createDeckRow}
              onPress={handleCreateNewDeck}
            >
              <Text style={styles.createDeckText}>+ Create New Deck</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section create a flashcard manually */}
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

        {/* Button is greyed out and disabled until canSave is true */}
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

      {/* Divider */}
      <Text style={styles.orText}>
        Or generate flashcards from notes using AI
      </Text>

      {/* Section AI generation */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Generate Flashcards from Notes</Text>
        <Text style={styles.sectionSubtitle}>
          Paste your study notes below. The more detail you provide, the better
          the flashcards.
        </Text>

        {/* Notes input */}
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

        {/* Generate button */}
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

      {/* Preview generated cards, shown after generation */}
      {generatedCards.length > 0 && (
        <View style={styles.card}>
          <View style={styles.previewHeader}>
            <Text style={styles.sectionTitle}>
              Preview ({generatedCards.length} cards)
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.previewHint}>Tap to remove</Text>
            </View>
          </View>

          {/* Map instead of FlatList (nested FlatList inside ScrollView causes issues) */}
          {/* key={index} becasue generated cards are not in database yet */}
          {generatedCards.map((card, index) => (
            <View key={index} style={styles.previewCard}>
              <View style={styles.previewCardContent}>
                <Text style={styles.previewQuestion}>{card.question}</Text>
                <Text style={styles.previewAnswer}>{card.answer}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveGeneratedCard(index)}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Save all generated cards to selected deck */}
          <TouchableOpacity
            style={[
              styles.saveGeneratedButton,
              !selectedDeckId && styles.saveGeneratedButtonDisabled,
            ]}
            onPress={handleSaveGenerated}
            disabled={!selectedDeckId || savingGenerated}
          >
            {savingGenerated ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveGeneratedButtonText}>
                Save {generatedCards.length} Cards to "{selectedDeckName}"
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: colors.backgroundSoft,
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
  // White cards pop against the soft background
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    // Android
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
  saveGeneratedButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveGeneratedButtonDisabled: {
    backgroundColor: "#b0bec5",
  },
  saveGeneratedButtonText: {
    color: "#fff",
    fontSize: font.md,
    fontWeight: "600",
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
