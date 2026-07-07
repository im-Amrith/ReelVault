import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { saveReminder, getAllUserReels } from "../services/firestore";
import { Colors } from "../constants/colors";
import type { Reel } from "../types/schema";

interface AddReminderScreenProps {
    onClose: () => void;
}

// ── Date/Time helpers ──────────────────────────────────────────────
const MONTH_NAMES_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateCard(date: Date): string {
    return `${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatDateShort(date: Date): string {
    return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function formatTimeCard(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export default function AddReminderScreen({ onClose }: AddReminderScreenProps) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // Form state
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
    });
    const [selectedReelId, setSelectedReelId] = useState<string | null>(null);

    // Picker visibility
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Reel list
    const [reels, setReels] = useState<Reel[]>([]);
    const [reelsLoading, setReelsLoading] = useState(true);

    // Save state
    const [saving, setSaving] = useState(false);

    // ── Fetch user's reels on mount ────────────────────────────────
    useEffect(() => {
        if (user?.uid) fetchReels();
    }, [user?.uid]);

    async function fetchReels() {
        if (!user?.uid) return;
        try {
            setReelsLoading(true);
            const data = await getAllUserReels(user.uid);
            setReels(data);
        } catch (error) {
            console.error("Failed to fetch reels:", error);
        } finally {
            setReelsLoading(false);
        }
    }

    // ── Build date options (next 14 days) ──────────────────────────
    function buildDateOptions(): Date[] {
        const dates: Date[] = [];
        const now = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() + i);
            d.setHours(dueDate.getHours(), dueDate.getMinutes(), 0, 0);
            dates.push(d);
        }
        return dates;
    }

    function selectDate(date: Date) {
        const d = new Date(date);
        d.setHours(dueDate.getHours(), dueDate.getMinutes(), 0, 0);
        setDueDate(d);
        setShowDatePicker(false);
    }

    function selectTime(hours: number, minutes: number) {
        const d = new Date(dueDate);
        d.setHours(hours, minutes, 0, 0);
        setDueDate(d);
        setShowTimePicker(false);
    }

    // ── Save logic with past-time validation ───────────────────────
    async function handleSave() {
        if (!user?.uid) return;

        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter a title for the reminder.");
            return;
        }

        // Validate: don't allow past times for today
        const now = new Date();
        if (isSameDay(dueDate, now) && dueDate.getTime() < now.getTime()) {
            Alert.alert(
                "Invalid Time",
                "Please pick a future time for today's reminder."
            );
            return;
        }

        try {
            setSaving(true);
            await saveReminder(user.uid, title.trim(), dueDate, selectedReelId);
            onClose();
        } catch (error) {
            console.error("Failed to save reminder:", error);
            Alert.alert("Error", "Failed to save reminder. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    // ── Reel thumbnail card ────────────────────────────────────────
    function renderReelItem({ item }: { item: Reel }) {
        const isSelected = item.id === selectedReelId;
        const hasThumbnail = !!item.thumbnailUrl;

        return (
            <TouchableOpacity
                onPress={() =>
                    setSelectedReelId(isSelected ? null : item.id)
                }
                activeOpacity={0.8}
                style={{
                    width: 80,
                    height: 110,
                    marginRight: 10,
                    borderRadius: 14,
                    overflow: "hidden",
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? Colors.accent : "transparent",
                }}
            >
                {hasThumbnail ? (
                    <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#1A1A1A",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Feather name="film" size={20} color="#555" />
                    </View>
                )}
                {isSelected && (
                    <View
                        style={{
                            position: "absolute",
                            bottom: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: Colors.accent,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Feather name="check" size={12} color="#FFF" />
                    </View>
                )}
                <View
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 3,
                        paddingHorizontal: 5,
                        backgroundColor: "rgba(0,0,0,0.65)",
                    }}
                >
                    <Text
                        style={{ color: "#FFF", fontSize: 9, fontWeight: "600" }}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    // ── Time presets ───────────────────────────────────────────────
    const timePresets = [
        { label: "6:00 AM", h: 6, m: 0 },
        { label: "8:00 AM", h: 8, m: 0 },
        { label: "9:00 AM", h: 9, m: 0 },
        { label: "10:00 AM", h: 10, m: 0 },
        { label: "12:00 PM", h: 12, m: 0 },
        { label: "2:00 PM", h: 14, m: 0 },
        { label: "4:00 PM", h: 16, m: 0 },
        { label: "6:00 PM", h: 18, m: 0 },
        { label: "8:00 PM", h: 20, m: 0 },
        { label: "9:00 PM", h: 21, m: 0 },
        { label: "10:00 PM", h: 22, m: 0 },
        { label: "11:00 PM", h: 23, m: 0 },
    ];

    const dateOptions = buildDateOptions();
    const todayDate = new Date();

    return (
        <View className="flex-1 bg-black">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* ── Header ────────────────────────────────────────── */}
                <View 
                    className="flex-row items-center justify-between px-5 py-4 border-b border-[#1A1A1A]"
                    style={{ paddingTop: insets.top > 0 ? insets.top + 10 : 20 }}
                >
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <Text className="text-gray-400 text-base font-medium">
                            Cancel
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">
                        Add Reminder
                    </Text>
                    <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
                        {saving ? (
                            <ActivityIndicator
                                color={Colors.accent}
                                size="small"
                            />
                        ) : (
                            <Text className="text-accent text-base font-bold">
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Title Input ──────────────────────────────── */}
                    <Text className="text-gray-500 text-xs font-bold tracking-widest mb-2">
                        REMINDER TITLE
                    </Text>
                    <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 mb-6">
                        <TextInput
                            className="text-white text-[15px]"
                            placeholder="What do you need to remember?"
                            placeholderTextColor="#555"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* ── Set Schedule Label ───────────────────────── */}
                    <Text className="text-gray-500 text-xs font-bold tracking-widest mb-3">
                        SET SCHEDULE
                    </Text>

                    {/* ── Side-by-Side Date & Time Cards ───────────── */}
                    <View className="flex-row gap-3 mb-2">
                        {/* Date Card */}
                        <TouchableOpacity
                            onPress={() => {
                                setShowDatePicker(!showDatePicker);
                                setShowTimePicker(false);
                            }}
                            activeOpacity={0.8}
                            className="flex-1 bg-[#1A1A1A] rounded-2xl px-4 py-4"
                            style={{
                                borderWidth: showDatePicker ? 1 : 0,
                                borderColor: Colors.accent,
                            }}
                        >
                            <View className="flex-row items-center gap-2 mb-2">
                                <Feather
                                    name="calendar"
                                    size={14}
                                    color={Colors.accent}
                                />
                                <Text className="text-gray-400 text-[11px] font-semibold tracking-wider">
                                    DATE
                                </Text>
                            </View>
                            <Text className="text-white text-[15px] font-bold">
                                {formatDateCard(dueDate)}
                            </Text>
                        </TouchableOpacity>

                        {/* Time Card */}
                        <TouchableOpacity
                            onPress={() => {
                                setShowTimePicker(!showTimePicker);
                                setShowDatePicker(false);
                            }}
                            activeOpacity={0.8}
                            className="flex-1 bg-[#1A1A1A] rounded-2xl px-4 py-4"
                            style={{
                                borderWidth: showTimePicker ? 1 : 0,
                                borderColor: Colors.accent,
                            }}
                        >
                            <View className="flex-row items-center gap-2 mb-2">
                                <Feather
                                    name="clock"
                                    size={14}
                                    color={Colors.accent}
                                />
                                <Text className="text-gray-400 text-[11px] font-semibold tracking-wider">
                                    TIME
                                </Text>
                            </View>
                            <Text className="text-white text-[15px] font-bold">
                                {formatTimeCard(dueDate)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Date Picker Grid ─────────────────────────── */}
                    {showDatePicker && (
                        <View className="bg-[#141414] rounded-2xl p-3 mb-3">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 6 }}
                            >
                                {dateOptions.map((date) => {
                                    const isSelected = isSameDay(date, dueDate);
                                    const isToday = isSameDay(date, todayDate);

                                    return (
                                        <TouchableOpacity
                                            key={date.toISOString()}
                                            onPress={() => selectDate(date)}
                                            activeOpacity={0.8}
                                            style={{
                                                width: 56,
                                                paddingVertical: 10,
                                                borderRadius: 14,
                                                alignItems: "center",
                                                backgroundColor: isSelected
                                                    ? Colors.accent
                                                    : "#1E1E1E",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: "600",
                                                    color: isSelected
                                                        ? "#FFF"
                                                        : "#888",
                                                    marginBottom: 3,
                                                }}
                                            >
                                                {DAY_NAMES[date.getDay()]}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: "bold",
                                                    color: "#FFF",
                                                }}
                                            >
                                                {date.getDate()}
                                            </Text>
                                            {isToday && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor:
                                                            isSelected
                                                                ? "#FFF"
                                                                : Colors.accent,
                                                        marginTop: 3,
                                                    }}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Time Picker Grid ─────────────────────────── */}
                    {showTimePicker && (
                        <View className="bg-[#141414] rounded-2xl p-3 mb-3">
                            <View className="flex-row flex-wrap gap-2">
                                {timePresets.map((t) => {
                                    const isActive =
                                        dueDate.getHours() === t.h &&
                                        dueDate.getMinutes() === t.m;
                                    return (
                                        <TouchableOpacity
                                            key={t.label}
                                            onPress={() =>
                                                selectTime(t.h, t.m)
                                            }
                                            activeOpacity={0.8}
                                            style={{
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                                borderRadius: 12,
                                                backgroundColor: isActive
                                                    ? Colors.accent
                                                    : "#1E1E1E",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: "600",
                                                    color: isActive
                                                        ? "#FFF"
                                                        : "#CCC",
                                                }}
                                            >
                                                {t.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ── Link to Reel (Optional) ─────────────────── */}
                    <Text className="text-gray-500 text-xs font-bold tracking-widest mt-5 mb-3">
                        LINK TO REEL (OPTIONAL)
                    </Text>

                    {reelsLoading ? (
                        <ActivityIndicator
                            color={Colors.accent}
                            style={{ marginVertical: 16 }}
                        />
                    ) : reels.length > 0 ? (
                        <FlatList
                            data={reels}
                            keyExtractor={(item) => item.id}
                            renderItem={renderReelItem}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 4 }}
                            scrollEnabled={true}
                        />
                    ) : (
                        <View className="bg-[#1A1A1A] rounded-2xl py-5 items-center">
                            <Feather name="film" size={24} color="#444" />
                            <Text className="text-gray-500 text-sm mt-2">
                                No reels saved yet
                            </Text>
                        </View>
                    )}

                    {selectedReelId && (
                        <TouchableOpacity
                            onPress={() => setSelectedReelId(null)}
                            activeOpacity={0.7}
                            className="flex-row items-center mt-3 self-start"
                        >
                            <Feather name="x" size={14} color={Colors.accent} />
                            <Text className="text-accent text-xs font-semibold ml-1">
                                Unlink reel
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
