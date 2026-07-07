// Firestore Database Service Layer
// Modular async CRUD operations for all collections.

import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Category, Reel, Reminder } from "../types/schema";

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Fetch all categories for a user, ordered by the `order` field.
 */
export async function getCategories(userId: string): Promise<Category[]> {
    const q = query(
        collection(db, "categories"),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const cats = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Category)
    );
    // Sort client-side to avoid requiring a composite index
    return cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Create a new category for a user.
 * Returns the new category's document ID.
 */
export async function createCategory(
    userId: string,
    name: string
): Promise<string> {
    const docRef = await addDoc(collection(db, "categories"), {
        userId,
        name,
        coverImage: "",
        order: Date.now(),
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

/**
 * Update an existing category document in Firestore.
 */
export async function updateCategory(
    categoryId: string,
    updates: Partial<Category>
): Promise<void> {
    const categoryRef = doc(db, "categories", categoryId);
    await updateDoc(categoryRef, updates);
}

// ─── Reels ────────────────────────────────────────────────────────────────────

/**
 * Fetch all reels belonging to a specific category.
 */
export async function getReelsByCategory(categoryId: string): Promise<Reel[]> {
    const q = query(
        collection(db, "reels"),
        where("categoryId", "==", categoryId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reel));
}

/**
 * Fetch a single reel by its ID.
 */
export async function getReelById(reelId: string): Promise<Reel | null> {
    const { getDoc, doc } = await import("firebase/firestore");
    const docRef = doc(db, "reels", reelId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Reel;
    }
    return null;
}

/**
 * Save a new reel document to Firestore.
 * Automatically sets `createdAt` to the current server timestamp.
 */
export async function saveReel(
    reelData: Omit<Reel, "id" | "createdAt">
): Promise<string> {
    const docRef = await addDoc(collection(db, "reels"), {
        ...reelData,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

/**
 * Update an existing reel document in Firestore.
 */
export async function updateReel(
    reelId: string,
    updates: Partial<Reel>
): Promise<void> {
    const reelRef = doc(db, "reels", reelId);
    await updateDoc(reelRef, updates);
}

/**
 * Delete an existing reel document from Firestore.
 */
export async function deleteReel(reelId: string): Promise<void> {
    const { deleteDoc } = await import("firebase/firestore");
    const reelRef = doc(db, "reels", reelId);
    await deleteDoc(reelRef);
}

// ─── Reminders ────────────────────────────────────────────────────────────────

/**
 * Fetch all pending reminders due today for a specific user.
 * Compares against the start and end of the current day.
 */
export async function getRemindersDueToday(
    userId: string
): Promise<Reminder[]> {
    // Calculate the start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
    );

    const q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("status", "==", "pending"),
        where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
        where("dueDate", "<=", Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );
}

/**
 * Fetch ALL reminders for today (both pending and completed).
 * Used by the Reminders screen to show split lists.
 */
export async function getRemindersToday(
    userId: string
): Promise<Reminder[]> {
    return getRemindersByDate(userId, new Date());
}

/**
 * Fetch ALL reminders for a specific date (both pending and completed).
 * Used by the Reminders screen date-strip navigation.
 */
export async function getRemindersByDate(
    userId: string,
    targetDate: Date
): Promise<Reminder[]> {
    const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
    );
    const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
        999
    );

    const q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
        where("dueDate", "<=", Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );
}


/**
 * Fetch ALL pending reminders for a user, ordered by dueDate ascending.
 * Used by the agenda-style Reminders screen.
 */
export async function getAllPendingReminders(
    userId: string
): Promise<Reminder[]> {
    const q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("status", "==", "pending"),
        orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );
}

/**
 * Fetch ALL completed reminders for a user, ordered by dueDate descending.
 */
export async function getCompletedReminders(
    userId: string
): Promise<Reminder[]> {
    const q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("status", "==", "completed"),
        orderBy("dueDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );
}


/**
 * Toggle a reminder's status between "pending" and "completed".
 */
export async function toggleReminderStatus(
    reminderId: string,
    newStatus: "pending" | "completed"
): Promise<void> {
    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, { status: newStatus });
}

/**
 * Save a new reminder to Firestore.
 */
export async function saveReminder(
    userId: string,
    title: string,
    dueDate: Date,
    reelId: string | null = null
): Promise<string> {
    const docRef = await addDoc(collection(db, "reminders"), {
        userId,
        title,
        dueDate: Timestamp.fromDate(dueDate),
        reelId: reelId ?? "",
        status: "pending",
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

/**
 * Fetch ALL reels for a user (across all categories).
 * Used for the reel-selector in the Add Reminder screen.
 */
export async function getAllUserReels(userId: string): Promise<Reel[]> {
    const q = query(
        collection(db, "reels"),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const reels = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Reel)
    );
    // Sort client-side by newest first
    return reels.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
    });
}
