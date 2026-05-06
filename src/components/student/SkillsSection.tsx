import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Code, CheckCircle, Edit2 } from 'lucide-react-native';
import { router } from 'expo-router';

const PROFICIENCY_COLOR: Record<string, string> = {
  BEGINNER:     'bg-gray-50 border-gray-100 text-gray-600',
  INTERMEDIATE: 'bg-blue-50 border-blue-100 text-blue-700',
  ADVANCED:     'bg-indigo-50 border-indigo-100 text-indigo-700',
  EXPERT:       'bg-emerald-50 border-emerald-100 text-emerald-700',
};

interface Props {
  skills: any[];
}

export function SkillsSection({ skills }: Props) {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Code size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">Skills</Text>
          <View className="ml-2 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            <Text className="text-indigo-700 text-xs font-black">{skills?.length || 0}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/skills' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Manage</Text>
        </TouchableOpacity>
      </View>

      {skills?.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {skills.map((skill: any, i: number) => {
            const name = typeof skill === 'string' ? skill : skill.name;
            const proficiency = typeof skill === 'string' ? 'INTERMEDIATE' : (skill.proficiency || 'INTERMEDIATE');
            const colorClass = PROFICIENCY_COLOR[proficiency] || PROFICIENCY_COLOR['INTERMEDIATE'];
            return (
              <View key={i} className={`px-4 py-2.5 rounded-2xl border flex-row items-center ${colorClass}`}>
                <CheckCircle size={11} color={proficiency === 'EXPERT' ? '#10B981' : '#6366F1'} />
                <Text className={`font-black text-sm ml-1.5 ${colorClass.split(' ').find(c => c.startsWith('text-'))}`}>
                  {name}
                </Text>
                {proficiency !== 'INTERMEDIATE' && (
                  <Text className="text-xs font-black ml-1 opacity-80">· {proficiency[0]}</Text>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/skills' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add your skills...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
