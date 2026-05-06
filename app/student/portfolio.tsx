import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Save, Globe, ExternalLink } from 'lucide-react-native';
import apiClient from '../../src/api/apiClient';

const FIELDS = [
  { key: 'github',    label: 'GitHub',           placeholder: 'https://github.com/username',        color: '#111827' },
  { key: 'linkedin',  label: 'LinkedIn',          placeholder: 'https://linkedin.com/in/username',   color: '#0A66C2' },
  { key: 'website',   label: 'Personal Website',  placeholder: 'https://yoursite.com',               color: '#6366F1' },
  { key: 'portfolio', label: 'Portfolio URL',     placeholder: 'https://your-portfolio.com',         color: '#8B5CF6' },
] as const;

export default function PortfolioScreen() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [links, setLinks] = useState({
    github: '', linkedin: '', website: '', portfolio: '',
  });

  useEffect(() => {
    apiClient.get('students/profile')
      .then(res => {
        if (res.data.success) {
          const p = res.data.data?.portfolio || {};
          setLinks({ github: p.github || '', linkedin: p.linkedin || '', website: p.website || '', portfolio: p.portfolio || '' });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await apiClient.post('students/profile/portfolio', links);
      Alert.alert('Saved', 'Portfolio links updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View className="flex-row items-center flex-1">
            <Globe size={18} color="#4F46E5" />
            <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Portfolio Links</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            <Text className="text-gray-500 text-sm font-medium mb-6 leading-5">
              Add links to your online presence. These help employers verify your skills and see your work.
            </Text>

            {FIELDS.map(field => (
              <View key={field.key} className="mb-5">
                <View className="flex-row items-center mb-2">
                  <View className="w-5 h-5 rounded items-center justify-center mr-2" style={{ backgroundColor: `${field.color}20` }}>
                    <ExternalLink size={11} color={field.color} />
                  </View>
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{field.label}</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                  value={links[field.key]}
                  onChangeText={val => setLinks(l => ({ ...l, [field.key]: val }))}
                  placeholder={field.placeholder}
                  placeholderTextColor="#D1D5DB"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={save}
              disabled={saving}
              className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center mt-4 mb-8"
            >
              {saving
                ? <ActivityIndicator color="white" />
                : <><Save size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Save Links</Text></>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
