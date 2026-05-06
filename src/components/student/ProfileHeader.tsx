import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Camera, MapPin, Settings, User } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../Badge';

interface Props {
  user: any;
  personalInfo?: any;
  profileImage?: any;
  coverImage?: any;
  onEditProfilePhoto?: () => void;
  onEditCoverPhoto?: () => void;
  onBellPress: () => void;
  onSettingsPress: () => void;
}

export function ProfileHeader({
  user,
  personalInfo,
  profileImage,
  coverImage,
  onEditProfilePhoto,
  onEditCoverPhoto,
  onBellPress,
  onSettingsPress,
}: Props) {
  const getServerRoot = () => {
    const base = String(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    return base.replace(/\/api\/v1\/?$/i, '') || base;
  };

  const normalizeFileUrl = (filePath?: string | null) => {
    if (!filePath) return '';
    const fp = String(filePath);
    if (/^https?:\/\//i.test(fp)) return fp;
    const root = getServerRoot();
    return root + (fp.startsWith('/') ? '' : '/') + fp;
  };

  const coverUri = normalizeFileUrl(coverImage?.filePath);
  const profileUri = normalizeFileUrl(profileImage?.filePath || user?.profilePicture);

  return (
    <View className="h-64 relative overflow-hidden">
      {coverUri ? (
        <Image source={{ uri: coverUri }} className="absolute top-0 left-0 h-48 w-full" resizeMode="cover" />
      ) : null}
      <LinearGradient
        colors={coverUri ? ['rgba(17,24,39,0.35)', 'rgba(79,70,229,0.35)'] : ['#4F46E5', '#9333EA']}
        className="h-48 w-full"
      />

      <TouchableOpacity
        onPress={onEditCoverPhoto}
        className="absolute right-6 top-40 bg-black/45 border border-white/20 rounded-full p-2"
      >
        <Camera size={14} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onBellPress} className="absolute top-12 left-6 p-2 bg-white/20 rounded-full">
        <Bell size={20} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onSettingsPress} className="absolute top-12 right-6 p-2 bg-white/20 rounded-full">
        <Settings size={20} color="white" />
      </TouchableOpacity>

      <View className="absolute bottom-0 left-6 flex-row items-end">
        <View className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl border border-gray-100">
          <View className="w-full h-full rounded-2xl bg-indigo-50 items-center justify-center overflow-hidden">
            {profileUri
              ? <Image source={{ uri: profileUri }} className="w-full h-full" />
              : <User size={48} color="#4F46E5" />}
          </View>
          <TouchableOpacity
            onPress={onEditProfilePhoto}
            className="absolute -right-1 -bottom-1 bg-indigo-600 border-2 border-white rounded-full p-2"
          >
            <Camera size={12} color="white" />
          </TouchableOpacity>
        </View>
        <View className="ml-4 mb-2 flex-1">
          <Text className="text-3xl font-black text-gray-900 tracking-tight" numberOfLines={1}>
            {user?.name}
          </Text>
          <View className="flex-row items-center gap-2 flex-wrap mt-1">
            <Badge variant="primary" size="sm">{user?.role}</Badge>
            {personalInfo?.location && (
              <View className="flex-row items-center">
                <MapPin size={10} color="#6B7280" />
                <Text className="text-gray-900 text-sm font-black ml-1" numberOfLines={1}>
                  {personalInfo.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
