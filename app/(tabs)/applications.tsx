import { router } from 'expo-router';
import { AlertCircle, Briefcase, Building2, CheckCircle2, ChevronRight, Clock, Search, Star, XCircle } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';
import { useAuth } from '../../src/context/AuthContext';

const STATUS_FILTERS = ['All', 'Pending', 'Applied', 'Reviewing', 'Interviewing', 'Shortlisted', 'Offered', 'Rejected', 'Withdrawn'];

const STATUS_META: Record<string, { variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; icon: any; color: string }> = {
  Pending:     { variant: 'secondary', icon: Clock,         color: '#9CA3AF' },
  Applied:     { variant: 'primary',   icon: Briefcase,     color: '#4F46E5' },
  Reviewing:   { variant: 'warning',   icon: AlertCircle,   color: '#F59E0B' },
  Interviewing:{ variant: 'warning',   icon: Star,          color: '#F97316' },
  Shortlisted: { variant: 'primary',   icon: Star,          color: '#6366F1' },
  Offered:     { variant: 'success',   icon: CheckCircle2,  color: '#10B981' },
  Accepted:    { variant: 'success',   icon: CheckCircle2,  color: '#10B981' },
  Rejected:    { variant: 'danger',    icon: XCircle,       color: '#EF4444' },
  Withdrawn:   { variant: 'secondary', icon: XCircle,       color: '#9CA3AF' },
};

function ApplicationCard({ item, index, isEmployer }: { item: any; index: number; isEmployer: boolean }) {
  const meta = STATUS_META[item.status] || STATUS_META['Pending'];
  const Icon = meta.icon;
  const title = isEmployer
    ? (item.student?.name || 'Student')
    : (item.internship?.positionTitle || 'Position');
  const subtitle = isEmployer
    ? (item.internship?.positionTitle || item.internship?.domain || 'Internship')
    : (item.internship?.company || item.employer?.companyName || 'Company');
  const detailPath = isEmployer ? `/employer/applications/${item._id}` : `/applications/${item._id}`;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 60 }}
    >
      <TouchableOpacity
        onPress={() => router.push(detailPath as any)}
        className="bg-white mx-6 mb-4 p-5 rounded-3xl border border-gray-100 shadow-sm"
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="w-11 h-11 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100 mr-4">
            <Building2 size={20} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
              {subtitle}
            </Text>
          </View>
          <ChevronRight size={16} color="#D1D5DB" />
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center">
            <Icon size={12} color={meta.color} />
            <Badge variant={meta.variant} size="sm">
              {item.status}
            </Badge>
          </View>
          <Text className="text-gray-400 text-[10px] font-bold">
            {new Date(item.appliedDate || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {item.matchScore > 0 && (
          <View className="mt-3 flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-xl self-start border border-indigo-100">
            <Star size={10} color="#4F46E5" fill="#4F46E5" />
            <Text className="text-indigo-700 font-black text-[10px] ml-1.5 uppercase tracking-widest">
              {item.matchScore}% Match
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const isEmployer = user?.role === 'employer';

  const fetchApplications = async () => {
    try {
      const endpoint = isEmployer ? 'applications/employer' : 'applications/student';
      const res = await apiClient.get(endpoint);
      if (res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch applications error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchApplications();
  }, [user, isEmployer]);

  useEffect(() => {
    let result = applications;
    if (activeFilter !== 'All') result = result.filter(a => a.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.student?.name?.toLowerCase().includes(q) ||
        a.internship?.positionTitle?.toLowerCase().includes(q) ||
        a.internship?.company?.toLowerCase().includes(q) ||
        a.employer?.companyName?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [applications, activeFilter, search]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchApplications(); }, []);

  if (isEmployer) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-black text-gray-900 tracking-tighter">
            Received Applications
          </Text>
          <Text className="text-gray-500 font-bold text-xs mt-1 uppercase tracking-widest">
            {applications.length} total submissions
          </Text>
        </View>

        <View className="px-6 py-3">
          <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 border border-gray-100">
            <Search size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-3 px-3 text-gray-900 font-bold text-sm"
              placeholder="Search by student or internship..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View className="pb-3">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={STATUS_FILTERS}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            renderItem={({ item }) => {
              const count = item === 'All' ? applications.length : applications.filter(a => a.status === item).length;
              return (
                <TouchableOpacity
                  onPress={() => setActiveFilter(item)}
                  className={`mr-2 px-4 py-2 rounded-2xl border flex-row items-center ${activeFilter === item ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-100'}`}
                >
                  <Text className={`font-black text-[10px] uppercase tracking-widest ${activeFilter === item ? 'text-white' : 'text-gray-500'}`}>
                    {item}
                  </Text>
                  {count > 0 && (
                    <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${activeFilter === item ? 'bg-white/20' : 'bg-indigo-50'}`}>
                      <Text className={`text-[8px] font-black ${activeFilter === item ? 'text-white' : 'text-indigo-600'}`}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            renderItem={({ item, index }) => <ApplicationCard item={item} index={index} isEmployer />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20 mx-6">
                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-dashed border-gray-200">
                  <Briefcase size={32} color="#D1D5DB" />
                </View>
                <Text className="text-gray-900 font-black text-base">No applications yet</Text>
                <Text className="text-gray-400 text-sm mt-2 text-center font-medium">
                  {search || activeFilter !== 'All' ? 'Try adjusting your filters' : 'Applications will appear here when students apply'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-black text-gray-900 tracking-tighter">
          My Applications
        </Text>
        <Text className="text-gray-500 font-bold text-xs mt-1 uppercase tracking-widest">
          {applications.length} total submissions
        </Text>
      </View>

      {/* Search */}
      <View className="px-6 py-3">
        <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 border border-gray-100">
          <Search size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-900 font-bold text-sm"
            placeholder="Search by position or company..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View className="pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          renderItem={({ item }) => {
            const count = item === 'All' ? applications.length : applications.filter(a => a.status === item).length;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item)}
                className={`mr-2 px-4 py-2 rounded-2xl border flex-row items-center ${activeFilter === item ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-100'}`}
              >
                <Text className={`font-black text-[10px] uppercase tracking-widest ${activeFilter === item ? 'text-white' : 'text-gray-500'}`}>
                  {item}
                </Text>
                {count > 0 && (
                  <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${activeFilter === item ? 'bg-white/20' : 'bg-indigo-50'}`}>
                    <Text className={`text-[8px] font-black ${activeFilter === item ? 'text-white' : 'text-indigo-600'}`}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item, index }) => <ApplicationCard item={item} index={index} isEmployer={false} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 mx-6">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-dashed border-gray-200">
                <Briefcase size={32} color="#D1D5DB" />
              </View>
              <Text className="text-gray-900 font-black text-base">No applications yet</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center font-medium">
                {search || activeFilter !== 'All' ? 'Try adjusting your filters' : 'Start exploring internships to apply'}
              </Text>
              {!search && activeFilter === 'All' && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/explore' as any)}
                  className="mt-6 bg-indigo-600 px-8 py-4 rounded-2xl"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-widest">Explore Internships</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
