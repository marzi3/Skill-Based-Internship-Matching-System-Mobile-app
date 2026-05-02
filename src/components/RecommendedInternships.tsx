import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Star, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';

interface Match {
  internship: {
    _id: string;
    positionTitle: string;
    requiredSkills: string[];
    employer?: {
      companyName: string;
      profilePicture?: string;
    };
    company?: string;
  };
  score: number;
}

interface Props {
  matches: Match[];
}

export const RecommendedInternships: React.FC<Props> = ({ matches = [] }) => {
  if (!matches || matches.length === 0) {
    return (
      <View className="py-10 bg-white rounded-2xl border border-dashed border-gray-200 items-center justify-center">
        <Text className="text-gray-500 font-bold">No high-probability matches detected yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      className="flex-row"
      contentContainerStyle={{ paddingRight: 20 }}
    >
      {matches.map((match, idx) => (
        <MotiView
          key={match.internship._id}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 100 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mr-4 w-72"
        >
          <View className="flex-row justify-between items-start mb-6">
            <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center overflow-hidden border border-indigo-100">
               {match.internship.employer?.profilePicture ? (
                 <Image 
                   source={{ uri: match.internship.employer.profilePicture }} 
                   className="w-full h-full"
                 />
               ) : (
                 <Text className="text-indigo-600 font-black text-xl">
                   {(match.internship.employer?.companyName || 'C')[0]}
                 </Text>
               )}
            </View>
            <View className="bg-indigo-600 px-3 py-1.5 rounded-full flex-row items-center shadow-md shadow-indigo-200">
              <Star size={12} color="white" fill="white" />
              <Text className="text-white text-[10px] font-black ml-1 uppercase tracking-widest">
                {Math.round(match.score)}% Match
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
              {match.internship.employer?.companyName || match.internship.company}
            </Text>
            <Text className="text-xl font-black text-gray-900 tracking-tighter" numberOfLines={2}>
              {match.internship.positionTitle}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-8">
            {(match.internship.requiredSkills || []).slice(0, 2).map((skill, i) => (
              <View key={i} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <Text className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{skill}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            onPress={() => router.push(`/internships/${match.internship._id}` as any)}
            className="w-full py-4 bg-gray-900 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gray-200 active:scale-95 transition-all"
          >
            <Text className="text-white font-black text-[11px] uppercase tracking-[0.2em]">View Mission</Text>
            <ChevronRight size={16} color="white" className="ml-2" />
          </TouchableOpacity>
        </MotiView>
      ))}
    </ScrollView>
  );
};
