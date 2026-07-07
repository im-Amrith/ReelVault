import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

interface NavItem {
    key: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    badge?: string;
}

const NAV_ITEMS: NavItem[] = [
    { key: "home", label: "Home", icon: "home" },
    { key: "search", label: "Search", icon: "search" },
    { key: "reminders", label: "Reminders", icon: "bell", badge: "9" },
    { key: "profile", label: "Profile", icon: "user" },
];

interface BottomNavBarProps {
    activeTab?: string;
    onTabPress?: (tabKey: string) => void;
}

export default function BottomNavBar({
    activeTab = "home",
    onTabPress,
}: BottomNavBarProps) {
    return (
        <View className="absolute bottom-6 left-5 right-5">
            <View className="bg-[#121212] rounded-full flex-row justify-around items-center py-3 px-4 border border-[#222]">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.key === activeTab;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            className="items-center justify-center px-3 py-1"
                            activeOpacity={0.7}
                            onPress={() => onTabPress?.(item.key)}
                        >
                            <View className="relative">
                                <Feather
                                    name={item.icon}
                                    size={22}
                                    color={isActive ? Colors.accent : Colors.textMuted}
                                />
                                {item.badge && (
                                    <View className="absolute -top-1.5 -right-2.5 bg-accent w-4 h-4 rounded-full items-center justify-center">
                                        <Text className="text-white text-[8px] font-bold">
                                            {item.badge}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                className={`text-[11px] mt-1 font-semibold ${isActive ? "text-accent" : "text-gray-500"
                                    }`}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
