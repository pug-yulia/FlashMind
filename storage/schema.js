export const SCHEMA_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS decks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    createdAt   TEXT    NOT NULL,
    lastStudied TEXT
  );`,

    `CREATE TABLE IF NOT EXISTS flashcards (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    deckId    INTEGER NOT NULL,
    question  TEXT    NOT NULL,
    answer    TEXT    NOT NULL,
    createdAt TEXT    NOT NULL
  );`,

    // Single row table, only one row with id=1 exists
    `CREATE TABLE IF NOT EXISTS streak (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    currentStreak INTEGER NOT NULL DEFAULT 0,
    lastStudyDate TEXT
  );`,
];