import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface HeaderProps {
  onAddReel?: () => void;
}

export default function Header({ onAddReel }: HeaderProps) {
  return (
    <View className="px-5 pt-2 pb-4">
      {/* Top row */}
      <View className="flex-row items-center justify-between">
        {/* Left: Icon + Greeting */}
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 bg-white rounded-xl items-center justify-center">
            <Feather name="zap" size={22} color="#000000" />
          </View>
          <Text className="text-white text-2xl font-bold">Hello, Amrithe</Text>
        </View>

        {/* Right: Add + Settings buttons */}
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity
            className="w-11 h-11 bg-accent rounded-full items-center justify-center"
            activeOpacity={0.8}
            onPress={onAddReel}
          >
            <Feather name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="w-11 h-11 bg-[#1A1A1A] rounded-full items-center justify-center">
            <Feather name="sliders" size={18} color="#A0A0A0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle */}
      <Text className="text-gray-400 text-base mt-3 ml-1">
        Let's get things done today.
      </Text>
    </View>
  );
}
