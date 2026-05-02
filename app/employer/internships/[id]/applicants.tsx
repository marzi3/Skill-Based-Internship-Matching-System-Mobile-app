import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Users, 
  Star, 
  ChevronRight,
  ShieldCheck,
  Target,
  User
} from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../../../src/api/apiClient';
import { Badge } from '../../../../src/components/Badge';
import { LinearGradient } from 'expo-linear-gradient';

export default function ApplicantsListScreen() {
  const { id } = useLocalSearchParams();
  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`internships/${id}`);
      if (res.data.success) {
        setInternship(res.data.data);
      }
    } catch (err) {
      console.error('Fetch applicants error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplicants();
  }, [id]);

  const renderApplicant = ({ item, index }: { item: any; index: number }) => {
    // Mocking match score for now as the backend typically calculates this on demand
    // but the employer dashboard shows it based on matching engine
    const matchScore = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    return (
      <MotiView
        from={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity 
          onPress={() => router.push(`/employer/candidates/${item._id}` as any)}
          className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm mb-4 flex-row items-center"
        >
          <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center overflow-hidden border border-indigo-100">
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} className="w-full h-full" />
            ) : (
              <User size={24} color="#4F46E5" />
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-gray-900 font-black text-base tracking-tight" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1">
               <Target size={12} color="#10B981" />
               <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-widest ml-1">
                 {matchScore}% Match
               </Text>
            </View>
          </View>

          <View className="items-end">
            <View className="bg-gray-50 p-2 rounded-xl">
               <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-gray-900 tracking-tighter">
          Applicants
        </Text>
        <Text className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
          For {internship?.positionTitle}
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4">
        <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 border border-gray-100">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-4 px-3 text-gray-900 font-bold"
            placeholder="Search candidates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
             <Filter size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={internship?.applicants || []}
        renderItem={renderApplicant}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-50 rounded-[32px] items-center justify-center mb-4">
              <Users size={32} color="#D1D5DB" />
            </View>
            <Text className="text-gray-900 font-black uppercase tracking-widest text-xs">No applicants yet</Text>
            <Text className="text-gray-500 text-[10px] mt-1 font-bold">Try promoting this role to reach more talent</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
