import React from "react";
import { View, Text, Dimensions, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { Category } from "../types/schema";

const CARD_GAP = 12;
const HORIZONTAL_PADDING = 20;
const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

// Gradient pairs for categories without cover images
const GRADIENT_PALETTES: [string, string][] = [
  ["#F06543", "#C5283D"],
  ["#6C63FF", "#3F37C9"],
  ["#00B4D8", "#0077B6"],
  ["#FF9E00", "#FF6D00"],
  ["#06D6A0", "#118AB2"],
  ["#E63946", "#A8201A"],
];

interface CategoryCardProps {
  category: Category;
  reelCount?: number;
  index?: number;
}

export default function CategoryCard({
  category,
  reelCount,
  index = 0,
}: CategoryCardProps) {
  const colors = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];

  const InnerContent = () => (
    <>
      <View className="flex-row justify-between items-start z-10">
        <View className="bg-white/20 rounded-full p-2">
          <Feather name="folder" size={14} color="#FFFFFF" />
        </View>
        {reelCount !== undefined && (
          <Text className="text-[40px] font-bold text-white/15 -mt-2 -mr-1">
            {reelCount}
          </Text>
        )}
      </View>

      <View className="z-10">
        <Text className="text-white text-[22px] font-bold" numberOfLines={2}>
          {category.name}
        </Text>
        {reelCount !== undefined && (
          <Text className="text-white/60 text-xs font-medium mt-1">
            {reelCount} {reelCount === 1 ? "Reel" : "Reels"}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View
      style={{ width: cardWidth, height: 220 }}
      className="rounded-3xl overflow-hidden"
    >
      {category.coverImage ? (
        <ImageBackground
          source={{ uri: category.coverImage }}
          style={{ flex: 1, padding: 14, justifyContent: "space-between" }}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          <InnerContent />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, padding: 14, justifyContent: "space-between" }}
        >
          <InnerContent />
        </LinearGradient>
      )}
    </View>
  );
}
