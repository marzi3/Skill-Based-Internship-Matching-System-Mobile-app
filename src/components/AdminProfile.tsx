import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import {
  Activity,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000')
  .replace(/\/$/, '')
  .replace(/\/api\/v1$/, '');

const normalizeUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
};

const STAT_CONFIG = [
  { key: 'totalStudents',     label: 'Students',     icon: GraduationCap, color: '#6366F1', bg: '#EEF2FF' },
  { key: 'totalEmployers',    label: 'Employers',    icon: Building2,     color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'activeInternships', label: 'Internships',  icon: Briefcase,     color: '#10B981', bg: '#ECFDF5' },
  { key: 'totalApplications', label: 'Applications', icon: BookOpen,      color: '#F59E0B', bg: '#FFFBEB' },
] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AdminProfile() {
  const { user, logout } = useAuth();

  const [profile, setProfile]         = useState<any>(null);
  const [stats, setStats]             = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editForm, setEditForm]       = useState({ name: '', phone: '' });
  const [photoUri, setPhotoUri]       = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchData = async () => {
    try {
      const [meRes, dashRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/admin/dashboard'),
      ]);
      if (meRes.data?.data || meRes.data?.user) {
        setProfile(meRes.data.data || meRes.data.user);
      }
      if (dashRes.data?.success) {
        setStats(dashRes.data.data);
      }
    } catch (err) {
      console.error('Admin profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const pickAndUploadPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission required', 'Please allow photo library access.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setUploadingPhoto(true);
      const formData = new FormData() as any;
      if (Platform.OS === 'web') {
        const blob = await fetch(asset.uri).then(r => r.blob());
        formData.append('profilePicture', blob, asset.fileName || `photo-${Date.now()}.jpg`);
      } else {
        formData.append('profilePicture', {
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });
      }
      const res = await apiClient.put('/auth/profile', formData);
      const updated = res.data?.data || res.data?.user;
      if (updated?.profilePicture) {
        setProfile((p: any) => ({ ...p, profilePicture: updated.profilePicture }));
      }
      Alert.alert('Updated', 'Profile photo updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        logout();
      }
      return;
    }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const openEdit = () => {
    setEditForm({
      name:  profile?.name  || user?.name  || '',
      phone: profile?.phone || '',
    });
    setEditVisible(true);
  };

  const saveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    try {
      setSaving(true);
      const res = await apiClient.put('/auth/profile', {
        name:  editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      if (res.data?.data || res.data?.user) {
        setProfile(res.data.data || res.data.user);
      }
      setEditVisible(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mt-4">Loading Profile</Text>
      </View>
    );
  }

  const displayName   = profile?.name  || user?.name  || 'Admin';
  const displayEmail  = profile?.email || user?.email || '';
  const displayPhone  = profile?.phone || '';
  const joinedDate    = profile?.createdAt ? formatDate(profile.createdAt) : '—';
  const isVerified    = profile?.isVerified ?? false;
  const accountStatus = profile?.status || 'approved';
  const recentApps    = stats?.recentActivity?.applications || [];
  const recentInterns = stats?.recentActivity?.internships  || [];

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={{ backgroundColor: '#1E1B4B' }} className="pb-8">
          {/* Top bar */}
          <View className="flex-row items-center justify-between px-6 pt-6 mb-6">
            <View className="flex-row items-center">
              <ShieldCheck size={16} color="#A5B4FC" />
              <Text style={{ color: '#A5B4FC' }} className="text-[10px] font-black uppercase tracking-widest ml-1.5">Admin Console</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={openEdit}
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Edit2 size={15} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Settings size={15} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar + name */}
          <View className="items-center px-6">
            <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploadingPhoto} style={{ marginBottom: 16 }}>
              <View style={{ width: 96, height: 96, borderRadius: 24 }}>
                {photoUri || profile?.profilePicture ? (
                  <Image
                    source={{ uri: photoUri || normalizeUrl(profile.profilePicture) }}
                    style={{ width: 96, height: 96, borderRadius: 24 }}
                  />
                ) : (
                  <View style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 30 }}>{getInitials(displayName)}</Text>
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: 10, backgroundColor: uploadingPhoto ? '#6366F1' : '#1E1B4B', borderWidth: 2, borderColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center' }}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color="white" />
                    : <Camera size={13} color="white" />}
                </View>
              </View>
            </TouchableOpacity>
            <Text className="text-white font-black text-2xl text-center">{displayName}</Text>
            <View className="flex-row items-center mt-1.5">
              <Mail size={12} color="#A5B4FC" />
              <Text style={{ color: '#A5B4FC' }} className="text-xs font-medium ml-1.5">{displayEmail}</Text>
            </View>

            {/* Badges row */}
            <View className="flex-row gap-2 mt-4">
              <View className="flex-row items-center bg-indigo-500 px-3 py-1.5 rounded-full">
                <ShieldCheck size={11} color="white" />
                <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-1">Administrator</Text>
              </View>
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                {isVerified
                  ? <CheckCircle2 size={11} color="white" />
                  : <XCircle size={11} color="white" />}
                <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-1">
                  {isVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>

            {/* Joined date */}
            <View className="flex-row items-center mt-3">
              <Calendar size={11} color="#6B7280" />
              <Text className="text-gray-400 text-[10px] font-medium ml-1.5">Joined {joinedDate}</Text>
            </View>
          </View>
        </View>

        <View className="px-6">

          {/* ── Account Info ── */}
          <View className="bg-white rounded-3xl border border-gray-100 mt-5 mb-4 overflow-hidden">
            <View className="px-5 pt-4 pb-2">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Account Details</Text>
            </View>
            <InfoRow icon={ShieldCheck} label="Role"   value="Administrator" color="#6366F1" />
            <InfoRow icon={CheckCircle2} label="Status"
              value={accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
              color={accountStatus === 'approved' ? '#10B981' : '#F59E0B'}
            />
            {displayPhone ? (
              <InfoRow icon={Phone} label="Phone" value={displayPhone} color="#6B7280" />
            ) : null}
            <InfoRow icon={Calendar} label="Member Since" value={joinedDate} color="#6B7280" last />
          </View>

          {/* ── Platform Stats ── */}
          {stats && (
            <View className="mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Platform Overview</Text>
              <View className="flex-row flex-wrap gap-3">
                {STAT_CONFIG.map(s => {
                  const Icon = s.icon;
                  return (
                    <View
                      key={s.key}
                      className="flex-1 bg-white rounded-2xl border border-gray-100 px-4 py-4"
                      style={{ minWidth: '45%' }}
                    >
                      <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                        <Icon size={16} color={s.color} />
                      </View>
                      <Text className="text-gray-900 font-black text-2xl">{stats[s.key] ?? 0}</Text>
                      <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Match Success Rate ── */}
          {stats?.matchSuccessRate !== undefined && (
            <View className="bg-white rounded-3xl border border-gray-100 mb-4 px-5 py-4 flex-row items-center">
              <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mr-4">
                <Activity size={22} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-black text-2xl">{stats.matchSuccessRate}%</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Match Success Rate</Text>
              </View>
            </View>
          )}

          {/* ── Recent Applications ── */}
          {recentApps.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Recent Applications</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/applications' as any)}>
                  <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">View All</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                {recentApps.slice(0, 5).map((app: any, i: number) => (
                  <View
                    key={app._id || i}
                    className={`px-5 py-4 flex-row items-center ${i < recentApps.length - 1 && i < 4 ? 'border-b border-gray-50' : ''}`}
                  >
                    <View className="w-9 h-9 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                      <BookOpen size={15} color="#6366F1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>
                        {app.internship?.position || app.position || 'Internship'}
                      </Text>
                      <Text className="text-gray-400 text-[10px] font-medium mt-0.5" numberOfLines={1}>
                        {app.student?.name || 'Student'} · {app.internship?.company || app.company || ''}
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-2">
                      <Clock size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[10px] ml-1">
                        {app.createdAt ? timeAgo(app.createdAt) : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Recent Internships ── */}
          {recentInterns.length > 0 && (
            <View className="mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Recent Internships</Text>
              <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                {recentInterns.slice(0, 5).map((intern: any, i: number) => (
                  <View
                    key={intern._id || i}
                    className={`px-5 py-4 flex-row items-center ${i < recentInterns.length - 1 && i < 4 ? 'border-b border-gray-50' : ''}`}
                  >
                    <View className="w-9 h-9 bg-sky-50 rounded-xl items-center justify-center mr-3">
                      <Briefcase size={15} color="#0EA5E9" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>
                        {intern.position || 'Internship'}
                      </Text>
                      <Text className="text-gray-400 text-[10px] font-medium mt-0.5" numberOfLines={1}>
                        {intern.employer?.companyName || intern.companyName || 'Company'}
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-2">
                      <Clock size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[10px] ml-1">
                        {intern.createdAt ? timeAgo(intern.createdAt) : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Actions ── */}
          <View className="bg-white rounded-3xl border border-gray-100 mb-4 overflow-hidden">
            <ActionItem icon={Edit2}    label="Edit Profile"  color="#6366F1" bg="#EEF2FF"  onPress={openEdit} />
            <ActionItem icon={Settings} label="Settings"      color="#6B7280" bg="#F3F4F6"  onPress={() => router.push('/settings' as any)} />
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 rounded-3xl px-5 py-5 flex-row items-center mb-4"
          >
            <View className="w-9 h-9 bg-red-100 rounded-xl items-center justify-center mr-4">
              <LogOut size={16} color="#EF4444" />
            </View>
            <Text className="text-red-500 font-black text-sm uppercase tracking-widest flex-1">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 bg-indigo-50 rounded-2xl items-center justify-center mr-3">
                <Edit2 size={18} color="#6366F1" />
              </View>
              <View>
                <Text className="text-gray-900 font-black text-lg">Edit Profile</Text>
                <Text className="text-gray-400 text-xs font-medium">Update your admin account details</Text>
              </View>
            </View>

            <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</Text>
            <TextInput
              value={editForm.name}
              onChangeText={v => setEditForm(f => ({ ...f, name: v }))}
              placeholder="Your full name"
              placeholderTextColor="#D1D5DB"
              className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium mb-4"
            />

            <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</Text>
            <TextInput
              value={editForm.phone}
              onChangeText={v => setEditForm(f => ({ ...f, phone: v }))}
              placeholder="+94 77 123 4567"
              placeholderTextColor="#D1D5DB"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium mb-6"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditVisible(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="text-gray-700 font-black text-xs uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveProfile}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 items-center"
              >
                {saving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text className="text-white font-black text-xs uppercase tracking-widest">Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ icon: Icon, label, value, color, last }: {
  icon: any; label: string; value: string; color: string; last?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-5 py-4 ${!last ? 'border-b border-gray-50' : ''}`}>
      <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} color={color} />
      </View>
      <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest w-24">{label}</Text>
      <Text className="text-gray-900 text-sm font-bold flex-1 text-right" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionItem({ icon: Icon, label, color, bg, onPress }: {
  icon: any; label: string; color: string; bg: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-5 py-4 border-b border-gray-50"
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: bg }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-gray-900 font-black text-sm uppercase tracking-widest flex-1">{label}</Text>
      <Text className="text-gray-300 text-lg">›</Text>
    </TouchableOpacity>
  );
}
