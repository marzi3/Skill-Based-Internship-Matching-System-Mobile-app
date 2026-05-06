import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Target } from 'lucide-react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';

interface Completion {
  personal: number;
  education: number;
  skills: number;
  overall: number;
}

interface Props {
  completion: Completion;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-white text-sm font-black uppercase">{label}</Text>
        <Text className="text-white text-sm font-black">{value}%</Text>
      </View>
      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function ProfileCompletion({ completion }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, transform: [{ translateY: 10 }] }}
      animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
      className="bg-gray-900 p-5 rounded-3xl mb-6"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Target size={16} color="#818CF8" />
          <Text className="text-white font-black text-base uppercase ml-2">
            Profile Strength
          </Text>
        </View>
        <Text className="text-white font-black text-xl">{completion.overall}%</Text>
      </View>

      <Bar label="Personal" value={completion.personal} color="#6366F1" />
      <Bar label="Education" value={completion.education} color="#8B5CF6" />
      <Bar label="Skills"    value={completion.skills}    color="#10B981" />

      {completion.overall < 100 && (
        <TouchableOpacity
          onPress={() => router.push('/profile/edit' as any)}
          className="mt-3 bg-indigo-600 py-3 rounded-2xl items-center"
        >
          <Text className="text-white font-black text-sm uppercase">
            Complete Profile
          </Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );
}
