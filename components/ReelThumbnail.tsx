import React from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { Reel } from "../types/schema";

const GRID_COLUMNS = 3;
const HORIZONTAL_PADDING = 20;
const ITEM_GAP = 8;
const screenWidth = Dimensions.get("window").width;
const cardWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

interface ReelThumbnailProps {
  reel: Reel;
  onPlayReel?: (reel: Reel) => void;
}

export default function ReelThumbnail({ reel, onPlayReel }: ReelThumbnailProps) {
  const hasThumbnail = !!reel.thumbnailUrl;

  const handlePress = () => {
    // If we have a direct video URL, open the in-app player
    if (reel.videoUrl && onPlayReel) {
      onPlayReel(reel);
      return;
    }
    // Fallback: open Instagram in the browser
    if (reel.instagramUrl) {
      Linking.openURL(reel.instagramUrl).catch((err) =>
        console.warn("Failed to open URL:", err)
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={{
        width: cardWidth,
        aspectRatio: 9 / 16,
        marginBottom: ITEM_GAP,
      }}
      className="rounded-2xl overflow-hidden"
    >
      {/* Background: thumbnail image or dark fallback */}
      {hasThumbnail ? (
        <Image
          source={{ uri: reel.thumbnailUrl }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{ position: "absolute", width: "100%", height: "100%" }}
          className="bg-[#1A1A1A]"
        />
      )}

      {/* Gradient overlay for readability */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.05)",
          "rgba(0,0,0,0.15)",
          "rgba(0,0,0,0.75)",
        ]}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Center play button */}
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mb-2">
          <Feather name="play" size={20} color="#FFFFFF" />
        </View>

        {/* Title (only show if no thumbnail, to keep image cards clean) */}
        {!hasThumbnail && (
          <Text
            className="text-white text-[11px] font-bold text-center px-2"
            numberOfLines={2}
          >
            {reel.title}
          </Text>
        )}

        {/* Bottom section */}
        <View className="absolute bottom-2.5 left-2.5 right-2.5">
          {/* Note pill */}
          {reel.noteSnippet ? (
            <View className="bg-black/50 rounded-full flex-row items-center px-2.5 py-1.5 mb-1.5 self-start max-w-full">
              <Feather
                name="file-text"
                size={10}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text
                className="text-white text-[10px] font-medium"
                numberOfLines={1}
              >
                {reel.noteSnippet}
              </Text>
            </View>
          ) : null}

          {/* Duration + title at bottom */}
          <View className="flex-row items-center justify-between">
            {reel.duration ? (
              <View className="flex-row items-center gap-1">
                <Feather name="play" size={9} color="#CCCCCC" />
                <Text className="text-gray-300 text-[10px] font-medium">
                  {reel.duration}
                </Text>
              </View>
            ) : null}
            {hasThumbnail && (
              <Text
                className="text-white text-[10px] font-bold flex-1 text-right ml-1"
                numberOfLines={1}
              >
                {reel.title}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
