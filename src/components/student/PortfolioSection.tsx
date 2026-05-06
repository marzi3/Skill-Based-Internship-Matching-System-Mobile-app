import { router } from 'expo-router';
import { Edit2, ExternalLink, Globe } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  portfolio: any;
}

const LINKS = [
  { key: 'github',    label: 'GitHub',    color: '#111827' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'website',   label: 'Website',   color: '#6366F1' },
  { key: 'portfolio', label: 'Portfolio', color: '#8B5CF6' },
] as const;

export function PortfolioSection({ portfolio }: Props) {
  const hasLinks = portfolio && Object.values(portfolio).some(Boolean);

  const normalizeUrl = (value: string) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const openPortfolioLink = async (value: string) => {
    const url = normalizeUrl(value);
    if (!url) return;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Invalid Link', 'This link cannot be opened.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Globe size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">Portfolio</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/portfolio' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Edit</Text>
        </TouchableOpacity>
      </View>

      {hasLinks ? (
        <View className="bg-gray-50 rounded-3xl px-5 border border-gray-100">
          {LINKS.filter(l => portfolio?.[l.key]).map((link, i, arr) => (
            <TouchableOpacity
              key={link.key}
              onPress={() => openPortfolioLink(String(portfolio[link.key]))}
              activeOpacity={0.75}
              className={`flex-row items-center py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="w-7 h-7 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: `${link.color}15` }}>
                <ExternalLink size={12} color={link.color} />
              </View>
              <Text className="text-gray-900 text-sm font-black uppercase w-24">{link.label}</Text>
              <Text className="text-gray-900 text-sm font-bold flex-1" numberOfLines={1}>
                {portfolio[link.key]}
              </Text>
              <ExternalLink size={12} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/portfolio' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add portfolio links...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
