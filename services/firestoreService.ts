import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Manifest, LoadingManifest } from "../types";

// Helper to convert Firebase Timestamp to ISO string
const formatFirebaseDate = (date: any): string => {
  if (date instanceof Timestamp) {
    return date.toDate().toISOString();
  }
  return date || new Date().toISOString();
};

export const subscribeToManifests = (callback: (data: Manifest[]) => void) => {
  const q = query(collection(db, "manifests"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: formatFirebaseDate(d.createdAt),
        conferenceDate: formatFirebaseDate(d.conferenceDate),
      } as Manifest;
    });
    callback(data);
  }, (error) => {
    console.error("Error subscribing to manifests:", error);
  });
};

export const subscribeToLoadingManifests = (callback: (data: LoadingManifest[]) => void) => {
  const q = query(collection(db, "loading_manifests"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: formatFirebaseDate(d.createdAt),
      } as LoadingManifest;
    });
    callback(data);
  }, (error) => {
    console.error("Error subscribing to loading manifests:", error);
  });
};

export const saveManifest = async (manifest: Omit<Manifest, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "manifests"), {
      ...manifest,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving manifest:", error);
    throw error;
  }
};

export const saveLoadingManifest = async (loadingManifest: Omit<LoadingManifest, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "loading_manifests"), {
      ...loadingManifest,
      createdAt: serverTimestamp(),
    });
    
    // Update linked manifests status to ENTREGUE
    for (const manifestId of loadingManifest.linkedManifestIds) {
      const manifestRef = doc(db, "manifests", manifestId);
      await updateDoc(manifestRef, {
        status: 'ENTREGUE',
        deliveryDate: new Date().toISOString()
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving loading manifest:", error);
    throw error;
  }
};
