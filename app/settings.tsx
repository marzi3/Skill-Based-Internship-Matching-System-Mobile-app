import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  Lock, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle, 
  ChevronLeft,
  Smartphone,
  Eye
} from 'lucide-react-native';
import { router } from 'expo-router';
import { MotiView } from 'moti';

const SettingItem = ({ icon: Icon, title, value, hasSwitch, type = 'default' }: any) => (
  <TouchableOpacity 
    className="flex-row items-center justify-between py-4 border-b border-gray-50"
    disabled={hasSwitch}
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-xl ${type === 'danger' ? 'bg-red-50' : 'bg-gray-50'}`}>
        <Icon size={20} color={type === 'danger' ? '#EF4444' : '#4B5563'} />
      </View>
      <Text className={`ml-4 font-bold text-sm ${type === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>{title}</Text>
    </View>
    {hasSwitch ? (
      <Switch 
        trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
        thumbColor={true ? '#4F46E5' : '#F4F3F4'}
        value={true}
      />
    ) : (
      <View className="flex-row items-center">
        {value && <Text className="text-gray-500 text-xs mr-2">{value}</Text>}
        <ChevronRight size={16} color="#D1D5DB" />
      </View>
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="ml-4 text-2xl font-black text-gray-900 tracking-tight">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <MotiView
          from={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account</Text>
          <View className="bg-white rounded-3xl overflow-hidden">
            <SettingItem icon={User} title="Edit Profile" />
            <SettingItem icon={Lock} title="Change Password" />
            <SettingItem icon={ShieldCheck} title="Two-Factor Auth" value="Enabled" />
          </View>

          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Preferences</Text>
          <View className="bg-white rounded-3xl overflow-hidden">
            <SettingItem icon={Bell} title="Push Notifications" hasSwitch />
            <SettingItem icon={Eye} title="Profile Visibility" hasSwitch />
            <SettingItem icon={Smartphone} title="Biometric Login" hasSwitch />
          </View>

          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Support</Text>
          <View className="bg-white rounded-3xl overflow-hidden">
            <SettingItem icon={HelpCircle} title="Help Center" />
            <SettingItem icon={ShieldCheck} title="Privacy Policy" />
            <SettingItem icon={HelpCircle} title="About InternMatch" value="v1.0.0" />
          </View>
        </MotiView>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
