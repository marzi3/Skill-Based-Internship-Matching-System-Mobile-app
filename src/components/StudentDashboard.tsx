import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { 
  Zap, 
  Briefcase, 
  Star, 
  Sunrise, 
  Sun, 
  Moon, 
  Bell, 
  ChevronRight,
  ArrowRight
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { StatsCard } from './StatsCard';
import { ProfileStrengthRing } from './ProfileStrengthRing';
import { RecommendedInternships } from './RecommendedInternships';
import { router } from 'expo-router';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, color: '#F59E0B' };
  if (hour < 18) return { text: 'Good afternoon', icon: Sun, color: '#F97316' };
  return { text: 'Good evening', icon: Moon, color: '#6366F1' };
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    applicationsCount: 0,
    skillMatches: 0,
    verificationPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const fetchData = async () => {
    try {
      const [matchesRes, statsRes, appsRes] = await Promise.all([
        apiClient.get('matching/best-matches'),
        apiClient.get('applications/student/stats'),
        apiClient.get('applications/student')
      ]);

      if (matchesRes.data.success) setMatches(matchesRes.data.data?.slice(0, 6) || []);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (appsRes.data.success) setApplications(appsRes.data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      console.error('Student dashboard fetch error:', msg);
      // Only alert if it's not a background refresh
      if (!refreshing) {
        // Alert.alert('Error', msg); // Removed to avoid annoying popups, but logged
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScrollView 
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View>
          <View className="flex-row items-center">
            <GreetingIcon size={20} color={greeting.color} />
            <Text className="text-gray-500 font-bold ml-2 text-xs uppercase tracking-widest">
              {greeting.text}
            </Text>
          </View>
          <Text className="text-2xl font-black text-gray-900">
            {user?.name?.split(' ')[0] || 'Student'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/notifications' as any)}
          className="p-2 bg-gray-50 rounded-full"
        >
          <Bell size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View className="px-6 py-4 gap-4">
         <View className="flex-row gap-4">
           <StatsCard 
             title="Active Apps" 
             value={stats.applicationsCount} 
             icon={Briefcase} 
             variant="primary" 
           />
           <StatsCard 
             title="AI Matches" 
             value={stats.skillMatches} 
             icon={Zap} 
           />
         </View>
         <View className="flex-row gap-4">
           <StatsCard 
             title="Verifications" 
             value={stats.verificationPoints} 
             icon={Star} 
           />
           <View className="flex-1 h-32 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center justify-center">
              <ProfileStrengthRing percentage={Math.min(100, stats.verificationPoints)} size={70} strokeWidth={6} />
              <Text className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-2">Readiness</Text>
           </View>
         </View>
      </View>

      {/* Recommended Internships */}
      <View className="py-6">
        <View className="px-6 flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Zap size={18} color="#4F46E5" fill="#4F46E5" />
            <Text className="text-lg font-black text-gray-900 ml-2 uppercase tracking-tight">Recommended</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/explore' as any)}>
            <Text className="text-indigo-600 font-bold text-xs">View All</Text>
          </TouchableOpacity>
        </View>
        <RecommendedInternships matches={matches} />
      </View>

      {/* Recent Applications */}
      <View className="px-6 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-black text-gray-900 uppercase tracking-tight">Recent Applications</Text>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-bold text-xs">History</Text>
          </TouchableOpacity>
        </View>

        {applications.length > 0 ? (
          applications.slice(0, 3).map((app: any, idx) => (
            <MotiView 
              key={app._id}
              from={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 100 }}
              className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm mb-3 flex-row items-center"
            >
              <View className="w-10 h-10 bg-indigo-50 rounded-lg items-center justify-center mr-4">
                <Briefcase size={20} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
                  {app.internship?.positionTitle || 'Position'}
                </Text>
                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                  {app.employer?.companyName || 'Company'}
                </Text>
              </View>
              <View className="items-end">
                <View className="bg-indigo-50 px-2 py-1 rounded-md mb-1">
                  <Text className="text-indigo-600 text-[10px] font-bold">{app.status}</Text>
                </View>
                <Text className="text-gray-400 text-[9px]">{new Date(app.createdAt).toLocaleDateString()}</Text>
              </View>
            </MotiView>
          ))
        ) : (
           <View className="py-10 items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <Text className="text-gray-400 font-medium italic">No applications found</Text>
           </View>
        )}
      </View>

      <View className="h-20" />
    </ScrollView>
  );
};
