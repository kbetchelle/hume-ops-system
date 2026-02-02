import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineCompletion {
  id: string;
  item_id: string;
  template_id?: string;
  completion_date: string;
  shift_time: string;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_id: string | null;
  photo_base64?: string;
  note_text?: string;
  signature_data?: string;
  pending_sync: boolean;
  created_offline_at: string;
}

interface ConciergeOfflineDB extends DBSchema {
  completions: {
    key: string;
    value: OfflineCompletion;
    indexes: { 
      'by-pending': boolean; 
      'by-date': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ConciergeOfflineDB>> | null = null;

export async function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB<ConciergeOfflineDB>('concierge_offline_db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('completions', { keyPath: 'id' });
        store.createIndex('by-pending', 'pending_sync');
        store.createIndex('by-date', 'completion_date');
      },
    });
  }
  return dbPromise;
}

export async function saveCompletionOffline(completion: OfflineCompletion) {
  const db = await getOfflineDb();
  await db.put('completions', completion);
}

export async function getPendingCompletions(): Promise<OfflineCompletion[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('completions', 'by-pending', true);
}

export async function markCompletionSynced(id: string) {
  const db = await getOfflineDb();
  const completion = await db.get('completions', id);
  if (completion) {
    completion.pending_sync = false;
    await db.put('completions', completion);
  }
}

export async function clearSyncedCompletions() {
  const db = await getOfflineDb();
  const allCompletions = await db.getAll('completions');
  const syncedIds = allCompletions
    .filter(c => !c.pending_sync)
    .map(c => c.id);
  
  for (const id of syncedIds) {
    await db.delete('completions', id);
  }
}

export async function getCompletionsByDate(date: string): Promise<OfflineCompletion[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('completions', 'by-date', date);
}

export async function deleteCompletion(id: string) {
  const db = await getOfflineDb();
  await db.delete('completions', id);
}
