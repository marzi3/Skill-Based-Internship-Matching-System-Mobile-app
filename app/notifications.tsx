import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft,
  Bell,
  Zap,
  Briefcase,
  CheckCircle2,
  Clock
} from 'lucide-react-native';
import { router } from 'expo-router';
import { MotiView } from 'moti';

const NotificationItem = ({ icon: Icon, title, message, time, isRead, color }: any) => (
  <TouchableOpacity 
    className={`flex-row p-5 border-b border-gray-50 ${isRead ? 'bg-white' : 'bg-indigo-50/30'}`}
  >
    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${color}`}>
      <Icon size={24} color="white" />
    </View>
    <View className="flex-1 ml-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text className={`text-sm ${isRead ? 'text-gray-900 font-bold' : 'text-indigo-900 font-black'}`}>{title}</Text>
        <Text className="text-[10px] text-gray-400 font-bold">{time}</Text>
      </View>
      <Text className="text-xs text-gray-500 leading-4" numberOfLines={2}>{message}</Text>
    </View>
  </TouchableOpacity>
);

export default function NotificationsScreen() {
  const notifications = [
    {
      id: 1,
      icon: Zap,
      title: 'New AI Match!',
      message: 'You have a 95% match with the Frontend Intern position at TechCorp.',
      time: '2m ago',
      isRead: false,
      color: 'bg-indigo-600'
    },
    {
      id: 2,
      icon: Briefcase,
      title: 'Application Update',
      message: 'Your application for "UX Designer" has been moved to the Review stage.',
      time: '1h ago',
      isRead: false,
      color: 'bg-amber-500'
    },
    {
      id: 3,
      icon: CheckCircle2,
      title: 'Profile Verified',
      message: 'Congratulations! Your academic credentials have been verified.',
      time: '5h ago',
      isRead: true,
      color: 'bg-emerald-500'
    },
    {
      id: 4,
      icon: Clock,
      title: 'Interview Scheduled',
      message: 'Incubator Labs has invited you for an interview on Monday at 10 AM.',
      time: 'Yesterday',
      isRead: true,
      color: 'bg-indigo-400'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="ml-4 text-2xl font-black text-gray-900 tracking-tight">Notifications</Text>
        </View>
        {!notifications.every(n => n.isRead) && (
          <TouchableOpacity>
            <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1">
        {notifications.map((n, idx) => (
          <MotiView
            key={n.id}
            from={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 100 }}
          >
            <NotificationItem {...n} />
          </MotiView>
        ))}
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
