import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Modal, TextInput, ImageBackground, Image, Platform, KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import ReelThumbnail from "../components/ReelThumbnail";
import BottomNavBar from "../components/BottomNavBar";
import { getReelsByCategory, updateCategory } from "../services/firestore";
import { Colors } from "../constants/colors";
import type { Reel, Category } from "../types/schema";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CategoryScreenProps {
  category: Category;
  onBack?: () => void;
  onTabPress?: (tabKey: string) => void;
  onPlayReel?: (reel: Reel) => void;
  onCategoryUpdated?: (category: Category) => void;
}

export default function CategoryScreen({
  category,
  onBack,
  onTabPress,
  onPlayReel,
  onCategoryUpdated
}: CategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Category State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editCover, setEditCover] = useState(category.coverImage || "");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    fetchReels();
  }, [category.id]);

  async function fetchReels() {
    try {
      setIsLoading(true);
      const data = await getReelsByCategory(category.id);
      setReels(data);
    } catch (error) {
      console.error("Failed to fetch reels:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const sourceUri = result.assets[0].uri;
      try {
        const filename = sourceUri.split('/').pop() || `cover_${Date.now()}.jpg`;
        const destPath = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({ from: sourceUri, to: destPath });
        setEditCover(destPath);
      } catch (e) {
        setEditCover(sourceUri); 
      }
    }
  };

  const handleSaveCategory = async () => {
    try {
      setIsSavingCategory(true);
      const updates = { name: editName, coverImage: editCover };
      await updateCategory(category.id, updates);
      if (onCategoryUpdated) {
        onCategoryUpdated({ ...category, ...updates });
      }
      setIsEditModalVisible(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const reelCount = reels.length;

  const ListHeader = () => (
    <View className="mb-4">
      {category.coverImage ? (
        <ImageBackground 
          source={{ uri: category.coverImage }} 
          className="w-full h-56 justify-end pb-4" 
          imageStyle={{ opacity: 0.4 }}
        >
          <View className="flex-row items-center justify-between px-5 absolute top-0 w-full z-10" style={{ paddingTop: insets.top > 0 ? insets.top + 10 : 20 }}>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} className="bg-black/30 p-2 rounded-full">
                <Feather name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold shadow-sm">{category.name}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="bg-black/30 p-2 rounded-full">
                <Feather name="edit-2" size={18} color="#FFF" />
              </TouchableOpacity>
              <View className="bg-black/40 rounded-full px-3.5 py-1.5">
                <Text className="text-white text-xs font-semibold">
                  {reelCount} Reels
                </Text>
              </View>
            </View>
          </View>

          <View className="px-5 mt-10">
            <Text className="text-white text-5xl font-bold shadow-sm">{category.name}</Text>
            <Text className="text-white/80 text-base mt-1.5 shadow-sm">
              {reelCount} {reelCount === 1 ? "Reel" : "Reels"} found
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <View>
          <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                <Feather name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold">{category.name}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="bg-white/10 p-2 rounded-full">
                <Feather name="edit-2" size={16} color="#FFF" />
              </TouchableOpacity>
              <View className="bg-[#1A1A1A] rounded-full px-3.5 py-1.5">
                <Text className="text-gray-300 text-xs font-semibold">
                  {reelCount} Reels
                </Text>
              </View>
            </View>
          </View>

          <View className="px-5 mb-2 mt-4">
            <Text className="text-white text-5xl font-bold">{category.name}</Text>
            <Text className="text-gray-400 text-base mt-1.5">
              {reelCount} {reelCount === 1 ? "Reel" : "Reels"} found in this category
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const ListEmpty = () =>
    !isLoading ? (
      <View className="items-center mt-12">
        <Feather name="film" size={48} color="#333" />
        <Text className="text-gray-500 text-base mt-4">No reels yet</Text>
        <Text className="text-gray-600 text-sm mt-1">
          Tap + on the Home screen to add one!
        </Text>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-black">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ListHeader />
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => <ReelThumbnail reel={item} onPlayReel={onPlayReel} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          columnWrapperStyle={
            reels.length > 0
              ? { justifyContent: "space-between" }
              : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <BottomNavBar activeTab="home" onTabPress={onTabPress} />

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.85)" }]} />
          
          <View style={[styles.modalContent, { marginTop: insets.top + 40, marginBottom: insets.bottom + 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.inputLabel}>Cover Image</Text>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imagePickerBtn}>
                {editCover ? (
                  <>
                    <Image source={{ uri: editCover }} style={styles.previewImage} />
                    <View style={styles.imagePickerOverlay}>
                      <Feather name="camera" size={24} color="#FFF" />
                      <Text style={styles.imagePickerText}>Change Cover</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePickerEmpty}>
                    <Feather name="image" size={32} color="#666" />
                    <Text style={styles.imagePickerTextEmpty}>Select Cover Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.saveButton, isSavingCategory && { opacity: 0.7 }]} 
              onPress={handleSaveCategory}
              disabled={isSavingCategory}
            >
              {isSavingCategory ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Save Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  modalCloseBtn: {
    padding: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  modalScroll: {
    flex: 1,
  },
  inputLabel: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  imagePickerBtn: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 5,
  },
  imagePickerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 16,
    margin: 2,
  },
  imagePickerTextEmpty: {
    color: "#888",
    marginTop: 10,
    fontSize: 14,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    color: "#FFF",
    fontWeight: "bold",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#00C278",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
