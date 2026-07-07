// Firestore Schema Definitions
// TypeScript interfaces for all Firestore collections

import { Timestamp } from "firebase/firestore";

/**
 * User document in the `users` collection.
 * Created automatically upon first Google sign-in.
 */
export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    createdAt: Timestamp;
}

/**
 * Category document in the `categories` collection.
 * Groups reels together (e.g., "Gym", "Cooking").
 */
export interface Category {
    id: string;
    userId: string;
    name: string;
    coverImage: string;
    order: number;
    createdAt: Timestamp;
}

/**
 * Reel document in the `reels` collection.
 * Represents a saved Instagram Reel with notes and metadata.
 */
export interface Reel {
    id: string;
    userId: string;
    categoryId: string;
    instagramUrl: string;
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
    noteSnippet: string;
    duration: string;
    hashtags: string[];
    createdAt: Timestamp;
}

/**
 * Reminder document in the `reminders` collection.
 * Scheduled notification tied to a specific reel.
 */
export interface Reminder {
    id: string;
    userId: string;
    reelId: string;
    title: string;
    dueDate: Timestamp;
    status: "pending" | "completed";
    createdAt: Timestamp;
}
