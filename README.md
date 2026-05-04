# FlashMind 🧠

A mobile flashcard study app built with React Native (Expo) for a Mobile Programming course project. FlashMind lets users create, organize, and review flashcards — with AI-powered card generation from study notes.

---
## Demo

<img width="648" height="1406" alt="app-demo" src="https://github.com/user-attachments/assets/b51cad12-a0c8-4cea-9881-522aa5f709ee" />


---

## Features

- **Create flashcards manually** — question and answer fields, saved instantly to a selected deck
- **AI flashcard generation** — paste study notes and generate up to 40 flashcards automatically using the DeepSeek API
- **Preview before saving** — review and remove unwanted AI-generated cards before committing to the database
- **Organize into decks** — create, rename, and delete decks; each deck shows a card count
- **Review mode** — flip card animation (tap to reveal answer), Previous/Next navigation, progress counter
- **Reverse mode** — swap question and answer sides during review
- **Edit and delete** — edit individual cards via a slide-up modal, delete cards or entire decks
- **Study streak** — tracks consecutive days of study activity, displayed on the home screen
- **Local storage** — all data stored on-device using SQLite, no account or internet required for core features

---

## Technologies

| Technology                     | Purpose                            |
| ------------------------------ | ---------------------------------- |
| React Native (Expo SDK 54)     | Mobile app framework               |
| JavaScript                     | Primary language                   |
| Expo SQLite                    | Local data persistence             |
| React Navigation (Stack)       | Screen navigation                  |
| DeepSeek API                   | AI flashcard generation from notes |
| React Native Animated API      | Flip card animation                |
| Expo Vector Icons (Ionicons)   | UI icons                           |
| react-native-safe-area-context | Safe area / notch handling         |

---

## Project Structure

```
FlashMind/
├── App.js                  # Entry point, SQLite provider and DB init
├── navigation/
│   └── AppNavigator.jsx    # Stack navigator with all screens
├── screens/
│   ├── HomeScreen.jsx      # Landing screen with streak display
│   ├── DecksScreen.jsx     # Deck list with create/delete
│   ├── DeckDetailScreen.jsx # Cards inside a deck, edit modal
│   ├── CreateCardScreen.jsx # Manual card creation + AI generation
│   ├── ReviewScreen.jsx    # Flip card study session
│   └── GenerateScreen.jsx  # (placeholder)
├── storage/
│   ├── db.js               # useDB() hook — all SQLite operations
│   └── schema.js           # SQL table definitions
├── services/
│   └── aiService.js        # DeepSeek API integration
└── constants/
    └── theme.js            # Colors, font sizes, border radius tokens
```

---

## Data Layer

Three SQLite tables:

- **decks** — `id`, `name`, `createdAt`, `lastStudied`
- **flashcards** — `id`, `deckId`, `question`, `answer`, `createdAt`
- **streak** — single-row table tracking `currentStreak` and `lastStudyDate`

All database operations are exposed through a custom `useDB()` hook using `useSQLiteContext()` from Expo SQLite. Bulk inserts (AI generation) use `withTransactionAsync` for atomicity.

---

## AI Generation

Study notes are sent to the [DeepSeek API](https://api-docs.deepseek.com/) which returns a structured JSON array of `{ question, answer }` objects. The prompt instructs the model to return raw JSON only — no markdown, no prose. The response is cleaned, parsed, and validated before being shown in a preview list where the user can remove unwanted cards before saving.

---

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_DEEPSEEK_API_KEY=your_key_here
   ```
4. Start the development server:
   ```bash
   npx expo start
   ```
5. Scan the QR code with Expo Go on your device

---

## Course

Mobile Programming — Haaga-Helia University of Applied Sciences
