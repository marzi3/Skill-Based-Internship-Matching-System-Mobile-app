import { router } from 'expo-router';
import { Edit2, Lock, User } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  info: any;
  user?: any;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
      <Text className="text-gray-900 text-sm font-black uppercase">{label}</Text>
      <Text className="text-gray-900 text-sm font-black flex-1 text-right ml-4" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LockedRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
      <View className="flex-row items-center">
        <Text className="text-gray-900 text-sm font-black uppercase">{label}</Text>
        <Lock size={11} color="#111827" style={{ marginLeft: 4 }} />
      </View>
      <Text className="text-gray-900 text-sm font-black flex-1 text-right ml-4" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PersonalInfoSection({ info, user }: Props) {
  const hasContent =
    user?.name || user?.email ||
    info?.about || info?.gpa || info?.location || info?.phone ||
    info?.dateOfBirth || info?.age !== undefined;

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <User size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">
            Personal Info
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/personal' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Edit</Text>
        </TouchableOpacity>
      </View>

      {info?.about ? (
        <Text className="text-gray-900 leading-6 font-bold text-base mb-4">{info.about}</Text>
      ) : null}

      {hasContent ? (
        <View className="bg-gray-50 rounded-3xl px-5 border border-gray-100">
          {user?.name  && <LockedRow label="Name"  value={user.name} />}
          {user?.email && <LockedRow label="Email" value={user.email} />}
          {info?.dateOfBirth && (
            <Row label="Date of Birth" value={new Date(info.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
          )}
          {info?.age !== undefined && info?.age !== null && (
            <Row label="Age" value={`${info.age} years old`} />
          )}
          {info?.gpa                         && <Row label="GPA"              value={info.gpa} />}
          {info?.location                    && <Row label="Location"         value={info.location} />}
          {info?.phone                       && <Row label="Phone"            value={info.phone} />}
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/personal' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add personal information...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
