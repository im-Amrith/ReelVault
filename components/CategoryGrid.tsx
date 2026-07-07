import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import CategoryCard from "./CategoryCard";
import { Colors } from "../constants/colors";
import type { Category } from "../types/schema";

interface CategoryGridProps {
  categories: Category[];
  isLoading?: boolean;
  onCategoryPress?: (category: Category) => void;
}

export default function CategoryGrid({
  categories,
  isLoading = false,
  onCategoryPress,
}: CategoryGridProps) {
  if (isLoading) {
    return (
      <View className="px-5 mt-8 mb-4 items-center">
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="px-5 mt-6 mb-4 items-center">
        <Text className="text-gray-500 text-sm">
          No categories yet. Tap + to save your first reel!
        </Text>
      </View>
    );
  }

  return (
    <View className="px-5 mt-4">
      <View className="flex-row flex-wrap justify-between" style={{ gap: 12 }}>
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.8}
            onPress={() => onCategoryPress?.(cat)}
          >
            <CategoryCard category={cat} index={index} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
