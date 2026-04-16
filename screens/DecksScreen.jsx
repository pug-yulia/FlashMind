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

export default function DecksScreen({ navigation }) {
  const { getDecks, deleteDeck } = useDB();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // toggles edit/delete buttons on each row

  // Load decks
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

  // Confirm before deleting
  // Deletes deck and all its cards
  const handleDeleteDeck = (deck) => {
    Alert.alert(
      "Delete Deck",
      `Are you sure you want to delete "${deck.name}"? All cards will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDeck(deck.id);
            await loadDecks();
          },
        },
      ],
    );
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonArea}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>My Decks</Text>
          {/* Edit toggle */}
          {decks.length > 0 && (
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editToggle}>
                {editMode ? "Done" : "✏️ Edit"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.newDeckButton}
        onPress={() => navigation.navigate("CreateCard")}
      >
        <Text style={styles.newDeckButtonText}>+ New Deck</Text>
      </TouchableOpacity>

      {/* Deck list */}
      {decks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No decks yet.</Text>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deckCard}
              onPress={() =>
                !editMode &&
                navigation.navigate("DeckDetail", {
                  deckId: item.id,
                  deckName: item.name,
                })
              }
              activeOpacity={editMode ? 1 : 0.7} // no tap feedback in edit mode
            >
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{item.name}</Text>
                <Text style={styles.cardCount}>{item.cardCount} cards</Text>
              </View>

              {/* Edit mode */}
              {editMode ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteDeck(item)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.arrow}>→</Text>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.dark,
  },
  editToggle: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: "500",
  },
  newDeckButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  newDeckButtonText: {
    color: colors.primary,
    fontSize: font.md,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
  },
  deckCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.button,
    paddingVertical: 20,
    paddingHorizontal: 20,
    // ios shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // android shadow, to be tested
    elevation: 3,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: font.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  arrow: {
    fontSize: font.md,
    color: colors.textMuted,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  deleteBtn: {
    padding: 10,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  separator: {
    height: 15, // maybe adjust later
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
  },
});
