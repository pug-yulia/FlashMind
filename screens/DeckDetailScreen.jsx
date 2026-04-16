import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDB } from "../storage/db";
import { colors, radius, font } from "../constants/theme";

export default function DeckDetailScreen({ navigation, route }) {
  // Deck id and name passed from DecksScreen with navigation params
  const { deckId, deckName } = route.params;
  const { getCardsByDeck, deleteCard } = useDB();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

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

  // placeholder
  const handleRenameDeck = () => {
    Alert.alert("Rename Deck");
  };

  // Confirm before deleting a card
  const handleDeleteCard = (card) => {
    Alert.alert("Delete this card?", `"${card.question}" \n "${card.answer}"`, [
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

  // placeholder
  const handleEditCard = (card) => {
    Alert.alert("Edit Card");
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

      {/* Study button, main point */}
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

              {/* Edit mode */}
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
    marginBottom: 28,
    marginHorizontal: 24,
    // ios shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // android
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
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    // ios shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // android
    elevation: 3,
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
  separator: {
    height: 15,
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
});
