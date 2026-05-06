import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Building2, Clock, CheckCircle2, XCircle,
  AlertCircle, Star, FileText, Target, Trash2, MapPin, Briefcase,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';

const STATUS_COLOR: Record<string, string> = {
  Pending:      '#9CA3AF',
  Applied:      '#4F46E5',
  Reviewing:    '#F59E0B',
  Interviewing: '#F97316',
  Shortlisted:  '#6366F1',
  Offered:      '#10B981',
  Accepted:     '#10B981',
  Rejected:     '#EF4444',
  Withdrawn:    '#9CA3AF',
};

const STATUS_VARIANT: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  Pending:      'secondary',
  Applied:      'primary',
  Reviewing:    'warning',
  Interviewing: 'warning',
  Shortlisted:  'primary',
  Offered:      'success',
  Accepted:     'success',
  Rejected:     'danger',
  Withdrawn:    'secondary',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{title}</Text>
      {children}
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`applications/${id}`);
        if (res.data.success) setApplication(res.data.data);
      } catch (err) {
        console.error('Fetch application error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setWithdrawing(true);
              await apiClient.delete(`applications/${id}/withdraw`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to withdraw');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!application) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-400 font-bold">Application not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-600 font-black">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const internship = application.internship || {};
  const statusColor = STATUS_COLOR[application.status] || '#9CA3AF';
  const statusVariant = STATUS_VARIANT[application.status] || 'secondary';

  const canWithdraw = !['Rejected', 'Withdrawn', 'Accepted'].includes(application.status);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-black text-gray-900 tracking-tight">Application</Text>
        </View>
        {canWithdraw && (
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={withdrawing}
            className="flex-row items-center bg-red-50 px-3 py-2 rounded-xl border border-red-100"
          >
            {withdrawing ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Trash2 size={14} color="#EF4444" />
                <Text className="text-red-600 font-black text-[10px] uppercase tracking-widest ml-1.5">Withdraw</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">

          {/* Internship Card */}
          <MotiView from={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-indigo-100 mr-4">
                <Building2 size={22} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-indigo-900 tracking-tight" numberOfLines={1}>
                  {internship.positionTitle || 'Position'}
                </Text>
                <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  {internship.company || application.employer?.companyName || 'Company'}
                </Text>
              </View>
              <Badge variant={statusVariant} size="sm">{application.status}</Badge>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {internship.location && (
                <View className="flex-row items-center bg-white/60 px-3 py-1.5 rounded-xl">
                  <MapPin size={11} color="#6366F1" />
                  <Text className="text-indigo-700 text-[10px] font-bold ml-1">{internship.location}</Text>
                </View>
              )}
              {internship.workEnvironment && (
                <View className="flex-row items-center bg-white/60 px-3 py-1.5 rounded-xl">
                  <Briefcase size={11} color="#6366F1" />
                  <Text className="text-indigo-700 text-[10px] font-bold ml-1">{internship.workEnvironment}</Text>
                </View>
              )}
              {internship.duration && (
                <View className="flex-row items-center bg-white/60 px-3 py-1.5 rounded-xl">
                  <Clock size={11} color="#6366F1" />
                  <Text className="text-indigo-700 text-[10px] font-bold ml-1">{internship.duration}</Text>
                </View>
              )}
            </View>
          </MotiView>

          {/* Match Score */}
          {(application.matchScore > 0 || application.matchAnalysis) && (
            <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100 }} className="bg-gray-900 p-6 rounded-3xl mb-6">
              <View className="flex-row items-center mb-4">
                <Target size={16} color="#818CF8" />
                <Text className="text-indigo-400 font-black text-[10px] uppercase tracking-widest ml-2">Match Score</Text>
                {application.matchAnalysis?.tier && (
                  <View className="ml-auto">
                    <Badge variant="primary" size="sm">{application.matchAnalysis.tier}</Badge>
                  </View>
                )}
              </View>
              <View className="flex-row items-end mb-3">
                <Text className="text-4xl font-black text-white tracking-tighter">
                  {application.matchScore || application.matchAnalysis?.normalizedScore || 0}
                </Text>
                <Text className="text-gray-500 font-bold mb-1 ml-2">/ 100</Text>
              </View>
              <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <View
                  style={{ width: `${application.matchScore || application.matchAnalysis?.normalizedScore || 0}%` }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </View>
            </MotiView>
          )}

          {/* Status Timeline */}
          {application.statusHistory?.length > 0 && (
            <Section title="Status Timeline">
              <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                {[...application.statusHistory].reverse().map((entry: any, i: number) => (
                  <View key={i} className={`flex-row items-start p-4 ${i < application.statusHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-4 mt-0.5" style={{ backgroundColor: `${STATUS_COLOR[entry.status]}20` }}>
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[entry.status] || '#9CA3AF' }} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-gray-900 text-sm">{entry.status}</Text>
                      {entry.comment && (
                        <Text className="text-gray-500 text-xs mt-1 font-medium">{entry.comment}</Text>
                      )}
                    </View>
                    <Text className="text-gray-400 text-[10px] font-bold">
                      {new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Interview Details */}
          {application.interviewDetails?.date && (
            <Section title="Interview Details">
              <View className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                <View className="flex-row items-center mb-3">
                  <Clock size={16} color="#F59E0B" />
                  <Text className="text-amber-900 font-black ml-2">
                    {new Date(application.interviewDetails.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {application.interviewDetails.time && ` at ${application.interviewDetails.time}`}
                  </Text>
                </View>
                {application.interviewDetails.location && (
                  <Text className="text-amber-700 text-sm font-medium">{application.interviewDetails.location}</Text>
                )}
                {application.interviewDetails.notes && (
                  <Text className="text-amber-600 text-xs mt-2 font-medium">{application.interviewDetails.notes}</Text>
                )}
              </View>
            </Section>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <Section title="Your Cover Letter">
              <View className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <View className="flex-row items-center mb-3">
                  <FileText size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest ml-2">
                    Submitted {new Date(application.appliedDate || application.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Text className="text-gray-700 leading-6 font-medium text-sm">{application.coverLetter}</Text>
              </View>
            </Section>
          )}

          {/* View Internship Button */}
          {internship._id && (
            <TouchableOpacity
              onPress={() => router.push(`/internships/${internship._id}` as any)}
              className="bg-white border border-indigo-100 p-5 rounded-2xl flex-row items-center justify-between"
            >
              <Text className="text-indigo-600 font-black text-xs uppercase tracking-widest">View Full Internship</Text>
              <Building2 size={16} color="#4F46E5" />
            </TouchableOpacity>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
