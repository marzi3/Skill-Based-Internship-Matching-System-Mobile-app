import { router } from 'expo-router';
import { ChevronRight, Star } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Match {
  internship: {
    _id: string;
    positionTitle: string;
    requiredSkills: Array<string | { name?: string; mandatory?: boolean; prefersSenior?: boolean }>;
    employer?: {
      companyName: string;
      profilePicture?: string;
    };
    company?: string;
  };
  score: number;
  reasons?: string[];
  explanationData?: Array<{ rule?: string; score?: number | string; detail?: string }>;
  tier?: string;
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

          <View className="flex-row flex-wrap gap-2 mb-4">
            {/* Show up to two required skills as badges (safe render) */}
            {(match.internship.requiredSkills || []).slice(0, 2).map((skill, i) => (
              <View key={i} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <Text className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                  {typeof skill === 'string' ? skill : skill?.name || 'Skill'}
                </Text>
              </View>
            ))}
          </View>

          {/* Match analysis: render matched vs missing skills when provided by API */}
          {((match.explanationData && match.explanationData.length) || (match.reasons && match.reasons.length)) && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Text className="text-[11px] font-black text-gray-700 mr-2">Match Details:</Text>
                <Text className="text-[10px] text-gray-400">{match.tier || ''}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {/* Extract exact matched skills from explanationData details */}
                {((match.explanationData || [])
                  .filter(e => e?.detail && /exact skill match/i.test(String(e.detail)))
                  .map(e => {
                    const m = String(e.detail).match(/: ?(.+)$/);
                    return m ? m[1] : String(e.detail);
                  })
                  .slice(0, 3)
                ).map((s, i) => (
                  <View key={`m-${i}`} className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <Text className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">{s}</Text>
                  </View>
                ))}

                {/* Extract missing or mandatory failures */}
                {((match.explanationData || [])
                  .filter(e => e?.detail && (/missing|mandatory|not met/i.test(String(e.detail))))
                  .map(e => {
                    const m = String(e.detail).match(/: ?(.+)$/);
                    return m ? m[1] : String(e.detail);
                  })
                  .slice(0, 3)
                ).map((s, i) => (
                  <View key={`x-${i}`} className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                    <Text className="text-[10px] text-rose-700 font-black uppercase tracking-widest">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

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
