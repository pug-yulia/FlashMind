import { useSQLiteContext } from 'expo-sqlite';


// Helpers

function today() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function now() {
    return new Date().toISOString(); // full timestamp for createdAt fields
}


// Custom hook for the top of any screen that needs the db

export function useDB() {
    const db = useSQLiteContext();


    // Deck operations

    // Returns all decks, each row includes a cardCount field

    // Left join: for every deck attach any flashcard rows 
    // where the flashcard's deckId matches the deck's id
    // if a deck has zero cards, still include it in the results

    // After the join - one row per flashcard not per deck (5 cards - 5 rows 1 deck)
    // GROUP BY d.id collapses rows into one row per deck
    // COUNT(f.id) counts how many flashcard rows belong to that group
    const getDecks = async () => {
        try {
            return await db.getAllAsync(`
        SELECT
          d.*,
          COUNT(f.id) AS cardCount
        FROM decks d
        LEFT JOIN flashcards f ON f.deckId = d.id
        GROUP BY d.id
        ORDER BY d.lastStudied DESC, d.createdAt DESC
      `);
        } catch (error) {
            console.error('getDecks failed:', error);
            return [];
        }
    };

    //Creates a new deck, returns the new deck's id
    const createDeck = async (name) => {
        try {
            const result = await db.runAsync(
                `INSERT INTO decks (name, createdAt) VALUES (?, ?)`,
                [name.trim(), now()]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('createDeck failed:', error);
        }
    };

    // Renames an existing deck
    const renameDeck = async (id, newName) => {
        try {
            await db.runAsync(
                `UPDATE decks SET name = ? WHERE id = ?`,
                [newName.trim(), id]
            );
        } catch (error) {
            console.error('renameDeck failed:', error);
        }
    };

    // Deletes a deck, cards are deleted first to avoid orphaned rows
    const deleteDeck = async (id) => {
        try {
            await db.runAsync(`DELETE FROM flashcards WHERE deckId = ?`, [id]);
            await db.runAsync(`DELETE FROM decks WHERE id = ?`, [id]);
        } catch (error) {
            console.error('deleteDeck failed:', error);
        }
    };


    // Flashcard operations

    // Returns all cards in a deck, oldest first
    const getCardsByDeck = async (deckId) => {
        try {
            return await db.getAllAsync(
                `SELECT * FROM flashcards WHERE deckId = ? ORDER BY createdAt ASC`,
                [deckId]
            );
        } catch (error) {
            console.error('getCardsByDeck failed:', error);
            return [];
        }
    };

    //Adds a single card to a deck, returns the new card's id
    const addCard = async (deckId, question, answer) => {
        try {
            const result = await db.runAsync(
                `INSERT INTO flashcards (deckId, question, answer, createdAt) VALUES (?, ?, ?, ?)`,
                [deckId, question.trim(), answer.trim(), now()]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('addCard failed:', error);
        }
    };

    // Bulk inserts an array of { question, answer } objects into a deck
    // Used after AI generation, wraps everything in one transaction
    // Atomicity: a transaction is a promise to the database: all operations as one unit,
    // if any insert fails, all are rolled back (no partial saves)
    //
    // https://dbschema.com/blog/sqlite/transactions
    // https://docs.expo.dev/versions/latest/sdk/sqlite/#withtransactionasynctask
    const addCards = async (deckId, cards) => {
        try {
            await db.withTransactionAsync(async () => {
                for (const card of cards) {
                    await db.runAsync(
                        `INSERT INTO flashcards (deckId, question, answer, createdAt) VALUES (?, ?, ?, ?)`,
                        [deckId, card.question.trim(), card.answer.trim(), now()]
                    );
                }
            });
        } catch (error) {
            console.error('addCards failed:', error);
        }
    };

    // Updates a card's question and answer
    const updateCard = async (id, question, answer) => {
        try {
            await db.runAsync(
                `UPDATE flashcards SET question = ?, answer = ? WHERE id = ?`,
                [question.trim(), answer.trim(), id]
            );
        } catch (error) {
            console.error('updateCard failed:', error);
        }
    };

    // Deletes a single card
    const deleteCard = async (id) => {
        try {
            await db.runAsync(`DELETE FROM flashcards WHERE id = ?`, [id]);
        } catch (error) {
            console.error('deleteCard failed:', error);
        }
    };


    // Streak operations

    // Returns { currentStreak, lastStudyDate }
    const getStreak = async () => {
        try {
            return await db.getFirstAsync(
                `SELECT currentStreak, lastStudyDate FROM streak WHERE id = 1`
            );
        } catch (error) {
            console.error('getStreak failed:', error);
            return { currentStreak: 0, lastStudyDate: null };
        }
    };

    /**
     * Updates the app wide streak at the end of a review session
     * Same day - no change (already counted today)
     * Yesterday - increment
     * Older / null - reset to 1
     */
    const updateStreak = async () => {
        try {
            const row = await getStreak();
            const todayStr = today();

            if (row.lastStudyDate === todayStr) return; // already studied today

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const newStreak =
                row.lastStudyDate === yesterdayStr
                    ? row.currentStreak + 1
                    : 1;

            await db.runAsync(
                `UPDATE streak SET currentStreak = ?, lastStudyDate = ? WHERE id = 1`,
                [newStreak, todayStr]
            );
        } catch (error) {
            console.error('updateStreak failed:', error);
        }
    };


    // Session helper, call this once when a review session ends

    // Marks the deck as studied and updates the streak in one call
    // Used later to show "last studied 2 days ago"
    const recordStudySession = async (deckId) => {
        try {
            await db.runAsync(
                `UPDATE decks SET lastStudied = ? WHERE id = ?`,
                [now(), deckId]
            );
            await updateStreak();
        } catch (error) {
            console.error('recordStudySession failed:', error);
        }
    };

    return {
        getDecks,
        createDeck,
        renameDeck,
        deleteDeck,
        getCardsByDeck,
        addCard,
        addCards,
        updateCard,
        deleteCard,
        getStreak,
        updateStreak,
        recordStudySession,
    };
}