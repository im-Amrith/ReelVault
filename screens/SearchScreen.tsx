import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import SearchResultCard from "../components/SearchResultCard";
import BottomNavBar from "../components/BottomNavBar";
import { getAllUserReels } from "../services/firestore";
import { useAuth } from "../contexts/AuthContext";
import type { Reel } from "../types/schema";

interface SearchScreenProps {
    onTabPress?: (tabKey: string) => void;
    onPlayReel?: (reel: Reel) => void;
}

export default function SearchScreen({ onTabPress, onPlayReel }: SearchScreenProps) {
    const { user } = useAuth();
    const [reels, setReels] = useState<Reel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTag, setActiveTag] = useState<string | null>(null);

    useEffect(() => {
        if (user?.uid) {
            setIsLoading(true);
            getAllUserReels(user.uid)
                .then(setReels)
                .catch(err => console.log("Failed to fetch reels:", err))
                .finally(() => setIsLoading(false));
        }
    }, [user?.uid]);

    // Extract top 10 unique hashtags
    const suggestedTags = useMemo(() => {
        const tags = new Set<string>();
        reels.forEach(r => {
            if (r.hashtags) {
                r.hashtags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).slice(0, 10);
    }, [reels]);

    // Filter reels by search and tag
    const filteredReels = useMemo(() => {
        return reels.filter(r => {
            const matchesSearch = searchQuery === "" || 
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (r.noteSnippet && r.noteSnippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
                r.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesTag = !activeTag || r.hashtags?.includes(activeTag);
            return matchesSearch && matchesTag;
        });
    }, [reels, searchQuery, activeTag]);
    const listHeader = (
        <View>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center">
                        <Feather name="zap" size={20} color="#000000" />
                    </View>
                    <Text className="text-white text-2xl font-bold">Discovery</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                    <Feather name="filter" size={20} color="#CCCCCC" />
                </TouchableOpacity>
            </View>

            {/* Search input */}
            <View className="mx-5 my-4 bg-[#1A1A1A] rounded-2xl flex-row items-center px-4 py-3.5">
                <Feather name="search" size={18} color="#666666" />
                <TextInput
                    className="flex-1 text-white text-base ml-3"
                    placeholder="Search reels..."
                    placeholderTextColor="#666666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery("")}>
                        <Feather name="x" size={16} color="#666666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Suggested tags */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
                {suggestedTags.map((tag, index) => {
                    const isActive = activeTag === tag;
                    return (
                        <TouchableOpacity
                            key={index}
                            className={`rounded-full px-4 py-2.5 mr-3 ${isActive ? 'bg-[#F06543]' : 'bg-[#1A1A1A]'}`}
                            activeOpacity={0.7}
                            onPress={() => setActiveTag(isActive ? null : tag)}
                        >
                            <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>{tag}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Results header */}
            <View className="flex-row justify-between items-end px-5 mb-5">
                <Text className="text-white text-2xl font-bold">Top Results</Text>
                <Text className="text-gray-500 text-sm">{filteredReels.length} found</Text>
            </View>
        </View>
    );

    const listFooter = (
        <View className="items-center py-6 mb-24">
            {isLoading ? (
                <ActivityIndicator size="small" color="#F06543" />
            ) : filteredReels.length === 0 ? (
                <Text className="text-gray-500 text-sm italic">
                    No results found
                </Text>
            ) : (
                <Text className="text-gray-500 text-sm italic">
                    End of results{searchQuery ? ` for "${searchQuery}"` : ""}
                </Text>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-black">
            <FlatList
                data={filteredReels}
                keyExtractor={(item) => item.id}
                numColumns={2}
                renderItem={({ item }) => <SearchResultCard reel={item} onPlayReel={onPlayReel} />}
                ListHeaderComponent={listHeader}
                ListFooterComponent={listFooter}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                showsVerticalScrollIndicator={false}
            />
            <BottomNavBar activeTab="search" onTabPress={onTabPress} />
        </View>
    );
}
