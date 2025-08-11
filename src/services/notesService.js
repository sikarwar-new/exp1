// Notes service functions for Firestore operations
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Get all approved notes for regular users
export const getAllNotes = async () => {
  try {
    const notesRef = collection(db, "notes");
    const q = query(
      notesRef,
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    return { notes, error: null };
  } catch (error) {
    console.error("Error getting notes:", error);
    return { notes: [], error: error.message };
  }
};

// Get notes by filters
export const getNotesByFilter = async (filters = {}) => {
  try {
    const notesRef = collection(db, "notes");
    let q = query(notesRef);

    // Always filter by status if provided
    if (filters.status) {
      q = query(q, where("status", "==", filters.status.trim()));
    } else {
      q = query(q, where("status", "==", "approved"));
    }

    // Apply filters safely
    if (filters.year) {
      q = query(q, where("year", "==", filters.year.trim()));
    }
    if (filters.branch) {
      q = query(q, where("branch", "==", filters.branch.trim()));
    }
    if (filters.semester) {
      q = query(q, where("semester", "==", filters.semester.trim()));
    }

    // Order results
    q = query(q, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    return { notes, error: null };
  } catch (error) {
    console.error("Error getting filtered notes:", error);
    return { notes: [], error: error.message };
  }
};

// Get user's uploaded notes
export const getUserUploadedNotes = async (userId) => {
  try {
    const notesRef = collection(db, "notes");
    const q = query(
      notesRef,
      where("uploadedBy", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    return { notes, error: null };
  } catch (error) {
    console.error("Error getting user uploaded notes:", error);
    return { notes: [], error: error.message };
  }
};

// Create a new note (for users)
export const createNote = async (noteData, userId) => {
  try {
    const notesRef = collection(db, "notes");
    const docRef = await addDoc(notesRef, {
      ...noteData,
      uploadedBy: userId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { noteId: docRef.id, error: null };
  } catch (error) {
    console.error("Error creating note:", error);
    return { noteId: null, error: error.message };
  }
};

// Update user eligibility
export const updateUserEligibility = async (userId, isEligible) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isEligible: isEligible,
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error updating user eligibility:", error);
    return { error: error.message };
  }
};

// Add purchased notes to user's pendingNotes array
export const addToPendingNotes = async (userId, noteIds, paymentId) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Create pending note objects with payment information
    const pendingNoteObjects = noteIds.map(noteId => ({
      noteId: noteId,
      paymentId: paymentId,
      purchasedAt: new Date(),
      status: 'pending'
    }));
    
    await updateDoc(userRef, {
      pendingNotes: arrayUnion(...pendingNoteObjects),
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error adding to pending notes:", error);
    return { error: error.message };
  }
};

// Get user's approved and pending notes
export const getUserNotes = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        pendingNotes: userData.pendingNotes || [],
        approvedNotes: userData.approvedNotes || [],
        earnings: userData.earnings || 0,
        error: null
      };
    }
    
    return {
      pendingNotes: [],
      approvedNotes: [],
      earnings: 0,
      error: null
    };
  } catch (error) {
    console.error("Error getting user notes:", error);
    return {
      pendingNotes: [],
      approvedNotes: [],
      earnings: 0,
      error: error.message
    };
  }
};

// Listen to user's notes in real-time
export const listenToUserNotes = (userId, callback) => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        pendingNotes: data.pendingNotes || [],
        approvedNotes: data.approvedNotes || [],
        earnings: data.earnings || 0,
      });
    } else {
      callback({
        pendingNotes: [],
        approvedNotes: [],
        earnings: 0,
      });
    }
  });
};

// Get approved notes details for profile page
export const getApprovedNotesDetails = async (noteIds = []) => {
  try {
    if (noteIds.length === 0) {
      return { notes: [], error: null };
    }

    const notes = [];
    for (const noteId of noteIds) {
      const noteRef = doc(db, "notes", noteId);
      const noteSnap = await getDoc(noteRef);
      if (noteSnap.exists()) {
        notes.push({ id: noteSnap.id, ...noteSnap.data() });
      }
    }

    return { notes, error: null };
  } catch (error) {
    console.error("Error getting approved notes details:", error);
    return { notes: [], error: error.message };
  }
};

// Check if note is in user's pending or approved notes
export const checkNoteStatus = (noteId, pendingNotes = [], approvedNotes = []) => {
  // Check if noteId is in approvedNotes array (still simple strings)
  if (approvedNotes.includes(noteId)) return 'approved';
  
  // Check if noteId exists in pendingNotes array (now objects with noteId property)
  const isPending = pendingNotes.some(pendingNote => 
    typeof pendingNote === 'object' ? pendingNote.noteId === noteId : pendingNote === noteId
  );
  if (isPending) return 'pending';
  
  return 'none';
};

export const getUserAccessedNotes = async (userId) => {
  try {
    const { approvedNotes, error } = await getUserNotes(userId);
    if (error) return { notes: [], error };

    const { notes } = await getApprovedNotesDetails(approvedNotes);
    return { notes, error: null };
  } catch (error) {
    console.error("Error getting accessed notes:", error);
    return { notes: [], error: error.message };
  }
};