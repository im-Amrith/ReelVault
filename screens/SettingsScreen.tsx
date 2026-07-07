import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import SettingsRow from "../components/SettingsRow";
import BottomNavBar from "../components/BottomNavBar";
import { useAuth } from "../contexts/AuthContext";

interface SettingsScreenProps {
  onTabPress?: (tabKey: string) => void;
}

export default function SettingsScreen({ onTabPress }: SettingsScreenProps) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Header */}
        <Text className="text-white text-5xl font-bold px-5 mt-4">
          Settings
        </Text>

        {/* Profile Card — uses real user data from AuthContext */}
        <View className="bg-[#121212] rounded-3xl flex-row items-center justify-between p-4 mx-5 my-6">
          <View className="flex-row items-center flex-1 mr-3">
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-14 h-14 rounded-full"
                style={{
                  borderWidth: 2,
                  borderColor: "rgba(240,101,67,0.5)",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-14 h-14 rounded-full bg-[#1A1A1A] items-center justify-center"
                style={{
                  borderWidth: 2,
                  borderColor: "rgba(240,101,67,0.5)",
                }}
              >
                <Feather name="user" size={24} color="#888888" />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text
                className="text-white text-lg font-bold"
                numberOfLines={1}
              >
                {user?.displayName ?? "User"}
              </Text>
              <Text
                className="text-gray-400 text-sm mt-0.5"
                numberOfLines={1}
              >
                {user?.email ?? ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="w-9 h-9 bg-[#1A1A1A] rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={18} color="#888888" />
          </TouchableOpacity>
        </View>

        {/* ACCOUNT Section */}
        <Text className="text-gray-500 text-xs font-bold tracking-widest px-5 mt-4 mb-3">
          ACCOUNT
        </Text>
        <View className="bg-[#121212] rounded-3xl mx-5 overflow-hidden">
          <SettingsRow icon="user" title="Edit Profile" />
          <SettingsRow icon="lock" title="Change Password" />
          <SettingsRow
            icon="bell"
            title="Notifications"
            hasToggle
            toggleValue={notificationsEnabled}
            onToggle={setNotificationsEnabled}
            showChevron={false}
            isLast
          />
        </View>

        {/* APP SETTINGS Section */}
        <Text className="text-gray-500 text-xs font-bold tracking-widest px-5 mt-8 mb-3">
          APP SETTINGS
        </Text>
        <View className="bg-[#121212] rounded-3xl mx-5 overflow-hidden">
          <SettingsRow
            icon="moon"
            title="Appearance"
            rightText="Dark Mode"
          />
          <SettingsRow icon="database" title="Data & Storage" />
          <SettingsRow
            icon="type"
            title="Language"
            rightText="English (US)"
            isLast
          />
        </View>

        {/* SUPPORT & ABOUT Section */}
        <Text className="text-gray-500 text-xs font-bold tracking-widest px-5 mt-8 mb-3">
          SUPPORT & ABOUT
        </Text>
        <View className="bg-[#121212] rounded-3xl mx-5 overflow-hidden">
          <SettingsRow icon="help-circle" title="Help Center" />
          <SettingsRow icon="shield" title="Privacy Policy" />
          <SettingsRow
            icon="log-out"
            title="Log Out"
            isDestructive
            showChevron={false}
            isLast
            onPress={logout}
          />
        </View>
      </ScrollView>

      <BottomNavBar activeTab="profile" onTabPress={onTabPress} />
    </View>
  );
}
