import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { BookMarked, Briefcase, ChevronRight, Edit2, LogOut, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../src/api/apiClient';
import { AdminProfile } from '../../src/components/AdminProfile';
import {
  CertificationsSection,
  EducationSection,
  PersonalInfoSection,
  PortfolioSection,
  ProfileCompletion,
  ProfileHeader,
  ProjectsSection,
  SkillsSection,
} from '../../src/components/student';
import { useAuth } from '../../src/context/AuthContext';

function ActionRow({ icon: Icon, label, onPress, color = '#4F46E5', bg = 'bg-indigo-50' }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white p-5 rounded-2xl border border-gray-100 flex-row items-center justify-between mb-3"
    >
      <View className="flex-row items-center">
        <View className={`w-9 h-9 ${bg} rounded-xl items-center justify-center`}>
          <Icon size={18} color={color} />
        </View>
        <ActionLabel label={label} />
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function ActionLabel({ label }: { label: string }) {
  return <Text className="text-gray-900 font-black uppercase text-base ml-4">{label}</Text>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (user?.role === 'employer') {
      router.replace('/employer/profile' as any);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('students/profile');
      if (res.data.success) setProfile(res.data.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'student') { setLoading(false); return; }
    // initial load
    if (!profile) fetchProfile();
  }, [user]);

  // Refresh profile when this screen regains focus (e.g., after editing education)
  useEffect(() => {
    if (isFocused && user?.role === 'student') {
      setRefreshing(true);
      fetchProfile();
    }
  }, [isFocused, user]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchProfile(); }, []);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (user?.role === 'employer') {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (user?.role === 'admin') {
    return <AdminProfile />;
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ProfileHeader
          user={user}
          personalInfo={profile?.personalInfo}
          profileImage={profile?.profileImage}
          coverImage={profile?.coverImage}
          onEditProfilePhoto={() => router.push('/student/personal?image=profile' as any)}
          onEditCoverPhoto={() => router.push('/student/personal?image=cover' as any)}
          onBellPress={() => router.push('/notifications' as any)}
          onSettingsPress={() => router.push('/settings' as any)}
        />

        <View className="px-6 py-6">

          {/* Profile Completion */}
          {profile?.profileCompletion && (
            <ProfileCompletion completion={profile.profileCompletion} />
          )}

          {/* Personal Info */}
          <PersonalInfoSection info={profile?.personalInfo} user={user} />

          {/* Skills */}
          <SkillsSection skills={profile?.skills || []} />

          {/* Education */}
          <EducationSection education={profile?.education || []} />

          {/* Certifications */}
          <CertificationsSection certifications={profile?.certifications || []} />

          {/* Projects */}
          <ProjectsSection projects={profile?.projects || []} />

          {/* Portfolio */}
          <PortfolioSection portfolio={profile?.portfolio} />

          {/* Quick Actions */}
          <View className="pt-4 border-t border-gray-50 mt-2">
            <ActionRow icon={Briefcase}  label="My Applications"   onPress={() => router.push('/(tabs)/applications' as any)} color="#4F46E5" bg="bg-indigo-50" />
            <ActionRow icon={Edit2}      label="Edit Profile"      onPress={() => router.push('/profile/edit' as any)}          color="#9333EA" bg="bg-purple-50" />
            <ActionRow icon={BookMarked} label="Saved Internships" onPress={() => router.push('/profile/bookmarks' as any)}     color="#F59E0B" bg="bg-amber-50" />
            <ActionRow icon={Settings}   label="Settings"          onPress={() => router.push('/settings' as any)}              color="#6B7280" bg="bg-gray-50" />

            <TouchableOpacity
              onPress={logout}
              className="bg-red-50 p-5 rounded-2xl border border-red-100 flex-row items-center mt-1"
            >
              <LogOut size={20} color="#EF4444" />
              <ActionLabel label="Logout" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
