import { openDB, IDBPDatabase } from 'idb';

// =====================================
// Types
// =====================================

export interface OfflineCompletion {
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

export interface PendingUpload {
  id: string;
  type: 'photo' | 'signature';
  dataUrl: string; // Base64 data URL
  storageBucket: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  itemId?: string; // Associated checklist item ID
  templateId?: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface CachedTemplate {
  id: string;
  checklistType: 'concierge' | 'boh' | 'cafe';
  templateData: unknown; // The full template object
  cachedAt: string;
  expiresAt: string;
}

export interface CachedCompletion {
  id: string;
  templateId: string;
  completionDate: string;
  shiftTime: string;
  completionsData: unknown[]; // Array of completion records
  cachedAt: string;
  expiresAt: string;
}

// =====================================
// Database Initialization
// =====================================

const DB_NAME = 'hume_checklist_offline_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Version 1: completions store (from concierge_offline_db)
        if (oldVersion < 1) {
          const completionsStore = db.createObjectStore('completions', { keyPath: 'id' });
          completionsStore.createIndex('by-pending', 'pending_sync');
          completionsStore.createIndex('by-date', 'completion_date');
        }
        
        // Version 2: Add new stores for enhanced offline support
        if (oldVersion < 2) {
          // Pending uploads store (for photos/signatures queued offline)
          if (!db.objectStoreNames.contains('pendingUploads')) {
            const uploadsStore = db.createObjectStore('pendingUploads', { keyPath: 'id' });
            uploadsStore.createIndex('by-type', 'type');
            uploadsStore.createIndex('by-created', 'createdAt');
          }
          
          // Cached templates store
          if (!db.objectStoreNames.contains('cachedTemplates')) {
            const templatesStore = db.createObjectStore('cachedTemplates', { keyPath: 'id' });
            templatesStore.createIndex('by-type', 'checklistType');
            templatesStore.createIndex('by-expires', 'expiresAt');
          }
          
          // Cached completions store
          if (!db.objectStoreNames.contains('cachedCompletions')) {
            const cachedCompletionsStore = db.createObjectStore('cachedCompletions', { keyPath: 'id' });
            cachedCompletionsStore.createIndex('by-template', 'templateId');
            cachedCompletionsStore.createIndex('by-date', 'completionDate');
            cachedCompletionsStore.createIndex('by-expires', 'expiresAt');
          }
        }
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
  const all = await db.getAll('completions');
  return all.filter((c: OfflineCompletion) => c.pending_sync === true);
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
    .filter((c: OfflineCompletion) => !c.pending_sync)
    .map((c: OfflineCompletion) => c.id);
  
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

// =====================================
// Pending Uploads Functions
// =====================================

export async function savePendingUpload(upload: Omit<PendingUpload, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
  const db = await getOfflineDb();
  const id = crypto.randomUUID();
  const pendingUpload: PendingUpload = {
    ...upload,
    id,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  await db.put('pendingUploads', pendingUpload);
  return id;
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  const db = await getOfflineDb();
  return db.getAll('pendingUploads');
}

export async function getPendingUploadsByType(type: 'photo' | 'signature'): Promise<PendingUpload[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('pendingUploads', 'by-type', type);
}

export async function getPendingUploadById(id: string): Promise<PendingUpload | undefined> {
  const db = await getOfflineDb();
  return db.get('pendingUploads', id);
}

export async function updatePendingUpload(id: string, updates: Partial<PendingUpload>) {
  const db = await getOfflineDb();
  const upload = await db.get('pendingUploads', id);
  if (upload) {
    const updated = { ...upload, ...updates };
    await db.put('pendingUploads', updated);
  }
}

export async function incrementRetryCount(id: string, error?: string) {
  const db = await getOfflineDb();
  const upload = await db.get('pendingUploads', id);
  if (upload) {
    upload.retryCount += 1;
    upload.lastError = error;
    await db.put('pendingUploads', upload);
  }
}

export async function deletePendingUpload(id: string) {
  const db = await getOfflineDb();
  await db.delete('pendingUploads', id);
}

export async function clearAllPendingUploads() {
  const db = await getOfflineDb();
  await db.clear('pendingUploads');
}

export async function getPendingUploadCount(): Promise<number> {
  const db = await getOfflineDb();
  return db.count('pendingUploads');
}

// =====================================
// Cached Templates Functions
// =====================================

const TEMPLATE_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function cacheTemplate(
  checklistType: 'concierge' | 'boh' | 'cafe',
  templateData: unknown
): Promise<void> {
  const db = await getOfflineDb();
  const now = new Date();
  const cached: CachedTemplate = {
    id: `template_${checklistType}`,
    checklistType,
    templateData,
    cachedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TEMPLATE_CACHE_DURATION_MS).toISOString(),
  };
  await db.put('cachedTemplates', cached);
}

export async function getCachedTemplate(
  checklistType: 'concierge' | 'boh' | 'cafe'
): Promise<unknown | null> {
  const db = await getOfflineDb();
  const cached = await db.get('cachedTemplates', `template_${checklistType}`);
  
  if (!cached) return null;
  
  // Check if expired
  if (new Date(cached.expiresAt) < new Date()) {
    await db.delete('cachedTemplates', cached.id);
    return null;
  }
  
  return cached.templateData;
}

export async function clearExpiredTemplates() {
  const db = await getOfflineDb();
  const now = new Date().toISOString();
  const allTemplates = await db.getAll('cachedTemplates');
  
  for (const template of allTemplates) {
    if (template.expiresAt < now) {
      await db.delete('cachedTemplates', template.id);
    }
  }
}

// =====================================
// Cached Completions Functions
// =====================================

const COMPLETION_CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function cacheCompletions(
  templateId: string,
  completionDate: string,
  shiftTime: string,
  completionsData: unknown[]
): Promise<void> {
  const db = await getOfflineDb();
  const now = new Date();
  const id = `completion_${templateId}_${completionDate}_${shiftTime}`;
  
  const cached: CachedCompletion = {
    id,
    templateId,
    completionDate,
    shiftTime,
    completionsData,
    cachedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + COMPLETION_CACHE_DURATION_MS).toISOString(),
  };
  await db.put('cachedCompletions', cached);
}

export async function getCachedCompletions(
  templateId: string,
  completionDate: string,
  shiftTime: string
): Promise<unknown[] | null> {
  const db = await getOfflineDb();
  const id = `completion_${templateId}_${completionDate}_${shiftTime}`;
  const cached = await db.get('cachedCompletions', id);
  
  if (!cached) return null;
  
  // Check if expired
  if (new Date(cached.expiresAt) < new Date()) {
    await db.delete('cachedCompletions', cached.id);
    return null;
  }
  
  return cached.completionsData;
}

export async function clearCachedCompletions(templateId?: string) {
  const db = await getOfflineDb();
  
  if (templateId) {
    const allCached = await db.getAllFromIndex('cachedCompletions', 'by-template', templateId);
    for (const cached of allCached) {
      await db.delete('cachedCompletions', cached.id);
    }
  } else {
    await db.clear('cachedCompletions');
  }
}

export async function clearExpiredCompletions() {
  const db = await getOfflineDb();
  const now = new Date().toISOString();
  const allCached = await db.getAll('cachedCompletions');
  
  for (const cached of allCached) {
    if (cached.expiresAt < now) {
      await db.delete('cachedCompletions', cached.id);
    }
  }
}

// =====================================
// Utility Functions
// =====================================

export async function clearAllOfflineData() {
  const db = await getOfflineDb();
  await Promise.all([
    db.clear('completions'),
    db.clear('pendingUploads'),
    db.clear('cachedTemplates'),
    db.clear('cachedCompletions'),
  ]);
}

export async function getOfflineStats(): Promise<{
  pendingCompletions: number;
  pendingUploads: number;
  cachedTemplates: number;
  cachedCompletions: number;
}> {
  const db = await getOfflineDb();
  const [completions, uploads, templates, cachedComp] = await Promise.all([
    db.count('completions'),
    db.count('pendingUploads'),
    db.count('cachedTemplates'),
    db.count('cachedCompletions'),
  ]);
  
  // Filter to only pending completions
  const allCompletions = await db.getAll('completions');
  const pendingCount = allCompletions.filter((c: OfflineCompletion) => c.pending_sync).length;
  
  return {
    pendingCompletions: pendingCount,
    pendingUploads: uploads,
    cachedTemplates: templates,
    cachedCompletions: cachedComp,
  };
}

// =====================================
// Migration Helper (for existing users)
// =====================================

export async function migrateFromLegacyDb() {
  // Check if old database exists and migrate data
  try {
    const oldDb = await openDB('concierge_offline_db', 1);
    const oldCompletions = await oldDb.getAll('completions');
    
    if (oldCompletions.length > 0) {
      const newDb = await getOfflineDb();
      for (const completion of oldCompletions) {
        await newDb.put('completions', completion);
      }
      console.log(`Migrated ${oldCompletions.length} completions from legacy database`);
    }
    
    // Close the old database (don't delete it in case migration fails)
    oldDb.close();
  } catch (error) {
    // Old database doesn't exist or migration failed - that's okay
    console.log('No legacy database to migrate or migration already complete');
  }
}
