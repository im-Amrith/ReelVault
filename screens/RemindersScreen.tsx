import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    SectionList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import ReminderCard from "../components/ReminderCard";
import BottomNavBar from "../components/BottomNavBar";
import { useAuth } from "../contexts/AuthContext";
import {
    getAllPendingReminders,
    getCompletedReminders,
    toggleReminderStatus,
} from "../services/firestore";
import { Colors } from "../constants/colors";
import type { Reminder } from "../types/schema";

interface RemindersScreenProps {
    onTabPress?: (tabKey: string) => void;
    onAddReminder?: () => void;
    refreshKey?: number;
}

// ── Date helpers ──────────────────────────────────────────────────
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatSectionDate(date: Date): string {
    const now = new Date();
    if (isSameDay(date, now)) return "Today";

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(date, tomorrow)) return "Tomorrow";

    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Convert a flat reminder array into SectionList-compatible sections. */
function groupByDate(
    reminders: Reminder[]
): { title: string; data: Reminder[] }[] {
    const map = new Map<string, { date: Date; items: Reminder[] }>();

    for (const reminder of reminders) {
        const d = reminder.dueDate?.toDate
            ? reminder.dueDate.toDate()
            : new Date(reminder.dueDate as any);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

        if (!map.has(key)) {
            map.set(key, { date: d, items: [] });
        }
        map.get(key)!.items.push(reminder);
    }

    // Already sorted by dueDate asc from Firestore, but ensure section order
    const sections = Array.from(map.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
    );

    return sections.map((s) => ({
        title: formatSectionDate(s.date),
        data: s.items,
    }));
}

export default function RemindersScreen({
    onTabPress,
    onAddReminder,
    refreshKey,
}: RemindersScreenProps) {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"pending" | "completed">("pending");

    // ── Fetch all pending or completed reminders ────────────────────────────────
    const fetchReminders = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setIsLoading(true);
            const data = viewMode === "pending"
                ? await getAllPendingReminders(user.uid)
                : await getCompletedReminders(user.uid);
            setReminders(data);
        } catch (error) {
            console.error("Failed to fetch reminders:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid, viewMode]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders, refreshKey]);

    // ── Toggle handler ─────────────────────────────────────────────
    const handleToggle = async (
        reminderId: string,
        newStatus: "pending" | "completed"
    ) => {
        // Optimistic: remove from list immediately (it's no longer pending)
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        setTogglingIds((prev) => new Set(prev).add(reminderId));

        try {
            await toggleReminderStatus(reminderId, newStatus);
        } catch (error) {
            console.error("Toggle failed, refetching:", error);
            // On failure, refetch to restore accurate state
            fetchReminders();
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(reminderId);
                return next;
            });
        }
    };

    // ── Group into sections ────────────────────────────────────────
    const sections = useMemo(() => groupByDate(reminders), [reminders]);

    const totalPending = reminders.length;

    return (
        <View className="flex-1 bg-black">
            {/* ── Top Header ────────────────────────────────────────── */}
            <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center">
                        <Feather name="zap" size={20} color="#000000" />
                    </View>
                    <Text className="text-white text-xl font-bold">
                        Reminders
                    </Text>
                </View>
                <TouchableOpacity
                    className="w-10 h-10 bg-accent rounded-full items-center justify-center"
                    activeOpacity={0.7}
                    onPress={onAddReminder}
                >
                    <Feather name="plus" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* ── Upcoming label & Segmented Control ───────────────────────────── */}
            <View className="px-5 mt-4 mb-2">
                <Text className="text-white text-3xl font-bold">Reminders</Text>

                {/* Segmented Control */}
                <View className="flex-row bg-[#1A1A1A] rounded-xl p-1 mt-4 mb-2">
                    <TouchableOpacity
                        className={`flex-1 py-2 rounded-lg items-center ${viewMode === "pending" ? "bg-accent" : "bg-transparent"}`}
                        onPress={() => setViewMode("pending")}
                    >
                        <Text className={`text-sm font-bold ${viewMode === "pending" ? "text-white" : "text-gray-400"}`}>
                            Upcoming
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-2 rounded-lg items-center ${viewMode === "completed" ? "bg-[#333]" : "bg-transparent"}`}
                        onPress={() => setViewMode("completed")}
                    >
                        <Text className={`text-sm font-bold ${viewMode === "completed" ? "text-white" : "text-gray-400"}`}>
                            Completed
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center mt-2 gap-3">
                    <View className="bg-[#F06543]/20 px-2.5 py-1 rounded-md">
                        <Text className="text-accent text-xs font-bold">
                            {totalPending} {viewMode === "pending" ? "Pending" : "Completed"}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <Feather name="list" size={13} color="#888888" />
                        <Text className="text-gray-400 text-sm">
                            All dates
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── Main content ──────────────────────────────────────── */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.accent} />
                </View>
            ) : sections.length > 0 ? (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    stickySectionHeadersEnabled={true}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    renderSectionHeader={({ section: { title } }) => (
                        <View
                            className="px-5 pt-5 pb-3"
                            style={{ backgroundColor: "#000000" }}
                        >
                            <View className="flex-row items-center gap-2.5">
                                <View
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor:
                                            title === "Today"
                                                ? Colors.accent
                                                : "#333",
                                    }}
                                />
                                <Text
                                    className="text-lg font-bold"
                                    style={{
                                        color:
                                            title === "Today"
                                                ? Colors.accent
                                                : "#FFFFFF",
                                    }}
                                >
                                    {title}
                                </Text>
                            </View>
                            <View
                                className="mt-2"
                                style={{
                                    height: 1,
                                    backgroundColor: "#1A1A1A",
                                }}
                            />
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <ReminderCard
                            reminder={item}
                            onToggle={handleToggle}
                            isToggling={togglingIds.has(item.id)}
                        />
                    )}
                />
            ) : (
                <View className="flex-1 items-center justify-center">
                    <Feather name={viewMode === "pending" ? "inbox" : "check-circle"} size={48} color="#333" />
                    <Text className="text-gray-400 text-lg font-semibold mt-5">
                        {viewMode === "pending" ? "No upcoming reminders" : "No completed reminders"}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1.5 text-center px-10">
                        {viewMode === "pending" ? "Tap the + button to create your first reminder" : "Check off a reminder to see it here"}
                    </Text>
                </View>
            )}

            <BottomNavBar activeTab="reminders" onTabPress={onTabPress} />
        </View>
    );
}
