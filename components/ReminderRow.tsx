import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import type { Reminder } from "../types/schema";

interface ReminderRowProps {
    reminder: Reminder;
}

/** Format dueDate into a readable label like "5:30 PM" or "Tomorrow, 9:00 AM" */
function formatDueLabel(dueDate: any): string {
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
        if (isToday) return `Today, ${timeStr}`;

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow =
            date.getFullYear() === tomorrow.getFullYear() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getDate() === tomorrow.getDate();
        if (isTomorrow) return `Tomorrow, ${timeStr}`;

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        return `${months[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
    } catch {
        return "";
    }
}

export default function ReminderRow({ reminder }: ReminderRowProps) {
    const timeLabel = formatDueLabel(reminder.dueDate);

    return (
        <View className="bg-[#121212] rounded-2xl flex-row items-center px-4 py-4 mb-3">
            {/* Left icon */}
            <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "rgba(240, 101, 67, 0.12)" }}
            >
                <Feather name="bell" size={20} color={Colors.accent} />
            </View>

            {/* Middle text */}
            <View className="flex-1 mr-3">
                <Text
                    className="text-[15px] font-semibold text-white"
                    numberOfLines={1}
                >
                    {reminder.title}
                </Text>
                {timeLabel ? (
                    <View className="flex-row items-center mt-1.5 gap-1.5">
                        <Feather
                            name="clock"
                            size={12}
                            color={Colors.textSecondary}
                        />
                        <Text className="text-xs text-gray-400">
                            {timeLabel}
                        </Text>
                    </View>
                ) : null}
            </View>

            {/* Right indicator */}
            <View className="w-8 h-8 rounded-full border-2 border-[#333]" />
        </View>
    );
}
