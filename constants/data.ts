export interface Category {
    id: string;
    title: string;
    subtitle: string;
    number: string;
    image: any;
}

export interface Reminder {
    id: string;
    title: string;
    time: string;
    completed: boolean;
    iconBg: string;
    iconEmoji: string;
}

export const CATEGORIES: Category[] = [
    {
        id: "1",
        title: "Gym",
        subtitle: "HARPER\nVale",
        number: "01",
        image: require("../assets/images/gym.jpg"),
    },
    {
        id: "2",
        title: "Cooking",
        subtitle: "HARPER\nTorres",
        number: "02",
        image: require("../assets/images/cooking.jpg"),
    },
    {
        id: "3",
        title: "Internships",
        subtitle: "HARPER\nHolloway",
        number: "03",
        image: require("../assets/images/internships.jpg"),
    },
    {
        id: "4",
        title: "Design",
        subtitle: "HARPER\nMonroe",
        number: "04",
        image: require("../assets/images/design.jpg"),
    },
];

export const REMINDERS: Reminder[] = [
    {
        id: "1",
        title: "Complete LinkedIn Post Draft",
        time: "Today, 19:00",
        completed: false,
        iconBg: "#2C2520",
        iconEmoji: "📋",
    },
    {
        id: "2",
        title: "Watch tutorial & practice",
        time: "Today, 20:30",
        completed: false,
        iconBg: "#252028",
        iconEmoji: "🎬",
    },
    {
        id: "3",
        title: "Review marketing notes",
        time: "Tomorrow, 09:00",
        completed: true,
        iconBg: "#20252C",
        iconEmoji: "📝",
    },
];

export interface Reel {
    id: string;
    thumbnail: any;
    note: string;
    duration: string;
}

const thumb1 = require("../assets/images/reel1.jpg");
const thumb2 = require("../assets/images/reel2.jpg");
const thumb3 = require("../assets/images/reel3.jpg");

export const REELS: Reel[] = [
    { id: "1", thumbnail: thumb1, note: "Focus on form", duration: "0:45" },
    { id: "2", thumbnail: thumb2, note: "Try this Tue", duration: "1:20" },
    { id: "3", thumbnail: thumb3, note: "High intensity", duration: "0:45" },
    { id: "4", thumbnail: thumb1, note: "Leg day finisher", duration: "0:45" },
    { id: "5", thumbnail: thumb2, note: "High intensity", duration: "1:20" },
    { id: "6", thumbnail: thumb3, note: "Leg day finisher", duration: "0:45" },
    { id: "7", thumbnail: thumb1, note: "Squat mechanics", duration: "0:55" },
    { id: "8", thumbnail: thumb2, note: "Cardio blast", duration: "1:10" },
    { id: "9", thumbnail: thumb3, note: "Deadlift form", duration: "2:00" },
];

// --- Search / Discovery ---

export interface SearchResult {
    id: string;
    thumbnail: any;
    title: string;
    views: string;
    duration: string;
}

export const SUGGESTED_TAGS: string[] = [
    "#carbonara",
    "#easyrecipes",
    "#lunch",
    "#vegan",
    "#quickmeals",
    "#italian",
];

const food1 = require("../assets/images/pasta1.jpg");
const food2 = require("../assets/images/pasta2.jpg");
const food3 = require("../assets/images/pasta3.jpg");

export const SEARCH_RESULTS: SearchResult[] = [
    { id: "s1", thumbnail: food1, title: "Creamy Tomato Sauce Pasta", views: "12K", duration: "0:45" },
    { id: "s2", thumbnail: food2, title: "Quick Weeknight Carbonara", views: "8.4K", duration: "1:20" },
    { id: "s3", thumbnail: food3, title: "Authentic Pasta Carbonara", views: "45K", duration: "0:45" },
    { id: "s4", thumbnail: food2, title: "Best Pasta Shapes for Sauce", views: "2.1K", duration: "0:45" },
    { id: "s5", thumbnail: food1, title: "Spicy Arrabbiata Tutorial", views: "15K", duration: "1:20" },
    { id: "s6", thumbnail: food3, title: "Homemade Pesto Pasta", views: "11K", duration: "0:45" },
];

// --- Reminders Screen ---

export interface ScreenReminder {
    id: string;
    title: string;
    time: string;
    status: "pending" | "completed";
    thumbnail: any;
    badge: string;
}

const remLinkedin = require("../assets/images/reminder_linkedin.jpg");
const remTutorial = require("../assets/images/reminder_tutorial.jpg");
const remMarketing = require("../assets/images/reminder_marketing.jpg");
const remSocial = require("../assets/images/reminder_social.jpg");
const remGym = require("../assets/images/reminder_gym.jpg");

export const SCREEN_REMINDERS: ScreenReminder[] = [
    {
        id: "r1",
        title: "Complete LinkedIn Post Draft",
        time: "TODAY, 19:00",
        status: "pending",
        thumbnail: remLinkedin,
        badge: "in",
    },
    {
        id: "r2",
        title: "Watch tutorial & practice hooks",
        time: "TODAY, 20:30",
        status: "pending",
        thumbnail: remTutorial,
        badge: "▶",
    },
    {
        id: "r3",
        title: "Review marketing notes for Q4",
        time: "TOMORROW, 09:00",
        status: "pending",
        thumbnail: remMarketing,
        badge: "▶",
    },
    {
        id: "r4",
        title: "Post for every social campaign",
        time: "TOMORROW, 14:00",
        status: "completed",
        thumbnail: remSocial,
        badge: "▶",
    },
    {
        id: "r5",
        title: "Gym Session: Leg Day Routine",
        time: "TODAY, 17:30",
        status: "completed",
        thumbnail: remGym,
        badge: "▶",
    },
];
