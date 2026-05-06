import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Building2, CalendarDays, CheckCircle2, Edit2, FileText, Globe, Image as ImageIcon, LogOut, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';
import { useAuth } from '../../src/context/AuthContext';

type FieldProps = {
  icon: any;
  label: string;
  value?: string | number | null;
};

function Field({ icon: Icon, label, value }: FieldProps) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <View className="bg-white border border-gray-100 rounded-3xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center mb-2">
        <View className="w-9 h-9 bg-indigo-50 rounded-xl items-center justify-center mr-3">
          <Icon size={16} color="#4F46E5" />
        </View>
        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</Text>
      </View>
      <Text className="text-gray-900 text-base font-bold leading-6">{hasValue ? String(value) : '—'}</Text>
    </View>
  );
}

const normalizeFileUrl = (filePath?: string | null) => {
  if (!filePath) return '';
  const fp = String(filePath);
  if (/^https?:\/\//i.test(fp)) return fp;
  const rawBase = String(apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  const root = rawBase || 'http://localhost:5000';
  return root + (fp.startsWith('/') ? '' : '/') + fp;
};

export default function EmployerProfileScreen() {
  const { user, logout } = useAuth();

  const coverUri = normalizeFileUrl(user?.coverImage);
  const profileUri = normalizeFileUrl(user?.profilePicture);

  const verificationVariant = user?.verificationStatus === 'approved'
    ? 'success'
    : user?.verificationStatus === 'rejected'
      ? 'danger'
      : 'warning';

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Do you want to log out of your employer account?') : true;
      if (confirmed) {
        void logout();
      }
      return;
    }

    Alert.alert(
      'Log out',
      'Do you want to log out of your employer account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="h-64 relative overflow-hidden bg-gray-900">
          <LinearGradient colors={['#4F46E5', '#9333EA']} className="h-full w-full absolute" />
          {coverUri ? (
            <Image source={{ uri: coverUri }} className="absolute top-0 left-0 h-full w-full" resizeMode="cover" />
          ) : null}

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)' as any)}
            className="absolute top-12 left-6 bg-black/25 border border-white/20 rounded-full px-4 py-2 z-10"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-widest">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/employer/edit-profile' as any)}
            className="absolute top-12 right-6 bg-white/15 border border-white/20 rounded-full px-4 py-2 flex-row items-center z-10"
          >
            <Edit2 size={12} color="white" />
            <Text className="text-white font-bold text-xs uppercase tracking-widest ml-2">Edit</Text>
          </TouchableOpacity>

          <View className="absolute bottom-0 left-6 right-6 flex-row items-end z-20">
            <View className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl border border-gray-100">
              <View className="w-full h-full rounded-2xl bg-indigo-50 items-center justify-center overflow-hidden">
                {profileUri ? (
                  <Image source={{ uri: profileUri }} className="w-full h-full" />
                ) : (
                  <Building2 size={44} color="#4F46E5" />
                )}
              </View>
            </View>

            <View className="ml-4 mb-2 flex-1">
              <Text className="text-2xl font-black text-white tracking-tight" numberOfLines={1}>
                {user?.companyName || user?.name || 'Employer Profile'}
              </Text>
              <View className="flex-row items-center gap-2 flex-wrap mt-2">
                <Badge variant={verificationVariant as any} size="sm">
                  {user?.verificationStatus || 'unverified'}
                </Badge>
                <Badge variant="primary" size="sm">
                  employer
                </Badge>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 py-6">
          <Field icon={User} label="Contact Person" value={user?.name} />
          <Field icon={Building2} label="Company Name" value={user?.companyName} />
          <Field icon={FileText} label="Company Description" value={user?.companyDescription} />
          <Field icon={Mail} label="Email" value={user?.email} />
          <Field icon={Phone} label="Phone" value={user?.phone} />
          <Field icon={Globe} label="Website" value={user?.website} />
          <Field icon={MapPin} label="Location" value={user?.location} />
          <Field icon={CheckCircle2} label="Industry" value={user?.industry} />
          <Field icon={Building2} label="Company Size" value={user?.companySize} />
          <Field icon={CalendarDays} label="Founded Year" value={user?.foundedYear} />
          <Field icon={ShieldCheck} label="Position in Company" value={user?.positionInCompany} />
          <Field icon={FileText} label="Business Registration Number" value={user?.businessRegistrationNumber} />

          <View className="bg-white border border-gray-100 rounded-3xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="w-9 h-9 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                <ImageIcon size={16} color="#4F46E5" />
              </View>
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">Business Document</Text>
            </View>
            <Text className="text-gray-900 text-base font-bold leading-6">
              {user?.businessDocument ? 'Uploaded' : '—'}
            </Text>
          </View>

          <View className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="w-9 h-9 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                <ShieldCheck size={16} color="#4F46E5" />
              </View>
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">Verification</Text>
            </View>
            <Text className="text-gray-900 text-base font-bold leading-6">{user?.verificationStatus || 'unverified'}</Text>
            {user?.verificationFeedback ? (
              <Text className="text-gray-500 text-sm leading-5 mt-2">{user.verificationFeedback}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="mt-4 bg-rose-50 border border-rose-100 rounded-3xl p-4 flex-row items-center justify-center"
          >
            <LogOut size={16} color="#E11D48" />
            <Text className="ml-2 text-rose-600 font-black text-xs uppercase tracking-widest">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}