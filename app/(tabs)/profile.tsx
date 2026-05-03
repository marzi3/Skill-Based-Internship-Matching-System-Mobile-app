import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  MapPin, 
  GraduationCap, 
  Code, 
  Settings, 
  LogOut, 
  CheckCircle, 
  Award, 
  ExternalLink,
  ChevronRight,
  Briefcase
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('students/profile');
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
        <View className="h-64 relative">
          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            className="h-48 w-full"
          />
          <View className="absolute bottom-0 left-6 flex-row items-end">
            <View className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl border border-gray-100">
               <View className="w-full h-full rounded-2xl bg-indigo-50 items-center justify-center overflow-hidden">
                 {user?.profilePicture ? (
                   <Image source={{ uri: user.profilePicture }} className="w-full h-full" />
                 ) : (
                   <User size={48} color="#4F46E5" />
                 )}
               </View>
            </View>
            <View className="ml-4 mb-2">
              <Text className="text-2xl font-black text-gray-900 tracking-tight">
                {user?.name}
              </Text>
              <View className="flex-row items-center">
                <Badge variant="primary" size="sm">{user?.role}</Badge>
                {profile?.personalInfo?.location && (
                  <View className="flex-row items-center ml-2">
                    <MapPin size={10} color="#6B7280" />
                    <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">
                      {profile.personalInfo.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/settings' as any)}
            className="absolute top-12 right-6 p-2 bg-white/20 rounded-full backdrop-blur-md"
          >
            <Settings size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-6 py-8">
          {/* About Section */}
          <View className="mb-10">
            <Text className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">About Me</Text>
            <Text className="text-gray-600 leading-6 font-medium">
              {profile?.personalInfo?.about || "No bio added yet. Tell employers about your skills and interests."}
            </Text>
          </View>

          {/* Skills Section */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight">Verified Skills</Text>
              <Code size={20} color="#4F46E5" />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {profile?.skills?.length > 0 ? (
                profile.skills.map((skill: any, i: number) => (
                  <View key={i} className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex-row items-center">
                    <CheckCircle size={14} color="#10B981" className="mr-2" />
                    <Text className="text-emerald-700 font-bold text-xs">{typeof skill === 'string' ? skill : skill.name}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 italic">No skills added yet.</Text>
              )}
            </View>
          </View>

          {/* Education Section */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight">Education</Text>
              <GraduationCap size={20} color="#4F46E5" />
            </View>
            {profile?.education?.length > 0 ? (
              profile.education.map((edu: any, i: number) => (
                <View key={i} className="bg-gray-50 p-5 rounded-3xl border border-gray-100 mb-4">
                  <Text className="text-gray-900 font-black text-base tracking-tight mb-1">{edu.institution}</Text>
                  <Text className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{edu.degree}</Text>
                  <Text className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">
                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                  </Text>
                </View>
              ))
            ) : (
              <View className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200 items-center">
                <Text className="text-gray-400 font-medium">No education details added.</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="pt-6 border-t border-gray-100 space-y-4">
            <TouchableOpacity className="bg-white p-5 rounded-2xl border border-gray-100 flex-row items-center justify-between">
               <View className="flex-row items-center">
                 <Briefcase size={20} color="#6B7280" />
                 <Text className="text-gray-700 font-bold ml-4 uppercase tracking-widest text-xs">My Applications</Text>
               </View>
               <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={logout}
              className="bg-red-50 p-5 rounded-2xl border border-red-100 flex-row items-center"
            >
               <LogOut size={20} color="#EF4444" />
               <Text className="text-red-600 font-bold ml-4 uppercase tracking-widest text-xs">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
