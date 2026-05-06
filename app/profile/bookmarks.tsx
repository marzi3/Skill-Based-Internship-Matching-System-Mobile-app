import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Building2, MapPin, Clock, Bookmark, BookmarkX, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    try {
      const res = await apiClient.get('students/bookmarks');
      if (res.data.success) setBookmarks(res.data.data || []);
    } catch (err) {
      console.error('Fetch bookmarks error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBookmarks(); }, []);

  const removeBookmark = async (id: string) => {
    try {
      setRemoving(id);
      await apiClient.delete(`students/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error('Remove bookmark error:', err);
    } finally {
      setRemoving(null);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, transform: [{ translateY: 10 }] }} animate={{ opacity: 1, transform: [{ translateY: 0 }] }} transition={{ delay: index * 60 }}>
      <View className="bg-white mx-6 mb-4 p-5 rounded-3xl border border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => router.push(`/internships/${item._id}` as any)}>
          <View className="flex-row items-start mb-3">
            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100 overflow-hidden">
              {item.employer?.profilePicture
                ? <Image source={{ uri: item.employer.profilePicture }} className="w-full h-full" />
                : <Building2 size={22} color="#4F46E5" />}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>{item.positionTitle}</Text>
              <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                {item.employer?.companyName || item.company}
              </Text>
            </View>
            <ChevronRight size={16} color="#D1D5DB" />
          </View>

          <View className="flex-row items-center gap-3 flex-wrap mb-3">
            {item.location && (
              <View className="flex-row items-center">
                <MapPin size={11} color="#6366F1" />
                <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase tracking-widest">{item.location}</Text>
              </View>
            )}
            {item.duration && (
              <View className="flex-row items-center">
                <Clock size={11} color="#6366F1" />
                <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase tracking-widest">{item.duration}</Text>
              </View>
            )}
            <Badge variant="secondary" size="sm">{item.workEnvironment || 'Remote'}</Badge>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
          <TouchableOpacity
            onPress={() => router.push(`/apply/${item._id}` as any)}
            className="bg-indigo-600 px-5 py-2.5 rounded-xl"
          >
            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => removeBookmark(item._id)}
            disabled={removing === item._id}
            className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-xl border border-red-100"
          >
            {removing === item._id
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <>
                  <BookmarkX size={14} color="#EF4444" />
                  <Text className="text-red-600 font-black text-[10px] uppercase tracking-widest ml-1.5">Remove</Text>
                </>}
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-black text-gray-900 tracking-tight">Saved Internships</Text>
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{bookmarks.length} saved</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-8">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-dashed border-gray-200">
                <Bookmark size={32} color="#D1D5DB" />
              </View>
              <Text className="text-gray-900 font-black text-base mb-2">No saved internships</Text>
              <Text className="text-gray-400 text-sm text-center font-medium mb-6">Bookmark internships you're interested in to find them here.</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/explore' as any)}
                className="bg-indigo-600 px-8 py-4 rounded-2xl"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">Browse Internships</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
