import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft, User, GraduationCap, Code,
  Award, Globe, ChevronRight,
} from 'lucide-react-native';

const SECTIONS = [
  {
    key: 'personal',
    label: 'Personal Information',
    description: 'Name, bio, GPA, location, preferences',
    icon: User,
    color: '#4F46E5',
    bg: 'bg-indigo-50',
    route: '/student/personal',
  },
  {
    key: 'education',
    label: 'Education',
    description: 'Degrees, institutions, field of study',
    icon: GraduationCap,
    color: '#8B5CF6',
    bg: 'bg-purple-50',
    route: '/student/education',
  },
  {
    key: 'skills',
    label: 'Skills',
    description: 'Technical skills and proficiency levels',
    icon: Code,
    color: '#10B981',
    bg: 'bg-emerald-50',
    route: '/student/skills',
  },
  {
    key: 'certifications',
    label: 'Certifications',
    description: 'Professional certificates and credentials',
    icon: Award,
    color: '#F59E0B',
    bg: 'bg-amber-50',
    route: '/student/certifications',
  },
  {
    key: 'portfolio',
    label: 'Portfolio & Links',
    description: 'GitHub, LinkedIn, personal website',
    icon: Globe,
    color: '#6366F1',
    bg: 'bg-indigo-50',
    route: '/student/portfolio',
  },
] as const;

export default function EditProfileHub() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-gray-900 tracking-tight">Edit Profile</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-500 text-sm font-medium mb-6 leading-5">
          Select a section to update. A complete profile improves your match score significantly.
        </Text>

        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <TouchableOpacity
              key={section.key}
              onPress={() => router.push(section.route as any)}
              className="bg-white border border-gray-100 rounded-3xl p-5 mb-3 flex-row items-center shadow-sm"
            >
              <View className={`w-12 h-12 ${section.bg} rounded-2xl items-center justify-center`}>
                <Icon size={22} color={section.color} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-gray-900 font-black text-base tracking-tight">{section.label}</Text>
                <Text className="text-gray-400 text-xs font-medium mt-0.5">{section.description}</Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
