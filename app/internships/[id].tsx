import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, ImageBackground, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  ArrowLeft, Building2, MapPin, Clock, Banknote, Briefcase,
  CheckCircle2, ChevronRight, ShieldCheck, Target, Bookmark, BookmarkCheck,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { Badge } from '../../src/components/Badge';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

const getApiOrigin = () => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  return raw.replace(/\/api\/v1$/, '');
};

const normalizeImageUrl = (url?: string | null) => {
  if (!url) return '';
  const trimmed = String(url).trim().replace(/\\/g, '/');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) return trimmed;
  if (/^(file|content|ph):\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z]:\//.test(trimmed)) return '';
  return `${getApiOrigin()}/${trimmed.replace(/^\/+/, '')}`;
};

export default function InternshipDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [internship, setInternship] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const requests: Promise<any>[] = [apiClient.get(`internships/${id}`)];

      if (user?.role === 'student') {
        requests.push(
          apiClient.get(`matching/explain/${user._id}/${id}`).catch(() => ({ data: {} })),
          apiClient.get(`applications/check/${id}`).catch(() => ({ data: {} })),
          apiClient.get('students/bookmarks').catch(() => ({ data: {} })),
        );
      }

      const [jobRes, matchRes, checkRes, bookmarksRes] = await Promise.all(requests);

      if (jobRes.data.success) {
        let job = jobRes.data.data;
        const employerId = typeof job?.employer === 'string' ? job.employer : job?.employer?._id;

        if (employerId && !job?.employer?.coverImage) {
          const employerRes = await apiClient.get(`auth/employers/${employerId}`).catch(() => null);
          const employerProfile = employerRes?.data?.data?.employer;
          if (employerProfile) {
            job = {
              ...job,
              employer: {
                ...(typeof job.employer === 'object' ? job.employer : {}),
                ...employerProfile,
              },
            };
          }
        }

        setInternship(job);
      }
      if (matchRes?.data?.success) setAnalysis(matchRes.data.analysis);
      if (checkRes?.data?.success) setApplied(checkRes.data.applied);
      if (bookmarksRes?.data?.success) {
        const saved = bookmarksRes.data.data || [];
        setBookmarked(saved.some((b: any) => b._id === id || b === id));
      }
    } catch (err) {
      console.error('Fetch internship details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const toggleBookmark = async () => {
    try {
      setBookmarking(true);
      if (bookmarked) {
        await apiClient.delete(`students/bookmarks/${id}`);
        setBookmarked(false);
      } else {
        await apiClient.post(`students/bookmarks/${id}`);
        setBookmarked(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!internship) return null;

  const isStudent = user?.role === 'student';
  const coverImageUrl = normalizeImageUrl(internship.employer?.coverImage || internship.coverImage);
  const profileImageUrl = normalizeImageUrl(internship.employer?.profilePicture);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View style={styles.hero}>
          {coverImageUrl ? (
            <ImageBackground
              source={{ uri: coverImageUrl }}
              style={styles.heroGradient}
              imageStyle={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(17,24,39,0.35)', 'rgba(79,70,229,0.22)']}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <LinearGradient colors={['#4F46E5', '#9333EA']} style={styles.heroGradient} />
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-6 p-2 bg-white/20 rounded-full"
            style={styles.heroButton}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>

          {isStudent && (
            <TouchableOpacity
              onPress={toggleBookmark}
              disabled={bookmarking}
              className="absolute right-6 p-2 bg-white/20 rounded-full"
              style={styles.heroButton}
            >
              {bookmarking
                ? <ActivityIndicator size="small" color="white" />
                : bookmarked
                  ? <BookmarkCheck size={20} color="white" fill="white" />
                  : <Bookmark size={20} color="white" />
              }
            </TouchableOpacity>
          )}

          <View className="px-6" style={styles.summaryCardWrap}>
            <View className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100">
              <View className="flex-row items-center mb-6">
                <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center overflow-hidden border border-indigo-100">
                  {profileImageUrl ? (
                    <Image source={{ uri: profileImageUrl }} className="w-full h-full" />
                  ) : (
                    <Building2 size={28} color="#4F46E5" />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
                    {internship.employer?.companyName || internship.company}
                  </Text>
                  <Text className="text-2xl font-black text-gray-900 tracking-tighter" numberOfLines={2}>
                    {internship.positionTitle}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-3">
                <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                  <Clock size={14} color="#10B981" />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                    {internship.duration || '6 Months'}
                  </Text>
                </View>
                {internship.stipend?.amount > 0 && (
                  <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                    <Banknote size={14} color="#F59E0B" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                      {internship.stipend?.currency || 'LKR'} {internship.stipend.amount}
                    </Text>
                  </View>
                )}
                <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                  <MapPin size={14} color="#6366F1" />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                    {internship.workEnvironment || 'Remote'}
                  </Text>
                </View>
                {internship.numberOfOpenings > 0 && (
                  <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                    <Briefcase size={14} color="#8B5CF6" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                      {internship.numberOfOpenings} Opening{internship.numberOfOpenings !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 pb-6 space-y-8" style={styles.content}>
          {/* Match Score */}
          {analysis && isStudent && (
            <MotiView
              from={{ opacity: 0, transform: [{ scale: 0.95 }] }}
              animate={{ opacity: 1, transform: [{ scale: 1 }] }}
              className="bg-gray-900 rounded-[32px] p-6"
            >
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                  <Target size={18} color="#818CF8" />
                  <Text className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] ml-2">Match Engine</Text>
                </View>
                <Badge variant="success" size="sm">{analysis.tier}</Badge>
              </View>
              <View className="flex-row items-end mb-4">
                <Text className="text-5xl font-black text-white tracking-tighter leading-none">
                  {analysis.normalizedScore || 0}
                </Text>
                <Text className="text-gray-500 font-bold ml-2 mb-1">/ 100</Text>
              </View>
              <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <View style={{ width: `${analysis.normalizedScore || 0}%` }} className="h-full bg-indigo-500 rounded-full" />
              </View>
              {analysis.explanation?.length > 0 && (
                <View className="mt-2 space-y-2">
                  {analysis.explanation.slice(0, 3).map((exp: any, i: number) => (
                    <View key={i} className="flex-row items-start">
                      <View className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${exp.score > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <Text className="text-gray-400 text-xs font-medium flex-1">{exp.detail}</Text>
                    </View>
                  ))}
                </View>
              )}
            </MotiView>
          )}

          {/* Description */}
          <View>
            <View className="flex-row items-center mb-4">
              <ShieldCheck size={20} color="#4F46E5" />
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight ml-2">Description</Text>
            </View>
            <Text className="text-gray-600 leading-6 font-medium text-base">{internship.description}</Text>
          </View>

          {/* Required Skills */}
          {internship.requiredSkills?.length > 0 && (
            <View>
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Required Skills</Text>
              <View className="flex-row flex-wrap gap-2">
                {internship.requiredSkills.map((skill: any, i: number) => (
                  <View key={i} className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                    <Text className="text-indigo-700 font-black text-[10px] uppercase tracking-widest">
                      {typeof skill === 'string' ? skill : skill.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Preferred Skills */}
          {internship.preferredSkills?.length > 0 && (
            <View>
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Nice to Have</Text>
              <View className="flex-row flex-wrap gap-2">
                {internship.preferredSkills.map((skill: string, i: number) => (
                  <View key={i} className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <Text className="text-gray-600 font-black text-[10px] uppercase tracking-widest">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Perks */}
          {internship.perks?.length > 0 && (
            <View>
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Perks</Text>
              <View className="space-y-2">
                {internship.perks.map((perk: string, i: number) => (
                  <View key={i} className="flex-row items-center">
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text className="text-gray-600 text-sm font-medium ml-2">{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      {isStudent && (
        <BlurView intensity={80} tint="light" className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 overflow-hidden">
          <TouchableOpacity
            onPress={() => applied ? router.push('/(tabs)/applications' as any) : router.push(`/apply/${id}` as any)}
            className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${applied ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}
          >
            {applied ? (
              <>
                <CheckCircle2 size={16} color="white" />
                <Text className="text-white font-black uppercase tracking-[0.2em] text-xs ml-2">Application Submitted</Text>
              </>
            ) : (
              <>
                <Text className="text-white font-black uppercase tracking-[0.2em] text-xs">Apply Now</Text>
                <ChevronRight size={16} color="white" className="ml-2" />
              </>
            )}
          </TouchableOpacity>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 24,
  },
  heroGradient: {
    height: 210,
  },
  heroImage: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  heroButton: {
    top: 18,
  },
  summaryCardWrap: {
    marginTop: -72,
  },
  content: {
    paddingTop: 12,
  },
});
