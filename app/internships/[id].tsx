import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Clock, 
  Banknote, 
  Briefcase, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { Badge } from '../../src/components/Badge';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function InternshipDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [internship, setInternship] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const jobRes = await apiClient.get(`internships/${id}`);
      if (jobRes.data.success) {
        setInternship(jobRes.data.data);
      }

      const matchRes = await apiClient.get(`matching/explain/${user?._id}/${id}`);
      if (matchRes.data.success) {
        setAnalysis(matchRes.data.analysis);
      }

      const checkRes = await apiClient.get(`applications/check/${id}`);
      if (checkRes.data.success) {
        setApplied(checkRes.data.applied);
      }
    } catch (err) {
      console.error('Fetch internship details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      const res = await apiClient.post(`applications/apply/${id}`, {
        coverLetter: "Interested in this position."
      });
      if (res.data.success) {
        setApplied(true);
        Alert.alert("Success", "Application submitted successfully!");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
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

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View className="relative">
          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            className="h-48"
          />
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-12 left-6 p-2 bg-white/20 rounded-full backdrop-blur-md"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          
          <View className="px-6 -mt-16">
            <View className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100">
               <View className="flex-row items-center mb-6">
                 <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center overflow-hidden border border-indigo-100">
                    {internship.employer?.profilePicture ? (
                      <Image source={{ uri: internship.employer.profilePicture }} className="w-full h-full" />
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
                     {internship.duration || '6'} Months
                   </Text>
                 </View>
                 <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                   <Banknote size={14} color="#F59E0B" />
                   <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                     LKR {internship.stipend?.amount || '0'}
                   </Text>
                 </View>
                 <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                    <MapPin size={14} color="#6366F1" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                      {internship.workEnvironment || 'Remote'}
                    </Text>
                 </View>
               </View>
            </View>
          </View>
        </View>

        <View className="p-6 space-y-8">
          {/* Match Score Widget */}
          {analysis && (
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-[32px] p-6 relative overflow-hidden"
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
                <View 
                  style={{ width: `${analysis.normalizedScore}%` }} 
                  className="h-full bg-indigo-500 rounded-full" 
                />
              </View>

              <Text className="text-gray-400 text-xs font-medium leading-5">
                {analysis.tier === 'EXCELLENT' 
                  ? "Your profile is a near-perfect synchronization with this protocol's requirements." 
                  : "You have a strong foundation for this role. Review technical breakdown."}
              </Text>
            </MotiView>
          )}

          {/* Description */}
          <View>
            <View className="flex-row items-center mb-4">
              <ShieldCheck size={20} color="#4F46E5" />
              <Text className="text-lg font-black text-gray-900 uppercase tracking-tight ml-2">Mission Overview</Text>
            </View>
            <Text className="text-gray-600 leading-6 font-medium text-base">
              {internship.description}
            </Text>
          </View>

          {/* Requirements */}
          <View>
            <Text className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Tech Stack</Text>
            <View className="flex-row flex-wrap gap-2">
              {(internship.requiredSkills || []).map((skill: any, i: number) => (
                <View key={i} className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                  <Text className="text-indigo-700 font-black text-[10px] uppercase tracking-widest">
                    {typeof skill === 'string' ? skill : skill.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Sticky Footer Action */}
      <BlurView intensity={80} tint="light" className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 overflow-hidden">
        <TouchableOpacity 
          onPress={handleApply}
          disabled={applied || applying}
          className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${applied ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}
        >
          {applying ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-black uppercase tracking-[0.2em] text-xs">
                {applied ? 'Application Submitted' : 'Submit Application'}
              </Text>
              {!applied && <ChevronRight size={16} color="white" className="ml-2" />}
            </>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}
