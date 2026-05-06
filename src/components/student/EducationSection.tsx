import { router } from 'expo-router';
import { Calendar, Edit2, GraduationCap } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  education: any[];
}

function formatDurationYears(durationMonths: any) {
  const months = Number(durationMonths);
  if (!Number.isFinite(months) || months <= 0) return '';
  const years = months / 12;
  const displayYears = Number.isInteger(years) ? String(years) : String(Number(years.toFixed(1)));
  return `${displayYears} year${years === 1 ? '' : 's'}`;
}

export function EducationSection({ education }: Props) {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <GraduationCap size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">Education</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/education' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Manage</Text>
        </TouchableOpacity>
      </View>

      {education?.length > 0 ? (
        education.map((edu: any, i: number) => (
          <View key={i} className="bg-gray-50 p-5 rounded-3xl border border-gray-100 mb-3">
            <Text className="text-gray-900 font-black text-lg tracking-tight">{edu.institution}</Text>
            <Text className="text-gray-900 font-black text-sm uppercase mt-1">
              {edu.degree}{edu.field ? ` · ${edu.field}` : ''}
            </Text>
            {edu.degreeLevel && (
              <Text className="text-gray-900 text-sm font-bold mt-1 uppercase">
                {edu.degreeLevel}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              <Calendar size={13} color="#111827" />
              <Text className="text-gray-900 text-sm font-bold ml-1.5 uppercase">
                {new Date(edu.startDate).getFullYear()}
                {' – '}
                {edu.endDate
                  ? new Date(edu.endDate).getFullYear()
                  : edu.isCurrentlyStudying
                    ? 'Present'
                    : ''}
              </Text>
              {edu.isCurrentlyStudying && !edu.endDate && (
                <View className="ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Text className="text-emerald-700 text-xs font-black">CURRENT</Text>
                </View>
              )}
            </View>
            {formatDurationYears(edu.durationMonths) ? (
              <Text className="text-gray-900 text-sm font-bold mt-1 uppercase">
                Duration: {formatDurationYears(edu.durationMonths)}
              </Text>
            ) : null}
          </View>
        ))
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/education' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add your education history...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
