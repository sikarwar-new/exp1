// Admin service functions for managing notes and users
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  arrayRemove,
  arrayUnion,
  increment
} from "firebase/firestore";
import { db } from "../config/firebase";
import { checkAdminStatus } from "./authService";

// Check if user is admin
export const isAdmin = async (userEmail) => {
  return await checkAdminStatus(userEmail);
};

// Get all pending notes for approval
export const getPendingNotes = async () => {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    
    return { notes, error: null };
  } catch (error) {
    console.error('Error getting pending notes:', error);
    return { notes: [], error: error.message };
  }
};

// Get all notes (approved, pending, rejected)
export const getAllNotesAdmin = async () => {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    
    return { notes, error: null };
  } catch (error) {
    console.error('Error getting all notes:', error);
    return { notes: [], error: error.message };
  }
};

// Approve a note
export const approveNote = async (noteId) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      status: 'approved',
      approvedAt: new Date(),
      updatedAt: new Date()
    });
    return { error: null };
  } catch (error) {
    console.error('Error approving note:', error);
    return { error: error.message };
  }
};

// Deny access to a note
export const denyNote = async (noteId, reason = '') => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      status: 'access denied',
      denialReason: reason,
      deniedAt: new Date(),
      updatedAt: new Date()
    });
    return { error: null };
  } catch (error) {
    console.error('Error denying note:', error);
    return { error: error.message };
  }
};
export const updateNote = async (noteId, updatedFields) => {
  try {
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, updatedFields);
    return { error: null };
  } catch (error) {
    console.error("Error updating note:", error);
    return { error: error.message };
  }
};

export const getAllAccessRequests = async () => {
  try {
    const accessReqRef = collection(db, "accessRequests");
    const q = query(accessReqRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    return { requests, error: null };
  } catch (error) {
    console.error("Error getting access requests:", error);
    return { requests: [], error: error.message };
  }
};

// Approve access request
export const approveAccessRequest = async (requestId) => {
  try {
    const reqRef = doc(db, "accessRequests", requestId);
    await updateDoc(reqRef, {
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error approving access request:", error);
    return { error: error.message };
  }
};

// Deny access request with optional reason
export const denyAccessRequest = async (requestId, reason = "") => {
  try {
    const reqRef = doc(db, "accessRequests", requestId);
    await updateDoc(reqRef, {
      status: "denied",
      denialReason: reason,
      deniedAt: new Date(),
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error denying access request:", error);
    return { error: error.message };
  }
};

// Get all users with pending notes for admin approval
export const getUsersWithPendingNotes = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("pendingNotes", "!=", []));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.pendingNotes && userData.pendingNotes.length > 0) {
        users.push({ 
          id: doc.id, 
          email: userData.email,
          displayName: userData.displayName,
          pendingNotes: userData.pendingNotes,
          ...userData 
        });
      }
    });
    
    return { users, error: null };
  } catch (error) {
    console.error("Error getting users with pending notes:", error);
    return { users: [], error: error.message };
  }
};
// Approve a note for a specific user
export const approveNoteForUser = async (userId, pendingNoteObject) => {
  try {
    const userRef = doc(db, "users", userId);
    const noteRef = doc(db, "notes", pendingNoteObject.noteId);

    // Get note data to find uploader
    const noteSnap = await getDoc(noteRef);
    if (!noteSnap.exists()) {
      throw new Error(`Note ${pendingNoteObject.noteId} not found`);
    }
    const noteData = noteSnap.data();

    // Remove the pending note object and add noteId to approved
    await updateDoc(userRef, {
      pendingNotes: arrayRemove(pendingNoteObject),
      approvedNotes: arrayUnion(pendingNoteObject.noteId),
      updatedAt: new Date()
    });

    // Reward uploader with 5 earnings
    if (noteData.uploadedBy) {
      const uploaderRef = doc(db, "users", noteData.uploadedBy);
      await updateDoc(uploaderRef, {
        earnings: increment(5),
        updatedAt: new Date()
      });
    }

    return { error: null };
  } catch (error) {
    console.error("Error approving note for user:", error);
    return { error: error.message };
  }
};

// Deny a note for a specific user
export const denyNoteForUser = async (userId, pendingNoteObject, reason = "") => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Remove the pending note object
    await updateDoc(userRef, {
      pendingNotes: arrayRemove(pendingNoteObject),
      updatedAt: new Date()
    });
    
    return { error: null };
  } catch (error) {
    console.error("Error denying note for user:", error);
    return { error: error.message };
  }
};
