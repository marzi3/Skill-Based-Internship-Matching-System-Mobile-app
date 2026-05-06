import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Send,
    Target,
    User,
    XCircle
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../../src/api/apiClient';
import { Badge } from '../../../src/components/Badge';

const STATUS_COLOR: Record<string, string> = {
  Pending: '#9CA3AF',
  Applied: '#4F46E5',
  Reviewing: '#F59E0B',
  Interviewing: '#F97316',
  Shortlisted: '#6366F1',
  Offered: '#10B981',
  Accepted: '#10B981',
  Rejected: '#EF4444',
  Withdrawn: '#9CA3AF',
};

const STATUS_VARIANT: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  Pending: 'secondary',
  Applied: 'primary',
  Reviewing: 'warning',
  Interviewing: 'warning',
  Shortlisted: 'primary',
  Offered: 'success',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'secondary',
};

const STATUS_ORDER = ['Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Offered', 'Accepted'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50 last:border-b-0">
      <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</Text>
      <Text className="text-gray-900 text-xs font-semibold flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}

function formatDisplayDate(date?: string | Date | null) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatInputDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatInputTime(value: string) {
  const match = /^\s*(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?\s*$/.exec(value);
  if (!match) return '';

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function parseInputDate(value: string) {
  const match = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatInterviewDateForApi(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const normalized = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0
  );
  return normalized.toISOString();
}

function getNextStatus(currentStatus: string) {
  const index = STATUS_ORDER.indexOf(currentStatus);
  if (index === -1 || index >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
}

export default function EmployerApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [interviewDate, setInterviewDate] = useState<Date | null>(null);
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`applications/${id}`);
        if (res.data.success) {
          const data = res.data.data;
          setApplication(data);
          if (data?.interviewDetails?.date) {
            const parsed = new Date(data.interviewDetails.date);
            if (!Number.isNaN(parsed.getTime())) {
              setInterviewDate(parsed);
            }
          }
          setInterviewTime(data?.interviewDetails?.time || '');
          setInterviewLocation(data?.interviewDetails?.location || '');
        }
      } catch (error) {
        console.error('Fetch employer application error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
  }, [id]);

  const statusColor = STATUS_COLOR[application?.status] || '#9CA3AF';
  const statusVariant = STATUS_VARIANT[application?.status] || 'secondary';
  const nextStatus = useMemo(() => getNextStatus(application?.status || ''), [application?.status]);
  const canReject = !['Rejected', 'Accepted'].includes(application?.status);
  const shouldShowInterviewForm = nextStatus === 'Interviewing' || application?.status === 'Interviewing';
  const detailMode = application?.status === 'Interviewing' ? 'update' : 'schedule';

  const submitStatusUpdate = async (status: string) => {
    if (!application?._id) return;

    if (status === 'Interviewing' && !interviewDate) {
      Alert.alert('Interview Date Required', 'Please choose an interview date before scheduling the interview.');
      return;
    }

    try {
      setSavingStatus(true);
      const payload: any = {
        status,
        comment:
          status === 'Rejected'
            ? 'Application rejected by employer.'
            : status === 'Interviewing'
              ? application?.status === 'Interviewing'
                ? 'Interview details updated by employer.'
                : 'Candidate selected for interview.'
              : `Candidate moved to ${status} phase.`,
      };

      if (status === 'Interviewing') {
        payload.interviewDetails = {
          date: formatInterviewDateForApi(interviewDate),
          time: interviewTime.trim(),
          location: interviewLocation.trim(),
        };
      }

      const res = await apiClient.patch(`applications/${application._id}/status`, payload);
      if (res.data.success) {
        setApplication(res.data.data);
        Alert.alert('Saved', 'Application status updated successfully.');
      }
    } catch (error: any) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Could not update application status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReject = () => {
    Alert.alert('Reject Application', 'Reject this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => submitStatusUpdate('Rejected') },
    ]);
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
  const student = application.student || {};

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50">
        <View className="flex-row items-center flex-1 mr-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-gray-900 tracking-tight">Application Review</Text>
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5" numberOfLines={1}>
              {student.name || 'Student'}
            </Text>
          </View>
        </View>
        <Badge variant={statusVariant} size="sm">{application.status}</Badge>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <MotiView
            from={{ opacity: 0, transform: [{ translateY: 10 }] }}
            animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
            className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 mb-6"
          >
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-indigo-100 mr-4">
                <User size={22} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-indigo-900 tracking-tight" numberOfLines={1}>
                  {student.name || 'Student'}
                </Text>
                <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  {student.email || 'No email'}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {application.matchScore != null && (
                <View className="flex-row items-center bg-white/60 px-3 py-1.5 rounded-xl">
                  <Target size={11} color="#6366F1" />
                  <Text className="text-indigo-700 text-[10px] font-bold ml-1">{application.matchScore}% Match</Text>
                </View>
              )}
              {application.status && (
                <View className="flex-row items-center bg-white/60 px-3 py-1.5 rounded-xl">
                  <AlertCircle size={11} color={statusColor} />
                  <Text className="text-indigo-700 text-[10px] font-bold ml-1">{application.status}</Text>
                </View>
              )}
            </View>
          </MotiView>

          <TouchableOpacity
            onPress={() => router.push(`/employer/candidates/${student._id}` as any)}
            className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex-row items-center justify-between mb-6"
          >
            <View className="flex-row items-center flex-1">
              <User size={16} color="#4F46E5" />
              <Text className="text-indigo-600 font-black uppercase tracking-widest text-xs ml-3">View Full Profile</Text>
            </View>
            <ArrowLeft size={16} color="#4F46E5" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <Section title="Internship">
            <View className="bg-white border border-gray-100 rounded-3xl p-5">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center border border-indigo-100 mr-3">
                  <Building2 size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-black text-base" numberOfLines={1}>{internship.positionTitle || 'Position'}</Text>
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
                    {internship.company || application.employer?.companyName || 'Company'}
                  </Text>
                </View>
              </View>
              <InfoRow label="Location" value={internship.location} />
              <InfoRow label="Work Mode" value={internship.workEnvironment} />
              <InfoRow label="Duration" value={internship.duration} />
            </View>
          </Section>

          <Section title="Application Status">
            <View className="bg-gray-900 p-5 rounded-3xl">
              <View className="flex-row items-center mb-3">
                <CheckCircle2 size={16} color="#818CF8" />
                <Text className="text-indigo-400 font-black text-[10px] uppercase tracking-widest ml-2">
                  Current Stage
                </Text>
              </View>
              <Text className="text-white text-2xl font-black tracking-tighter">
                {application.status}
              </Text>
              <Text className="text-gray-400 text-sm font-medium mt-2">
                Use the actions below to advance the application or reject it.
              </Text>
            </View>
          </Section>

          {application.statusHistory?.length > 0 && (
            <Section title="Status Timeline">
              <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                {[...application.statusHistory].reverse().map((entry: any, index: number) => (
                  <View key={index} className={`flex-row items-start p-4 ${index < application.statusHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-4 mt-0.5" style={{ backgroundColor: `${STATUS_COLOR[entry.status] || '#9CA3AF'}20` }}>
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

          {application.interviewDetails?.date && (
            <Section title="Interview Details">
              <View className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                <View className="flex-row items-center mb-3">
                  <Clock size={16} color="#F59E0B" />
                  <Text className="text-amber-900 font-black ml-2">
                    {formatDisplayDate(application.interviewDetails.date)}
                    {application.interviewDetails.time && ` at ${application.interviewDetails.time}`}
                  </Text>
                </View>
                {application.interviewDetails.location && (
                  <Text className="text-amber-700 text-sm font-medium">{application.interviewDetails.location}</Text>
                )}
              </View>
            </Section>
          )}

          {shouldShowInterviewForm && (
            <Section title={detailMode === 'update' ? 'Update Interview Details' : 'Schedule Interview'}>
              <View className="bg-white border border-gray-100 rounded-3xl p-5">
                <Text className="text-gray-500 text-xs font-medium mb-4">
                  The interview details you enter here will be shown to the student.
                </Text>

                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Interview Date</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={formatInputDate(interviewDate)}
                      onChange={(event) => setInterviewDate(parseInputDate(event.target.value))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 16,
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        color: '#111827',
                        fontSize: 14,
                        fontWeight: 500,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                    >
                      <Text className={`font-medium ${interviewDate ? 'text-gray-900' : 'text-gray-400'}`}>
                        {interviewDate ? formatDisplayDate(interviewDate) : 'Choose interview date'}
                      </Text>
                      <Calendar size={18} color="#4F46E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Interview Time</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={formatInputTime(interviewTime)}
                      onChange={(event) => setInterviewTime(event.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 16,
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        color: '#111827',
                        fontSize: 14,
                        fontWeight: 500,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                    >
                      <Text className={`font-medium ${interviewTime ? 'text-gray-900' : 'text-gray-400'}`}>
                        {interviewTime || 'Choose interview time'}
                      </Text>
                      <Clock size={18} color="#4F46E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-2">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Interview Place</Text>
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1.5">
                    <TextInput
                      value={interviewLocation}
                      onChangeText={setInterviewLocation}
                      placeholder="Office / Google Meet / Zoom"
                      placeholderTextColor="#9CA3AF"
                      className="text-gray-900 font-medium py-3"
                    />
                  </View>
                </View>
              </View>
            </Section>
          )}

          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={interviewDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) {
                  setInterviewDate(selected);
                }
              }}
            />
          )}

          {showTimePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) {
                  const hours = selected.getHours();
                  const minutes = String(selected.getMinutes()).padStart(2, '0');
                  setInterviewTime(`${String(hours).padStart(2, '0')}:${minutes}`);
                }
              }}
            />
          )}

          {application.coverLetter && (
            <Section title="Cover Letter">
              <View className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <View className="flex-row items-center mb-3">
                  <FileText size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest ml-2">
                    Submitted {formatDisplayDate(application.appliedDate || application.createdAt)}
                  </Text>
                </View>
                <Text className="text-gray-700 leading-6 font-medium text-sm">{application.coverLetter}</Text>
              </View>
            </Section>
          )}

          <View className="flex-row gap-3">
            {nextStatus && (
              <TouchableOpacity
                onPress={() => submitStatusUpdate(nextStatus)}
                disabled={savingStatus}
                className="flex-1 bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center"
              >
                {savingStatus ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    {nextStatus === 'Interviewing' ? (
                      <Clock size={16} color="white" />
                    ) : (
                      <Send size={16} color="white" />
                    )}
                    <Text className="text-white font-black uppercase tracking-widest text-xs ml-2">
                      {nextStatus === 'Interviewing'
                        ? detailMode === 'update'
                          ? 'Save Interview Details'
                          : 'Schedule Interview'
                        : `Move to ${nextStatus}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canReject && (
              <TouchableOpacity
                onPress={handleReject}
                disabled={savingStatus}
                className="px-5 py-5 rounded-2xl flex-row items-center justify-center bg-red-50 border border-red-100"
              >
                <XCircle size={16} color="#EF4444" />
                <Text className="text-red-600 font-black uppercase tracking-widest text-xs ml-2">Reject</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
