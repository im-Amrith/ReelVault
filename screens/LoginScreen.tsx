import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { Colors } from "../constants/colors";

export default function LoginScreen() {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <View className="flex-1 bg-black items-center justify-center px-8">
      {/* Logo & Branding */}
      <View className="items-center mb-12">
        <View className="w-20 h-20 bg-white rounded-3xl items-center justify-center mb-6">
          <Feather name="zap" size={40} color="#000000" />
        </View>
        <Text className="text-white text-5xl font-bold mb-2">Reel Vault</Text>
        <Text className="text-gray-400 text-base text-center leading-6">
          Save, organize, and never lose{"\n"}your favourite reels again.
        </Text>
      </View>

      {/* Google Sign-In Button */}
      <TouchableOpacity
        className="w-full"
        activeOpacity={0.85}
        onPress={signInWithGoogle}
        disabled={isLoading}
      >
        <LinearGradient
          colors={[Colors.accent, "#E0553A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 9999, paddingVertical: 16 }}
        >
          <View className="flex-row items-center justify-center gap-3">
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="log-in" size={20} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold">
                  Sign in with Google
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer */}
      <Text className="text-gray-600 text-xs text-center mt-8 leading-5">
        By signing in, you agree to our{"\n"}Terms of Service & Privacy Policy
      </Text>
    </View>
  );
}
