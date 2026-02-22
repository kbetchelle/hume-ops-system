import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "hume-offline-store";
const DB_VERSION = 1;
const STORE_NAME = "data";

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getOfflineBootstrapDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function getBootstrapMeta(): Promise<{
  lastBootstrap: number;
  userId: string;
  role: string;
} | null> {
  const db = await getOfflineBootstrapDb();
  const raw = await db.get(STORE_NAME, "meta");
  return (raw as typeof raw) ?? null;
}

export async function setBootstrapMeta(meta: {
  lastBootstrap: number;
  userId: string;
  role: string;
}): Promise<void> {
  const db = await getOfflineBootstrapDb();
  await db.put(STORE_NAME, meta, "meta");
}

export async function setBootstrapEntry(key: string, value: unknown): Promise<void> {
  const db = await getOfflineBootstrapDb();
  await db.put(STORE_NAME, value, key);
}

export async function getBootstrapEntry<T>(key: string): Promise<T | undefined> {
  const db = await getOfflineBootstrapDb();
  return db.get(STORE_NAME, key) as Promise<T | undefined>;
}

export async function deleteBootstrapEntry(key: string): Promise<void> {
  const db = await getOfflineBootstrapDb();
  await db.delete(STORE_NAME, key);
}

export async function clearStaleBootstrapEntries(today: string): Promise<void> {
  const db = await getOfflineBootstrapDb();
  const allKeys = await db.getAllKeys(STORE_NAME);
  const toDelete = allKeys.filter((k) => {
    if (typeof k !== "string" || k === "meta") return false;
    const match = k.match(/-(\d{4}-\d{2}-\d{2})$/);
    if (!match) return false;
    return match[1] < today;
  });
  for (const key of toDelete) {
    await db.delete(STORE_NAME, key);
  }
}
