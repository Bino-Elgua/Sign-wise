import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from './firebase';
import { DocumentRecord } from '../types/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
};

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds 10MB limit.`;
  }
  if (!ACCEPTED_TYPES[file.type]) {
    return `Unsupported file type: ${file.type || file.name.split('.').pop()}. Accepted: PDF, DOCX, PNG, JPG.`;
  }
  return null;
}

export function getAcceptString(): string {
  return Object.keys(ACCEPTED_TYPES).join(',');
}

export async function uploadDocument(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ docId: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  const docId = crypto.randomUUID();
  const storagePath = `users/${user.uid}/documents/${docId}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

  const record: DocumentRecord = {
    docId,
    filename: file.name,
    fileType: file.type,
    storagePath,
    downloadURL,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    analysisResult: null,
  };

  await setDoc(doc(db, 'users', user.uid, 'documents', docId), {
    ...record,
    uploadedAt: serverTimestamp(),
  });

  return { docId };
}
