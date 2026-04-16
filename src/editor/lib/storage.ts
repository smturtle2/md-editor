import { openDB } from 'idb';
import type { StoredDocument } from '../types';

const DB_NAME = 'md-editor-workspace';
const STORE_NAME = 'documents';
const DOCUMENT_KEY = 'active-document';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function loadDocument(): Promise<StoredDocument | null> {
  const db = await getDb();
  return (await db.get(STORE_NAME, DOCUMENT_KEY)) ?? null;
}

export async function saveDocument(document: StoredDocument): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, document);
}
