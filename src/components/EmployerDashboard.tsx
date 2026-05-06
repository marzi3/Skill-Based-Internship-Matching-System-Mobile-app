import { router } from 'expo-router';
import {
  Activity,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Moon,
  Plus,
  Sun,
  Sunrise,
  Users
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { StatsCard } from './StatsCard';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, color: '#F59E0B' };
  if (hour < 18) return { text: 'Good afternoon', icon: Sun, color: '#F97316' };
  return { text: 'Good evening', icon: Moon, color: '#6366F1' };
};

export const EmployerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postings, setPostings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    internships: 0,
    applicants: 0,
    skillMatches: 0,
    interviews: 0,
  });

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const isWeb = Platform.OS === 'web';

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/internships/my-postings');
      if (res.data.success) {
        const internships = res.data.data || [];
        setPostings(internships);
        
        const totalApplicants = internships.reduce((sum: number, i: any) => sum + (i.applicants?.length || 0), 0);
        setStats({
          internships: internships.length,
          applicants: totalApplicants,
          skillMatches: Math.floor(totalApplicants * 0.4), // Mocked logic as in web
          interviews: internships.reduce((sum: number, i: any) => sum + (i.interviews || 0), 0),
        });
      }
    } catch (err) {
      console.error('Employer dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = async (posting: any) => {
    try {
      setDeletingId(posting._id);
      const res = await apiClient.delete(`/internships/${posting._id}`);
      if (res.data?.success) {
        setPostings((current) => current.filter((item) => item._id !== posting._id));
        setStats((current) => ({
          ...current,
          internships: Math.max(0, current.internships - 1),
          applicants: Math.max(0, current.applicants - (posting.applicants?.length || 0)),
        }));
        Alert.alert('Deleted', 'Internship removed successfully.');
      }
    } catch (error: any) {
      Alert.alert('Delete failed', error.response?.data?.message || 'Could not delete internship');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (posting: any) => {
    Alert.alert(
      'Delete internship',
      `Delete ${posting.positionTitle}? This will close the posting and hide it from applicants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(posting) },
      ]
    );
  };

  return (
    <ScrollView 
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center' }}>
      {/* Header */}
      <View className="px-6 py-4 md:px-8 md:py-6 flex-row justify-between items-center">
        <View>
          <View className="flex-row items-center">
            <GreetingIcon size={20} color={greeting.color} />
            <Text className="text-gray-500 font-bold ml-2 text-xs uppercase tracking-widest">
              {greeting.text}
            </Text>
          </View>
          <Text className="text-2xl md:text-3xl font-black text-gray-900">
            {user?.name?.split(' ')[0] || 'Employer'}
          </Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity 
            onPress={() => router.push('/notifications' as any)}
            className="p-2 bg-gray-50 rounded-full"
          >
            <Bell size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="px-6 py-4 md:px-8">
        <View className="flex-row flex-wrap justify-between gap-y-4">
          <View className="w-[48%] md:w-[24%]">
            <StatsCard 
              title="Postings" 
              value={stats.internships} 
              icon={Briefcase} 
              variant="primary" 
            />
          </View>
          <View className="w-[48%] md:w-[24%]">
            <StatsCard 
              title="Applicants" 
              value={stats.applicants} 
              icon={Users} 
            />
          </View>
          <View className="w-[48%] md:w-[24%]">
            <StatsCard 
              title="Matches" 
              value={stats.skillMatches} 
              icon={CheckCircle2} 
            />
          </View>
          <View className="w-[48%] md:w-[24%]">
            <StatsCard 
              title="Interviews" 
              value={stats.interviews} 
              icon={Calendar} 
            />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-4 md:px-8">
        <TouchableOpacity 
          onPress={() => router.push('/employer/post-internship' as any)}
          className="bg-gray-900 p-5 md:p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-gray-200"
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
              <Plus size={20} color="white" />
            </View>
            <Text className="text-white font-black ml-4 uppercase tracking-widest text-xs">Post New Internship</Text>
          </View>
          <ChevronRight size={18} color="white" opacity={0.5} />
        </TouchableOpacity>
      </View>

      {/* Live Postings */}
      <View className="px-6 py-4 md:px-8">
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Activity size={18} color="#4F46E5" />
            <Text className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight ml-2">My Postings</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/employer/post-internship' as any)}>
            <Text className="text-indigo-600 font-bold text-xs">Create New</Text>
          </TouchableOpacity>
        </View>

        {postings.length > 0 ? (
          postings.map((p: any, idx) => (
            <MotiView 
              key={p._id}
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 100 }}
              className="bg-white p-5 md:p-6 rounded-[32px] border border-gray-100 shadow-sm mb-4"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
                    {p.positionTitle}
                  </Text>
                  <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Expires {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'Not set'}
                  </Text>
                </View>
                <Badge variant={p.status === 'Hiring' ? 'success' : 'warning'} size="sm">
                  {p.status}
                </Badge>
              </View>

              <Text className="text-gray-500 text-xs leading-5 mb-4" numberOfLines={2}>
                {p.location || 'No location'} • {p.workEnvironment || 'Remote'} • {p.domain || 'General'}
              </Text>

              <View className={`pt-4 border-t border-gray-50 ${isWeb ? 'flex-row items-center justify-between' : 'flex-row items-center justify-between flex-wrap gap-2'}`}>
                <View className="flex-row items-center">
                  <Users size={14} color="#6B7280" />
                  <Text className="text-gray-900 font-black ml-2 text-sm">{p.applicants?.length || 0}</Text>
                  <Text className="text-gray-500 font-medium ml-1 text-xs">Applicants</Text>
                </View>

                <View className={`flex-row items-center ${isWeb ? 'space-x-2' : 'gap-2'}`}>
                  <TouchableOpacity 
                    onPress={() => router.push(`/employer/internships/${p._id}/applicants` as any)}
                    className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100"
                  >
                    <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Review</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push(`/employer/post-internship?id=${p._id}` as any)}
                    className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <Text className="text-gray-700 font-black text-[10px] uppercase tracking-widest">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={deletingId === p._id}
                    onPress={() => confirmDelete(p)}
                    className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100"
                  >
                    <Text className="text-rose-600 font-black text-[10px] uppercase tracking-widest">
                      {deletingId === p._id ? 'Deleting' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </MotiView>
          ))
        ) : (
          <View className="py-12 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 items-center justify-center">
             <Briefcase size={32} color="#D1D5DB" />
             <Text className="text-gray-400 font-bold mt-4 uppercase tracking-widest text-[10px]">No active postings</Text>
          </View>
        )}
      </View>

      <View className="h-20" />
      </View>
    </ScrollView>
  );
};
