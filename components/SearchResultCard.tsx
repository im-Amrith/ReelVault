import React from "react";
import { View, Text, ImageBackground, Dimensions, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { Reel } from "../types/schema";

const GRID_COLUMNS = 2;
const HORIZONTAL_PADDING = 20;
const ITEM_GAP = 12;
const screenWidth = Dimensions.get("window").width;
const cardWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS;

interface SearchResultCardProps {
    reel: Reel;
    onPlayReel?: (reel: Reel) => void;
}

export default function SearchResultCard({ reel, onPlayReel }: SearchResultCardProps) {
    return (
        <TouchableOpacity
            style={{ width: cardWidth, aspectRatio: 3 / 4, marginBottom: ITEM_GAP }}
            className="rounded-3xl overflow-hidden"
            activeOpacity={0.8}
            onPress={() => onPlayReel?.(reel)}
        >
            <ImageBackground
                source={{ uri: reel.thumbnailUrl || undefined }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={[
                        "rgba(0,0,0,0.05)",
                        "rgba(0,0,0,0.1)",
                        "rgba(0,0,0,0.7)",
                    ]}
                    style={{ flex: 1 }}
                >
                    {/* Center play button */}
                    <View className="flex-1 items-center justify-center">
                        <View className="w-14 h-14 rounded-full bg-white/25 items-center justify-center">
                            <Feather name="play" size={22} color="#FFFFFF" />
                        </View>
                    </View>

                    {/* Bottom section */}
                    <View className="px-3 pb-3">
                        {/* Title */}
                        <View className="flex-row items-start gap-1.5 mb-1.5">
                            <Feather
                                name="list"
                                size={12}
                                color="#CCCCCC"
                                style={{ marginTop: 2 }}
                            />
                            <Text
                                className="text-white text-[13px] font-bold flex-1 leading-4"
                                numberOfLines={2}
                            >
                                {reel.title || "Untitled Reel"}
                            </Text>
                        </View>

                        {/* Footer row */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-1">
                                <Feather name="play" size={10} color="#AAAAAA" />
                                <Text className="text-gray-400 text-[11px]">
                                    {reel.duration || "0:00"}
                                </Text>
                            </View>
                            <Feather name="heart" size={14} color="#666666" />
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );
}
