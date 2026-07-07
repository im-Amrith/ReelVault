import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import ReminderRow from "./ReminderRow";
import { useAuth } from "../contexts/AuthContext";
import { getAllPendingReminders } from "../services/firestore";
import { Colors } from "../constants/colors";
import type { Reminder } from "../types/schema";

interface RemindersSectionProps {
    onSeeAll?: () => void;
}

export default function RemindersSection({ onSeeAll }: RemindersSectionProps) {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReminders = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setIsLoading(true);
            const data = await getAllPendingReminders(user.uid);
            // Show only the 3 closest upcoming reminders on the home screen
            setReminders(data.slice(0, 3));
        } catch (error) {
            console.error("Failed to fetch reminders:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    return (
        <View className="px-5 mt-8 mb-6">
            {/* Section header */}
            <View className="flex-row justify-between items-center mb-5">
                <Text className="text-white text-2xl font-bold">Reminders</Text>
                <TouchableOpacity
                    onPress={onSeeAll}
                    activeOpacity={0.7}
                    className="bg-[#1A1A1A] px-4 py-1.5 rounded-full flex-row items-center gap-1.5"
                >
                    <Text className="text-gray-300 text-xs font-semibold">
                        See All
                    </Text>
                    <Feather name="chevron-right" size={12} color="#999" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {isLoading ? (
                <View className="py-6 items-center">
                    <ActivityIndicator color={Colors.accent} size="small" />
                </View>
            ) : reminders.length > 0 ? (
                reminders.map((reminder) => (
                    <ReminderRow key={reminder.id} reminder={reminder} />
                ))
            ) : (
                <View className="bg-[#121212] rounded-2xl py-6 items-center">
                    <Feather name="check-circle" size={28} color="#333" />
                    <Text className="text-gray-500 text-sm font-medium mt-3">
                        You're all caught up for now!
                    </Text>
                </View>
            )}
        </View>
    );
}
