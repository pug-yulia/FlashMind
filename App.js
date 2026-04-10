import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { SCHEMA_STATEMENTS } from './storage/schema';

// Seed data for testing
async function seedDB(db) {
  const existing = await db.getFirstAsync('SELECT id FROM decks LIMIT 1');
  if (existing) return;

  const result1 = await db.runAsync(
    `INSERT INTO decks (name, createdAt) VALUES (?, ?)`,
    ['Biology Chapter 3', new Date().toISOString()]
  );
  const result2 = await db.runAsync(
    `INSERT INTO decks (name, createdAt) VALUES (?, ?)`,
    ['Spanish Vocabulary', new Date().toISOString()]
  );

  const deck1 = result1.lastInsertRowId;
  const deck2 = result2.lastInsertRowId;

  const now = new Date().toISOString();

  const cards = [
    { deckId: deck1, question: 'What is photosynthesis?', answer: 'The process by which plants convert sunlight into energy.' },
    { deckId: deck1, question: 'What is mitosis?', answer: 'Cell division producing two identical daughter cells.' },
    { deckId: deck1, question: 'What is the powerhouse of the cell?', answer: 'The mitochondria.' },
    { deckId: deck2, question: 'How do you say "hello" in Spanish?', answer: 'Hola' },
    { deckId: deck2, question: 'How do you say "thank you" in Spanish?', answer: 'Gracias' },
  ];

  for (const card of cards) {
    await db.runAsync(
      `INSERT INTO flashcards (deckId, question, answer, createdAt) VALUES (?, ?, ?, ?)`,
      [card.deckId, card.question, card.answer, now]
    );
  }
}


// Initialises the database schema on first launch,
// by the time any screen mounts, the tables already exist

async function initDB(db) {
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execAsync(stmt);
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO streak (id, currentStreak, lastStudyDate) VALUES (1, 0, NULL)`
  );

  await seedDB(db);
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function App() {
  return (
    <SQLiteProvider
      databaseName="flashmind.db"
      onInit={initDB}
      loadingFallback={<LoadingFallback />}
      onError={(error) => console.error('Database failed to open:', error)}
    >
      <AppNavigator />
    </SQLiteProvider>
  );
}