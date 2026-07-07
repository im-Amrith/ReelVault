import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
  Text,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import type { Reel, Category } from "../types/schema";
import { updateReel, deleteReel, getCategories } from "../services/firestore";

interface PlayReelScreenProps {
  reel: Reel;
  onClose: () => void;
  isActive: boolean;
  onReelUpdated?: (updatedReel: Reel) => void;
}

export default function PlayReelScreen({
  reel: initialReel,
  onClose,
  isActive,
  onReelUpdated,
}: PlayReelScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [reel, setReel] = useState(initialReel);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(reel.title);
  const [editNote, setEditNote] = useState(reel.noteSnippet);
  const [editHashtags, setEditHashtags] = useState(reel.hashtags?.join(", ") || "");
  const [editCategoryId, setEditCategoryId] = useState(reel.categoryId);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);

  const player = useVideoPlayer(reel.videoUrl || "", (player) => {
    player.loop = true;
    player.play();
  });

  // Animated opacity for the centered play/pause icon
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;

  // Fetch categories when edit modal is opened
  useEffect(() => {
    if (isEditModalVisible && user?.uid && categories.length === 0) {
      getCategories(user.uid).then(setCategories).catch(console.error);
    }
  }, [isEditModalVisible, user?.uid]);

  useEffect(() => {
    if (isActive && !isEditModalVisible) {
      setIsPlaying(true);
      player.play();
      iconOpacity.setValue(0);
    } else {
      setIsPlaying(false);
      player.pause();
    }
  }, [isActive, isEditModalVisible, player]);

  const handleTap = useCallback(() => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    iconOpacity.setValue(1);
    iconScale.setValue(0.6);

    if (nextPlaying) {
      player.play();
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1.1, friction: 4, useNativeDriver: true }),
      ]).start();
    } else {
      player.pause();
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  }, [isPlaying, iconOpacity, iconScale, player]);

  const openInstagram = () => {
    if (reel.instagramUrl) {
      Linking.openURL(reel.instagramUrl).catch((err) =>
        console.warn("Failed to open URL:", err)
      );
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    player.pause();
    onClose();
  };
  
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const hashtagsArray = editHashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const updates = {
        title: editTitle,
        noteSnippet: editNote,
        hashtags: hashtagsArray,
        categoryId: editCategoryId,
      };
      await updateReel(reel.id, updates);
      
      const updatedReel = { ...reel, ...updates };
      setReel(updatedReel);
      if (onReelUpdated) {
        onReelUpdated(updatedReel);
      }
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save changes.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReel = () => {
    Alert.alert(
      "Delete Reel",
      "Are you sure you want to permanently delete this reel? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteReel(reel.id);
              setIsEditModalVisible(false);
              // Call onReelUpdated with something to signify deletion, 
              // or just rely on the parent screen to refresh.
              // Closing the player will trigger a refresh in App.tsx typically.
              onClose(); 
            } catch (error) {
              Alert.alert("Error", "Failed to delete reel.");
              console.error(error);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={!isEditModalVisible} />

      {/* ── Tappable video area ────────────────────────────────── */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={styles.video}
            nativeControls={false}
            contentFit="contain"
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.iconOverlay,
              { opacity: iconOpacity, transform: [{ scale: iconScale }] },
            ]}
          >
            <View style={styles.iconCircle}>
              <Feather
                name={isPlaying ? "play" : "pause"}
                size={44}
                color="#FFFFFF"
                style={isPlaying ? { marginLeft: 5 } : undefined}
              />
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* ── Bottom Control Bar ──────────────────────────────────── */}
      <View style={[styles.bottomControlBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
        <View style={styles.controlBarContent}>
          <TouchableOpacity onPress={handleTap} activeOpacity={0.7} style={styles.controlButton}>
            <Feather name={isPlaying ? "pause" : "play"} size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 15 }}>
            <Text style={styles.reelTitle} numberOfLines={1}>{reel.title}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(true)} activeOpacity={0.7} style={styles.editButton}>
              <Feather name="edit-2" size={18} color="#FFF" />
            </TouchableOpacity>
            {reel.instagramUrl ? (
              <TouchableOpacity onPress={openInstagram} activeOpacity={0.7} style={styles.instagramButton}>
                <Feather name="instagram" size={18} color="#FFF" />
                <Text style={styles.instagramButtonText}>Open</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Glassmorphic close button — top-left ──────────────── */}
      <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeBtn}>
        {Platform.OS !== "web" ? (
          <BlurView intensity={50} tint="dark" style={styles.closeBtnBlur}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </BlurView>
        ) : (
          <View style={styles.closeBtnFallback}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      
      {/* ── Edit Modal ────────────────────────────────────────── */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          {Platform.OS !== "web" ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.8)" }]} />
          )}
          
          <View style={[styles.modalContent, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Reel Details</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Reel Title"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={editHashtags}
                onChangeText={setEditHashtags}
                placeholder="e.g. gym, workout, tips"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Category</Text>
              {categories.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 5 }} contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setEditCategoryId(cat.id)}
                      activeOpacity={0.8}
                      style={[styles.categoryPill, cat.id === editCategoryId && styles.categoryPillActive]}
                    >
                      <Text style={[styles.categoryPillText, cat.id === editCategoryId && styles.categoryPillTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <ActivityIndicator size="small" color="#FFF" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
              )}
              
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add your notes here..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
                onPress={handleSaveEdit}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteButton, isDeleting && { opacity: 0.7 }]} 
                onPress={handleDeleteReel}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Reel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 52,
    left: 16,
    zIndex: 20,
  },
  closeBtnBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  closeBtnFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(20, 20, 20, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  } as any,
  bottomControlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingTop: 15,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  reelTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  instagramButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F06543",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  instagramButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 10,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalScroll: {
    flex: 1,
  },
  inputLabel: {
    color: "#AAA",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    minHeight: 120,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
  },
  categoryPillActive: {
    backgroundColor: "#00C278",
  },
  categoryPillText: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryPillTextActive: {
    color: "#000",
  },
  modalActions: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#00C278",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "bold",
  },
});
