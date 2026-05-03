import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { SCHEMA_STATEMENTS } from './storage/schema';

// Initialises the database schema on first launch
// SQLiteProvider calls this before rendering any children
// so by the time any screen mounts the tables already exist
// https://docs.expo.dev/versions/latest/sdk/sqlite/#sqliteprovider
async function initDB(db) {
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execAsync(stmt);
  }

  // Ensure the single streak row exists (safe to run every launch)
  await db.runAsync(
    `INSERT OR IGNORE INTO streak (id, currentStreak, lastStudyDate) VALUES (1, 0, NULL)`
  );
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