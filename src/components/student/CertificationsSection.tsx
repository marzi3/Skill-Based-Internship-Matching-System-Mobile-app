import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Award, Edit2, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';

function openUrl(url: string) {
  if (!url) return;
  const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  if (Platform.OS === 'web') {
    window.open(full, '_blank');
    return;
  }
  Linking.openURL(full).catch(() =>
    Alert.alert('Cannot Open', 'Could not open the credential URL.')
  );
}

interface Props {
  certifications: any[];
}

export function CertificationsSection({ certifications }: Props) {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Award size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">
            Certifications
          </Text>
          {certifications?.length > 0 && (
            <View className="ml-2 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Text className="text-amber-700 text-xs font-black">{certifications.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/certifications' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Manage</Text>
        </TouchableOpacity>
      </View>

      {certifications?.length > 0 ? (
        certifications.map((cert: any, i: number) => (
          <View key={i} className="bg-amber-50 rounded-2xl border border-amber-100 mb-2 overflow-hidden">
            <View className="p-4 flex-row items-center">
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                <Award size={18} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-black text-base">{cert.name}</Text>
                {cert.issuedDate && (
                  <Text className="text-amber-600 text-[10px] font-bold mt-0.5 uppercase tracking-widest">
                    Issued {new Date(cert.issuedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {cert.credentialUrl && (
                  <Text className="text-indigo-400 text-[10px] font-medium mt-0.5" numberOfLines={1}>
                    {cert.credentialUrl}
                  </Text>
                )}
              </View>
            </View>
            {cert.credentialUrl && (
              <TouchableOpacity
                onPress={() => openUrl(cert.credentialUrl)}
                className="flex-row items-center justify-center py-2.5 border-t border-amber-100 bg-white"
              >
                <ExternalLink size={12} color="#4F46E5" />
                <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest ml-1.5">
                  View Certificate
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/certifications' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add certifications...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
