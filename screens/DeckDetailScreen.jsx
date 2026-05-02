import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useDB } from "../storage/db";
import { colors, radius, font } from "../constants/theme";

export default function DeckDetailScreen({ navigation, route }) {
  // Deck id and name passed from DecksScreen with navigation params
  const { deckId, deckName: initialDeckName } = route.params;
  const { getCardsByDeck, deleteCard, updateCard, renameDeck } = useDB();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Deck name can change via rename so we keep it in state
  const [deckName, setDeckName] = useState(initialDeckName);

  // Edit card modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // card being edited
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [saving, setSaving] = useState(false);

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

  // Rename deck
  // Alert.prompt shows a native iOS text input dialog
  // Pre filled with current name so user only has to change what they want
  // ios only
  const handleRenameDeck = () => {
    Alert.prompt(
      "Rename Deck",
      "Enter a new name:",
      async (newName) => {
        if (!newName?.trim()) return;
        await renameDeck(deckId, newName.trim());
        setDeckName(newName.trim()); // update title on screen immediately
      },
      "plain-text",
      deckName, // prefills the input with current deck name
    );
  };

  // Edit card modal
  // opens pre filled with the card's current question/answer
  const handleEditCard = (card) => {
    setEditingCard(card);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setModalVisible(true);
  };

  const handleSaveCard = async () => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      Alert.alert("Missing fields", "Both question and answer are required.");
      return;
    }

    setSaving(true);
    try {
      await updateCard(editingCard.id, editQuestion, editAnswer);
      await loadCards(); // refresh list with updated card
      setModalVisible(false);
    } catch (error) {
      console.error("updateCard failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCard(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  // Delete card
  const handleDeleteCard = (card) => {
    Alert.alert("Delete this card?", `"${card.question}"`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCard(card.id);
          await loadCards();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
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

        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={styles.titleNameRow}>
              <Text style={styles.title}>{deckName}</Text>
              {/* Pencil opens rename prompt */}
              <TouchableOpacity
                style={styles.renameBtn}
                onPress={handleRenameDeck}
              >
                <Text style={styles.renameBtnText}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardCount}>{cards.length} cards</Text>
          </View>
        </View>
      </View>

      {/* Study button — disabled if no cards */}
      <TouchableOpacity
        style={[
          styles.studyButton,
          cards.length === 0 && styles.studyButtonDisabled,
        ]}
        onPress={() => {
          if (cards.length === 0) return;
          navigation.navigate("Review", { deckId, deckName });
        }}
      >
        <Text style={styles.studyIcon}>▶</Text>
        <Text style={styles.studyButtonText}>Study Cards</Text>
      </TouchableOpacity>

      {/* Add Cards button navigates to CreateCard with this deck pre selected */}
      <TouchableOpacity
        style={styles.addCardsButton}
        onPress={() => navigation.navigate("CreateCard", { deckId, deckName })}
      >
        <Text style={styles.addCardsButtonText}>+ Add Cards</Text>
      </TouchableOpacity>

      {/* Cards section header with edit toggle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cards</Text>
        {cards.length > 0 && (
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            <Text style={styles.editToggle}>
              {editMode ? "Done" : "✏️ Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Card list */}
      {cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No cards yet.</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cardRow}>
              <View style={styles.cardContent}>
                <Text style={styles.cardQuestion}>{item.question}</Text>
                <Text style={styles.cardAnswer}>{item.answer}</Text>
              </View>

              {/* Edit mode: pencil + trash per card */}
              {editMode && (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditCard(item)}
                  >
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteCard(item)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Edit card modal
          Modal sits on top of everything, transparent overlay behind it
          Pre-filled with the card's current question and answer
          https://reactnative.dev/docs/modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide" // slides up from bottom
        onRequestClose={handleCloseModal} // Android back button closes modal
      >
        {/* Semi transparent backdrop, tapping it closes the modal */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          {/* Stop tap from closing when pressing inside the modal content */}
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Edit Card</Text>

            <Text style={styles.modalLabel}>Question</Text>
            <TextInput
              style={styles.modalInput}
              value={editQuestion}
              onChangeText={setEditQuestion}
              multiline
              placeholder="Question..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Answer</Text>
            <TextInput
              style={[styles.modalInput, styles.modalAnswerInput]}
              value={editAnswer}
              onChangeText={setEditAnswer}
              multiline
              placeholder="Answer..."
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
            />

            {/* Modal action buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCard}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  backButtonArea: {
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 10,
  },
  backButton: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "500",
  },
  titleRow: {
    marginBottom: 4,
  },
  titleLeft: {
    flexDirection: "column",
  },
  titleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.dark,
    flexWrap: "wrap",
    flex: 1,
  },
  renameBtn: {
    padding: 4,
  },
  renameBtnText: {
    fontSize: 16,
  },
  cardCount: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  studyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    marginHorizontal: 24,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // Android
    elevation: 3,
  },
  studyButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  studyIcon: {
    fontSize: 18,
    color: "#fff",
  },
  studyButtonText: {
    fontSize: font.md,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  addCardsButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 28,
  },
  addCardsButtonText: {
    color: colors.primary,
    fontSize: font.md,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
  },
  editToggle: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Android
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardQuestion: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 4,
  },
  cardAnswer: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: font.lg,
    fontWeight: "600",
    color: colors.dark,
  },
  emptySubtext: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Modal styles

  // Semi-transparent dark overlay behind the modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end", // modal slides up from bottom
  },
  // White modal card that slides up
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 8,
  },
  modalInput: {
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
  modalAnswerInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: font.md,
    fontWeight: "600",
    color: "#fff",
  },
});
