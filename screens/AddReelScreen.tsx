import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import {
  getCategories,
  createCategory,
  saveReel,
} from "../services/firestore";
import type { Category } from "../types/schema";
import { Colors } from "../constants/colors";
import { fetchInstagramData, generateGroqSummary } from "../services/api";

interface AddReelScreenProps {
  onClose: () => void;
  sharedUrl?: string;
}

export default function AddReelScreen({ onClose, sharedUrl }: AddReelScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Form state
  const [instagramUrl, setInstagramUrl] = useState("");
  const [title, setTitle] = useState("");
  const [noteSnippet, setNoteSnippet] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [autoFetching, setAutoFetching] = useState(false);
  const [autoThumbnail, setAutoThumbnail] = useState("");
  const [autoVideoUrl, setAutoVideoUrl] = useState("");
  const [autoCaption, setAutoCaption] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  // ── Auto-fill from share intent ───────────────────────────────────────────
  useEffect(() => {
    if (sharedUrl) {
      const cleaned = cleanInstagramUrl(sharedUrl);
      setInstagramUrl(cleaned);

      // Auto-fetch in background
      (async () => {
        try {
          setAutoFetching(true);
          const apiData = await fetchInstagramData(cleaned);
          if (apiData.videoUrl) setAutoVideoUrl(apiData.videoUrl);
          if (apiData.captionText) setAutoCaption(apiData.captionText);
          if (apiData.thumbnailUrl) {
            setAutoThumbnail(apiData.thumbnailUrl);
          } else {
            const thumb = await fetchThumbnail(cleaned);
            if (thumb) setAutoThumbnail(thumb);
          }
        } catch (error) {
          console.log("Auto-fetch failed (non-blocking):", error);
        } finally {
          setAutoFetching(false);
        }
      })();
    }
  }, [sharedUrl]);

  // ── Fetch categories on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (user?.uid) {
      fetchCategories();
    }
  }, [user?.uid]);

  async function fetchCategories() {
    if (!user?.uid) return;
    try {
      setLoadingCategories(true);
      const cats = await getCategories(user.uid);
      setCategories(cats);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }

  // ── Create a new category ─────────────────────────────────────────────────
  async function handleCreateCategory() {
    if (!user?.uid || !newCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const newId = await createCategory(user.uid, newCategoryName.trim());
      setNewCategoryName("");
      await fetchCategories();
      setSelectedCategoryId(newId);
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setCreatingCategory(false);
    }
  }

  // ── Clean Instagram URL (strip tracking params) ────────────────────────────
  function cleanInstagramUrl(dirtyUrl: string): string {
    return dirtyUrl.trim().split("?")[0];
  }

  // ── Fetch OpenGraph thumbnail from Instagram URL ───────────────────────────
  async function fetchThumbnail(url: string): Promise<string> {
    if (!url) return "";
    try {
      const response = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      if (data.status === "success" && data.data?.image?.url) {
        return data.data.image.url;
      } else {
        console.log("Microlink failed to parse:", data);
        return "";
      }
    } catch (e) {
      console.log("Thumbnail fetch error:", e);
      return "";
    }
  }

  // ── Auto Summarize ────────────────────────────────────────────────────────
  async function handleSummarize() {
    if (!instagramUrl) {
      Alert.alert("Missing URL", "Please enter an Instagram link first.");
      return;
    }
    try {
      setIsSummarizing(true);
      const finalUrl = cleanInstagramUrl(instagramUrl);
      
      let captionToUse = autoCaption;
      
      // If we don't have the caption yet (e.g., manual paste)
      if (!captionToUse) {
        const apiData = await fetchInstagramData(finalUrl);
        if (apiData.videoUrl) setAutoVideoUrl(apiData.videoUrl);
        if (apiData.thumbnailUrl) setAutoThumbnail(apiData.thumbnailUrl);
        if (apiData.captionText) {
          setAutoCaption(apiData.captionText);
          captionToUse = apiData.captionText;
        }
      }

      if (!captionToUse) {
        Alert.alert("No Caption Found", "We couldn't detect a text caption on this reel to summarize.");
        setIsSummarizing(false);
        return;
      }

      const summary = await generateGroqSummary(captionToUse);
      setNoteSnippet((prev) => (prev ? prev + "\n\n" + summary : summary));
    } catch (error: any) {
      Alert.alert("Summarization Failed", error.message || "Failed to generate summary.");
      console.error(error);
    } finally {
      setIsSummarizing(false);
    }
  }

  // ── Save reel ─────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user?.uid) return;

    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for the reel.");
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert(
        "No Category",
        "Please select or create a category first."
      );
      return;
    }

    try {
      setSaving(true);

      // Clean URL and fetch Instagram data via RapidAPI
      const finalUrl = cleanInstagramUrl(instagramUrl);

      // Use pre-fetched data if available (from share intent auto-fetch)
      let videoUrl = autoVideoUrl;
      let thumbnailUrl = autoThumbnail;

      if (!videoUrl && !thumbnailUrl) {
        const apiData = await fetchInstagramData(finalUrl);
        videoUrl = apiData.videoUrl;
        thumbnailUrl = apiData.thumbnailUrl;
      }

      // Fall back to Microlink for thumbnail if API didn't return one
      if (!thumbnailUrl) {
        thumbnailUrl = await fetchThumbnail(finalUrl);
      }

      const tagsArray = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      await saveReel({
        userId: user.uid,
        categoryId: selectedCategoryId,
        instagramUrl: finalUrl,
        videoUrl,
        thumbnailUrl,
        title: title.trim(),
        noteSnippet: noteSnippet.trim(),
        duration: "",
        hashtags: tagsArray,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save reel:", error);
      Alert.alert("Error", "Failed to save reel. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header: Cancel / Title / Save ─────────────────────────── */}
        <View 
          className="flex-row items-center justify-between px-5 py-4 border-b border-[#1A1A1A]"
          style={{ paddingTop: insets.top > 0 ? insets.top + 10 : 20 }}
        >
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text className="text-gray-400 text-base font-medium">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Add Reel</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            {saving ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text className="text-accent text-base font-bold">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── URL Input ────────────────────────────────────────── */}
          <Text className="text-gray-500 text-xs font-bold tracking-widest mb-2">
            INSTAGRAM URL
          </Text>
          <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 flex-row items-center mb-5">
            <Feather name="link" size={16} color="#666" />
            <TextInput
              className="flex-1 text-white text-[15px] ml-3"
              placeholder="Paste reel link here..."
              placeholderTextColor="#555"
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {/* ── Title Input ──────────────────────────────────────── */}
          <Text className="text-gray-500 text-xs font-bold tracking-widest mb-2">
            TITLE
          </Text>
          <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 mb-5">
            <TextInput
              className="text-white text-[15px]"
              placeholder="Give your reel a title..."
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ── Notes Area ────────────────────────────────────────── */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-500 text-xs font-bold tracking-widest">
              NOTES
            </Text>
            <TouchableOpacity onPress={handleSummarize} disabled={isSummarizing} className="flex-row items-center bg-[#2A2A2A] px-2.5 py-1.5 rounded-lg border border-[#333]">
              {isSummarizing ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Text className="text-accent text-[11px] font-bold">✨ AUTO-SUMMARIZE</Text>
              )}
            </TouchableOpacity>
          </View>
          <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 mb-5">
            <TextInput
              className="text-white text-[15px]"
              placeholder="Add your notes, key takeaways..."
              placeholderTextColor="#555"
              value={noteSnippet}
              onChangeText={setNoteSnippet}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* ── Tags Input ────────────────────────────────────────── */}
          <Text className="text-gray-500 text-xs font-bold tracking-widest mb-2">
            TAGS (comma separated)
          </Text>
          <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 mb-5">
            <TextInput
              className="text-white text-[15px]"
              placeholder="e.g. gym, tips, workout..."
              placeholderTextColor="#555"
              value={hashtags}
              onChangeText={setHashtags}
            />
          </View>

          {/* ── Category Selector ─────────────────────────────────── */}
          <Text className="text-gray-500 text-xs font-bold tracking-widest mb-3">
            CATEGORY
          </Text>

          {loadingCategories ? (
            <ActivityIndicator
              color={Colors.accent}
              style={{ marginBottom: 16 }}
            />
          ) : categories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    activeOpacity={0.8}
                    className={`px-5 py-2.5 rounded-full ${
                      isSelected ? "bg-accent" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text className="text-gray-600 text-sm mb-3">
              No categories yet — create one below.
            </Text>
          )}

          {/* ── Create New Category ───────────────────────────────── */}
          <View className="bg-[#1A1A1A] rounded-2xl px-4 py-2 flex-row items-center">
            <Feather name="folder-plus" size={16} color="#666" />
            <TextInput
              className="flex-1 text-white text-[15px] ml-3"
              placeholder="New category name..."
              placeholderTextColor="#555"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TouchableOpacity
              onPress={handleCreateCategory}
              activeOpacity={0.7}
              disabled={!newCategoryName.trim() || creatingCategory}
              className="bg-accent/20 rounded-full px-3 py-1.5"
            >
              {creatingCategory ? (
                <ActivityIndicator color={Colors.accent} size="small" />
              ) : (
                <Text className="text-accent text-xs font-bold">Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
