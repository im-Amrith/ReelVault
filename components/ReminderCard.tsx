import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { getReelById } from "../services/firestore";
import type { Reminder } from "../types/schema";

interface ReminderCardProps {
    reminder: Reminder;
    onToggle?: (reminderId: string, newStatus: "pending" | "completed") => void;
    isToggling?: boolean;
}

/**
 * Format a Firestore Timestamp into a readable time string.
 * Shows 12-hour time (e.g. "5:30 PM") for today, "TOMORROW, 5:30 PM" for
 * tomorrow, or "APR 12, 5:30 PM" for other dates.
 */
function formatDueDate(dueDate: any): string {
    try {
        const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
        const now = new Date();

        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        const h = hours % 12 || 12;
        const timeStr = `${h}:${minutes} ${ampm}`;

        const isToday =
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();

        if (isToday) return timeStr;

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow =
            date.getFullYear() === tomorrow.getFullYear() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getDate() === tomorrow.getDate();

        if (isTomorrow) return `TOMORROW, ${timeStr}`;

        const monthNames = [
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
        ];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
    } catch {
        return "";
    }
}

export default function ReminderCard({
    reminder,
    onToggle,
    isToggling,
}: ReminderCardProps) {
    const isCompleted = reminder.status === "completed";
    const timeLabel = formatDueDate(reminder.dueDate);
    const [linkedReelTitle, setLinkedReelTitle] = useState<string | null>(null);

    useEffect(() => {
        if (reminder.reelId) {
            getReelById(reminder.reelId)
                .then((reel) => {
                    if (reel) setLinkedReelTitle(reel.title);
                })
                .catch((err) => console.log("Failed to load linked reel:", err));
        }
    }, [reminder.reelId]);

    const handleToggle = () => {
        if (isToggling || !onToggle) return;
        const newStatus = isCompleted ? "pending" : "completed";
        onToggle(reminder.id, newStatus);
    };

    return (
        <View className="bg-[#121212] rounded-3xl flex-row items-center p-4 mx-5 mb-3">
            {/* Left icon area */}
            <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{
                    backgroundColor: isCompleted
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(240, 101, 67, 0.12)",
                }}
            >
                <Feather
                    name={isCompleted ? "check-circle" : "bell"}
                    size={22}
                    color={isCompleted ? "#555" : Colors.accent}
                />
            </View>

            {/* Middle text */}
            <View className="flex-1 ml-4 mr-3">
                <Text
                    className={`text-[15px] font-bold leading-5 ${
                        isCompleted
                            ? "text-gray-500 line-through"
                            : "text-white"
                    }`}
                    numberOfLines={2}
                >
                    {reminder.title}
                </Text>
                {timeLabel ? (
                    <View className="flex-row items-center mt-1.5 gap-1.5">
                        <Feather
                            name="clock"
                            size={12}
                            color={isCompleted ? "#555" : Colors.textSecondary}
                        />
                        <Text
                            className={`text-xs font-medium ${
                                isCompleted ? "text-gray-600" : "text-gray-400"
                            }`}
                        >
                            {timeLabel}
                        </Text>
                    </View>
                ) : null}
                {linkedReelTitle ? (
                    <View className="flex-row items-center mt-1 gap-1.5">
                        <Feather
                            name="link"
                            size={12}
                            color={isCompleted ? "#555" : Colors.accent}
                        />
                        <Text
                            className={`text-[11px] font-medium ${
                                isCompleted ? "text-gray-600" : "text-accent"
                            }`}
                            numberOfLines={1}
                        >
                            {linkedReelTitle}
                        </Text>
                    </View>
                ) : null}
            </View>

            {/* Right checkbox — tappable */}
            <TouchableOpacity
                onPress={handleToggle}
                activeOpacity={0.6}
                disabled={isToggling}
                className="w-8 h-8 items-center justify-center"
            >
                {isToggling ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                ) : isCompleted ? (
                    <View className="w-7 h-7 rounded-full bg-accent items-center justify-center">
                        <Feather name="check" size={15} color="#FFFFFF" />
                    </View>
                ) : (
                    <View className="w-7 h-7 rounded-full border-2 border-gray-500" />
                )}
            </TouchableOpacity>
        </View>
    );
}
