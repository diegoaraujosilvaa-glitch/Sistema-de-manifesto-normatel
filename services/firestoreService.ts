import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  setDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  Manifest, 
  LoadingManifest, 
  Vehicle, 
  Driver, 
  Branch, 
  Checker, 
  DistributionCenter,
  UserProfile 
} from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
    handleFirestoreError(error, OperationType.LIST, "manifests");
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
    handleFirestoreError(error, OperationType.LIST, "loading_manifests");
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
    handleFirestoreError(error, OperationType.CREATE, "manifests");
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
    handleFirestoreError(error, OperationType.CREATE, "loading_manifests");
  }
};

// --- Support Collections Subscriptions ---

export const subscribeToCheckers = (callback: (data: Checker[]) => void) => {
  return onSnapshot(collection(db, "checkers"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checker)));
  });
};

export const subscribeToDrivers = (callback: (data: Driver[]) => void) => {
  return onSnapshot(collection(db, "drivers"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
  });
};

export const subscribeToVehicles = (callback: (data: Vehicle[]) => void) => {
  return onSnapshot(collection(db, "vehicles"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
  });
};

export const subscribeToBranches = (callback: (data: Branch[]) => void) => {
  return onSnapshot(collection(db, "branches"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));
  });
};

export const subscribeToCDs = (callback: (data: DistributionCenter[]) => void) => {
  return onSnapshot(collection(db, "cds"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DistributionCenter)));
  });
};

// --- Support Collections Save/Delete ---

export const saveChecker = async (checker: Omit<Checker, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "checkers"), checker);
    return docRef.id;
  } catch (error) {
    console.error("Error saving checker:", error);
    throw error;
  }
};

export const deleteChecker = async (id: string) => {
  try {
    await deleteDoc(doc(db, "checkers", id));
  } catch (error) {
    console.error("Error deleting checker:", error);
    throw error;
  }
};

export const saveDriver = async (driver: Omit<Driver, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "drivers"), driver);
    return docRef.id;
  } catch (error) {
    console.error("Error saving driver:", error);
    throw error;
  }
};

export const deleteDriver = async (id: string) => {
  try {
    await deleteDoc(doc(db, "drivers", id));
  } catch (error) {
    console.error("Error deleting driver:", error);
    throw error;
  }
};

export const saveVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "vehicles"), vehicle);
    return docRef.id;
  } catch (error) {
    console.error("Error saving vehicle:", error);
    throw error;
  }
};

export const deleteVehicle = async (id: string) => {
  try {
    await deleteDoc(doc(db, "vehicles", id));
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw error;
  }
};

export const saveBranch = async (branch: Omit<Branch, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "branches"), branch);
    return docRef.id;
  } catch (error) {
    console.error("Error saving branch:", error);
    throw error;
  }
};

export const deleteBranch = async (id: string) => {
  try {
    await deleteDoc(doc(db, "branches", id));
  } catch (error) {
    console.error("Error deleting branch:", error);
    throw error;
  }
};

export const saveCD = async (cd: Omit<DistributionCenter, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "cds"), cd);
    return docRef.id;
  } catch (error) {
    console.error("Error saving CD:", error);
    throw error;
  }
};

export const deleteCD = async (id: string) => {
  try {
    await deleteDoc(doc(db, "cds", id));
  } catch (error) {
    console.error("Error deleting CD:", error);
    throw error;
  }
};

export const deleteManifest = async (id: string) => {
  const path = `manifests/${id}`;
  try {
    await deleteDoc(doc(db, "manifests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteLoadingManifest = async (id: string) => {
  const path = `loading_manifests/${id}`;
  try {
    await deleteDoc(doc(db, "loading_manifests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToUsers = (callback: (data: UserProfile[]) => void) => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
  });
};

export const saveUser = async (user: Omit<UserProfile, 'uid'>) => {
  try {
    const docRef = await addDoc(collection(db, "users"), user);
    return docRef.id;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
