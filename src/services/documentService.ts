import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions, auth } from './firebase';
import { DocumentRecord } from '../types/types';

const PAGE_SIZE = 10;

export function subscribeToDocuments(
  uid: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null,
  onData: (docs: DocumentRecord[], last: QueryDocumentSnapshot<DocumentData> | null, hasMore: boolean) => void,
  onError: (err: Error) => void
) {
  const col = collection(db, 'users', uid, 'documents');
  const constraints = [orderBy('uploadedAt', 'desc'), limit(PAGE_SIZE + 1)];
  if (lastDoc) constraints.splice(1, 0, startAfter(lastDoc));

  const q = query(col, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const hasMore = snapshot.docs.length > PAGE_SIZE;
      const docs = snapshot.docs.slice(0, PAGE_SIZE);
      const records = docs.map((d) => d.data() as DocumentRecord);
      const last = docs.length > 0 ? docs[docs.length - 1] : null;
      onData(records, last, hasMore);
    },
    onError
  );
}

export async function deleteDocument(uid: string, docRecord: DocumentRecord): Promise<void> {
  const storageRef = ref(storage, docRecord.storagePath);
  try {
    await deleteObject(storageRef);
  } catch {
    // File may already be deleted — continue
  }
  await deleteDoc(doc(db, 'users', uid, 'documents', docRecord.docId));
}

export async function reAnalyzeDocument(docId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  await updateDoc(doc(db, 'users', user.uid, 'documents', docId), {
    status: 'pending',
    analysisResult: null,
    error: null,
  });

  const analyze = httpsCallable(functions, 'analyzeDocument');
  await analyze({ docId });
}
