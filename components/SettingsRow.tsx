import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  rightText?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export default function SettingsRow({
  icon,
  title,
  rightText,
  hasToggle = false,
  toggleValue = false,
  onToggle,
  isDestructive = false,
  showChevron = true,
  isLast = false,
  onPress,
}: SettingsRowProps) {
  const iconColor = isDestructive ? Colors.accent : Colors.accent;
  const titleColor = isDestructive ? "text-accent" : "text-white";

  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-4 ${
        !isLast ? "border-b border-[#1E1E1E]" : ""
      }`}
      activeOpacity={hasToggle ? 1 : 0.7}
      onPress={onPress}
    >
      {/* Left icon */}
      <View className="w-9 h-9 rounded-full bg-[#1A1A1A] items-center justify-center">
        <Feather name={icon} size={17} color={iconColor} />
      </View>

      {/* Title */}
      <Text className={`flex-1 ml-4 text-[15px] font-medium ${titleColor}`}>
        {title}
      </Text>

      {/* Right action */}
      {hasToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: "#333", true: Colors.accent }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View className="flex-row items-center gap-1.5">
          {rightText && (
            <Text className="text-gray-500 text-sm">{rightText}</Text>
          )}
          {showChevron && (
            <Feather name="chevron-right" size={18} color="#555555" />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
