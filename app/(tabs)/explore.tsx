import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Briefcase, Building2, ChevronRight, MapPin, Search, SlidersHorizontal, User as UserIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';
import { useAuth } from '../../src/context/AuthContext';

function normalizeImageUrl(url?: string | null) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Accept web images and data URIs.
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  // Accept native-safe URI schemes.
  if (/^(file|content|ph):\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Reject local filesystem paths like C:/... or /Users/... in API payloads.
  if (/^[a-zA-Z]:[\\/]/.test(trimmed) || /^[\\/]/.test(trimmed)) {
    return '';
  }

  return '';
}

function getSkillLabel(skill: any) {
  if (!skill) return '';
  if (typeof skill === 'string') return skill;
  if (typeof skill === 'object') return skill.name || skill.title || '';
  return String(skill);
}

function StudentExplore() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  const domains = ['All', 'Software Engineering', 'Design', 'Marketing', 'Finance', 'Data Science'];

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedDomain !== 'All') params.domain = selectedDomain;

      const res = await apiClient.get('internships', { params });
      if (res.data.success) {
        setInternships(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch internships error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [selectedDomain]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, transform: [{ translateY: 10 }] }} animate={{ opacity: 1, transform: [{ translateY: 0 }] }} transition={{ delay: index * 50 }}>
      <TouchableOpacity onPress={() => router.push(`/internships/${item._id}` as any)} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4 mx-6">
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-row flex-1">
            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center overflow-hidden border border-indigo-100">
               {normalizeImageUrl(item.employer?.profilePicture) ? (
                 <Image source={{ uri: normalizeImageUrl(item.employer.profilePicture) }} className="w-full h-full" />
               ) : (
                 <Building2 size={24} color="#4F46E5" />
               )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-gray-900 tracking-tight" numberOfLines={1}>{item.positionTitle}</Text>
              <Text className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-1">{item.employer?.companyName || item.company}</Text>
            </View>
          </View>
          <View className="bg-gray-50 p-2 rounded-xl">
             <ChevronRight size={16} color="#9CA3AF" />
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center mr-4">
            <MapPin size={12} color="#6366F1" />
            <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase tracking-widest">{item.location || 'Remote'}</Text>
          </View>
          <View className="flex-row items-center">
            <Briefcase size={12} color="#6366F1" />
            <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase tracking-widest">{item.workEnvironment || 'Hybrid'}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {(item.requiredSkills || []).slice(0, 3).map((skill: any, i: number) => (
            <Badge key={i} variant="secondary" size="sm">{getSkillLabel(skill)}</Badge>
          ))}
          {item.requiredSkills?.length > 3 && <Text className="text-[10px] text-gray-400 font-bold">+{item.requiredSkills.length - 3}</Text>}
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View className="flex-1">
      <BlurView intensity={90} tint="light" className="pt-4 pb-2">
        <View className="px-6">
           <Text className="text-3xl font-black text-gray-900 tracking-tighter">Explore</Text>
           <Text className="text-3xl font-black text-indigo-600 tracking-tighter italic">Opportunities.</Text>
        </View>
        <View className="px-6 py-4">
          <View className="bg-white/50 rounded-2xl flex-row items-center px-4 border border-gray-100">
            <Search size={20} color="#9CA3AF" />
            <TextInput className="flex-1 py-4 px-3 text-gray-900 font-bold" placeholder="Search internships..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchInternships} />
            <TouchableOpacity className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
               <SlidersHorizontal size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 10 }}>
            {domains.map((domain) => (
              <TouchableOpacity
                key={domain}
                onPress={() => setSelectedDomain(domain)}
                style={[
                  styles.domainPill,
                  selectedDomain === domain ? styles.domainPillActive : styles.domainPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.domainPillText,
                    selectedDomain === domain ? styles.domainPillTextActive : styles.domainPillTextInactive,
                  ]}
                >
                  {domain}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BlurView>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList data={internships} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ paddingBottom: 100 }} ListEmptyComponent={<View className="items-center justify-center py-20"><Text className="text-gray-900 font-black">No results found</Text></View>} />
      )}
    </View>
  );
}

function EmployerExplore() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('auth/students');
      if (res.data.success) {
        let filtered = res.data.data || [];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((c: any) => 
            c.name?.toLowerCase().includes(q) || 
            c.skills?.some((s: any) => getSkillLabel(s).toLowerCase().includes(q))
          );
        }
        setCandidates(filtered);
      }
    } catch (err) {
      console.error('Fetch candidates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, transform: [{ translateY: 10 }] }} animate={{ opacity: 1, transform: [{ translateY: 0 }] }} transition={{ delay: index * 50 }}>
      <TouchableOpacity
        onPress={() => router.push(`/employer/candidates/${item._id}` as any)}
        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4 mx-6"
      >
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-row flex-1 items-center">
            <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center overflow-hidden border border-indigo-100">
               {normalizeImageUrl(item.profilePicture) ? (
                 <Image source={{ uri: normalizeImageUrl(item.profilePicture) }} className="w-full h-full" />
               ) : (
                 <UserIcon size={24} color="#4F46E5" />
               )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-gray-900 tracking-tight" numberOfLines={1}>{item.name}</Text>
              {item.fieldOfStudy && (
                <Text className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-1">{item.fieldOfStudy}</Text>
              )}
            </View>
          </View>
          <View className="bg-gray-50 p-2 rounded-xl">
             <ChevronRight size={16} color="#9CA3AF" />
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          {item.location && (
            <View className="flex-row items-center mr-4">
              <MapPin size={12} color="#6366F1" />
              <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase tracking-widest">{item.location}</Text>
            </View>
          )}
        </View>

        <View className="flex-row flex-wrap gap-2">
          {(item.skills || []).slice(0, 3).map((skill: any, i: number) => (
            <Badge key={i} variant="primary" size="sm">{getSkillLabel(skill)}</Badge>
          ))}
          {item.skills?.length > 3 && <Text className="text-[10px] text-gray-400 font-bold">+{item.skills.length - 3}</Text>}
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View className="flex-1">
      <BlurView intensity={90} tint="light" className="pt-4 pb-2">
        <View className="px-6">
           <Text className="text-3xl font-black text-gray-900 tracking-tighter">Search</Text>
           <Text className="text-3xl font-black text-indigo-600 tracking-tighter italic">Candidates.</Text>
        </View>
        <View className="px-6 py-4">
          <View className="bg-white/50 rounded-2xl flex-row items-center px-4 border border-gray-100">
            <Search size={20} color="#9CA3AF" />
            <TextInput className="flex-1 py-4 px-3 text-gray-900 font-bold" placeholder="Search by name or skill..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchCandidates} />
          </View>
        </View>
      </BlurView>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList data={candidates} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ paddingBottom: 100 }} ListEmptyComponent={<View className="items-center justify-center py-20"><Text className="text-gray-900 font-black">No candidates found</Text></View>} />
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const { user } = useAuth();
  
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {user?.role === 'employer' ? <EmployerExplore /> : <StudentExplore />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  domainPill: {
    marginRight: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  domainPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#C7D2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
  },
  domainPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: '#F3F4F6',
  },
  domainPillText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  domainPillTextActive: {
    color: '#FFFFFF',
  },
  domainPillTextInactive: {
    color: '#6B7280',
  },
});
