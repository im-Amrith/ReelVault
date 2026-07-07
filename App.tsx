import "./global.css";
import React, { useCallback, useEffect, useState } from "react";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import CategoryGrid from "./components/CategoryGrid";
import RemindersSection from "./components/RemindersSection";
import BottomNavBar from "./components/BottomNavBar";
import CategoryScreen from "./screens/CategoryScreen";
import SearchScreen from "./screens/SearchScreen";
import RemindersScreen from "./screens/RemindersScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import PlayReelScreen from "./screens/PlayReelScreen";
import AddReelScreen from "./screens/AddReelScreen";
import AddReminderScreen from "./screens/AddReminderScreen";
import { getCategories } from "./services/firestore";
import type { Category } from "./types/schema";

type Screen = "home" | "category" | "search" | "reminders" | "profile" | "playReel";

// ─── Main App Content (consumes AuthContext) ──────────────────────────────────

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [showAddReel, setShowAddReel] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [remindersRefreshKey, setRemindersRefreshKey] = useState(0);
  const [sharedUrl, setSharedUrl] = useState<string | undefined>(undefined);

  // ── Share Intent listener ──────────────────────────────────────
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent && shareIntent?.text) {
      // Extract URL from the shared text (Instagram often sends "Watch this reel by @user: https://...")
      const urlMatch = shareIntent.text.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch?.[1]) {
        setSharedUrl(urlMatch[1]);
        setShowAddReel(true);
      }
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent]);

  // Category state for dynamic data
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Track which category the user tapped
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeReel, setActiveReel] = useState<any>(null);

  // Fetch categories from Firestore
  const fetchCategories = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setCategoriesLoading(true);
      const cats = await getCategories(user.uid);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user?.uid]);

  // Fetch on mount + whenever user changes
  useEffect(() => {
    if (user?.uid) {
      fetchCategories();
    }
  }, [user?.uid, fetchCategories]);

  // Refetch when returning to home (e.g., after adding a reel)
  useEffect(() => {
    if (currentScreen === "home" && user?.uid) {
      fetchCategories();
    }
  }, [currentScreen]);

  // Loading state — show spinner while auth resolves
  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#F06543" />
      </View>
    );
  }

  // Not authenticated — show login screen
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated — show main app
  const handleTabPress = (tabKey: string) => {
    if (tabKey === "home") setCurrentScreen("home");
    else if (tabKey === "search") setCurrentScreen("search");
    else if (tabKey === "reminders") setCurrentScreen("reminders");
    else if (tabKey === "profile") setCurrentScreen("profile");
  };

  const handleCategoryPress = (category: Category) => {
    setActiveCategory(category);
    setCurrentScreen("category");
  };

  const handlePlayReel = (reel: any) => {
    setActiveReel(reel);
    setCurrentScreen("playReel");
  };

  const handleAddReelClose = () => {
    setShowAddReel(false);
    setSharedUrl(undefined);
    // Refetch categories in case a new one was created
    fetchCategories();
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "search":
        return <SearchScreen onTabPress={handleTabPress} onPlayReel={handlePlayReel} />;
      case "reminders":
        return (
          <RemindersScreen
            onTabPress={handleTabPress}
            onAddReminder={() => setShowAddReminder(true)}
            refreshKey={remindersRefreshKey}
          />
        );
      case "profile":
        return <SettingsScreen onTabPress={handleTabPress} />;
      case "category":
        return activeCategory ? (
          <CategoryScreen
            category={activeCategory}
            onBack={() => {
              setCurrentScreen("home");
              fetchCategories(); // Refresh to catch any cover/name updates
            }}
            onTabPress={handleTabPress}
            onPlayReel={handlePlayReel}
            onCategoryUpdated={(updatedCat) => {
              setActiveCategory(updatedCat);
              fetchCategories();
            }}
          />
        ) : null;
      default:
        return (
          <>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <Header onAddReel={() => setShowAddReel(true)} />
              <CategoryGrid
                categories={categories}
                isLoading={categoriesLoading}
                onCategoryPress={handleCategoryPress}
              />
              <RemindersSection onSeeAll={() => setCurrentScreen("reminders")} />
            </ScrollView>
            <BottomNavBar activeTab="home" onTabPress={handleTabPress} />
          </>
        );
    }
  };

  return (
    <>
      <View style={{ flex: 1, display: currentScreen === "playReel" ? "none" : "flex" }}>
        {renderScreen()}
      </View>
      
      {activeReel && (
        <View style={{ flex: 1, display: currentScreen === "playReel" ? "flex" : "none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
          <PlayReelScreen
            key={activeReel.id}
            reel={activeReel}
            onClose={() => setCurrentScreen("category")}
            isActive={currentScreen === "playReel"}
          />
        </View>
      )}
      {showAddReel && (
        <View className="absolute inset-0 bg-black" style={{ zIndex: 50 }}>
          <AddReelScreen onClose={handleAddReelClose} sharedUrl={sharedUrl} />
        </View>
      )}
      {showAddReminder && (
        <View className="absolute inset-0 bg-black" style={{ zIndex: 50 }}>
          <AddReminderScreen
            onClose={() => {
              setShowAddReminder(false);
              setRemindersRefreshKey((k) => k + 1);
            }}
          />
        </View>
      )}
    </>
  );
}

// ─── Root App (wraps everything in providers) ─────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <ShareIntentProvider>
        <AuthProvider>
          <SafeAreaView className="flex-1 bg-black">
            <StatusBar style="light" />
            <AppContent />
          </SafeAreaView>
        </AuthProvider>
      </ShareIntentProvider>
    </SafeAreaProvider>
  );
}
