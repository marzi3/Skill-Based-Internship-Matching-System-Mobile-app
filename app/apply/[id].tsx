import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Building2, Send, AlertCircle, CheckCircle2, FileText } from 'lucide-react-native';
import { MotiView } from 'moti';
import apiClient from '../../src/api/apiClient';
import { Badge } from '../../src/components/Badge';

const MIN_COVER_LETTER = 20;

export default function ApplyScreen() {
  const { id } = useLocalSearchParams();
  const [internship, setInternship] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await apiClient.get(`internships/${id}`);
        if (res.data.success) setInternship(res.data.data);
      } catch (err) {
        console.error('Fetch internship error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternship();
  }, [id]);

  const charCount = coverLetter.trim().length;
  const isValid = charCount >= MIN_COVER_LETTER;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Cover Letter Too Short', `Please write at least ${MIN_COVER_LETTER} characters.`);
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post(`applications/apply/${id}`, { coverLetter });
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="items-center"
        >
          <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-6 border-2 border-emerald-200">
            <CheckCircle2 size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-black text-gray-900 tracking-tighter text-center mb-2">Application Sent!</Text>
          <Text className="text-gray-500 font-medium text-center leading-6 mb-8">
            Your application for{' '}
            <Text className="text-indigo-600 font-black">{internship?.positionTitle}</Text>
            {' '}has been submitted successfully.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/applications' as any)}
            className="bg-indigo-600 w-full py-5 rounded-2xl items-center mb-4"
          >
            <Text className="text-white font-black uppercase tracking-widest text-xs">View My Applications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/explore' as any)}
            className="w-full py-5 rounded-2xl items-center border border-gray-100"
          >
            <Text className="text-gray-700 font-black uppercase tracking-widest text-xs">Keep Exploring</Text>
          </TouchableOpacity>
        </MotiView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-black text-gray-900 tracking-tight">Apply Now</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Internship Summary */}
          {internship && (
            <MotiView from={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-6 mt-6 mb-4 bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-indigo-100 overflow-hidden">
                  {internship.employer?.profilePicture ? (
                    <Image source={{ uri: internship.employer.profilePicture }} className="w-full h-full" />
                  ) : (
                    <Building2 size={22} color="#4F46E5" />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-base font-black text-indigo-900 tracking-tight" numberOfLines={1}>
                    {internship.positionTitle}
                  </Text>
                  <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                    {internship.employer?.companyName || internship.company}
                  </Text>
                </View>
                <Badge variant="primary" size="sm">{internship.workEnvironment}</Badge>
              </View>
            </MotiView>
          )}

          {/* Cover Letter Section */}
          <View className="px-6 mb-4">
            <View className="flex-row items-center mb-3">
              <FileText size={18} color="#4F46E5" />
              <Text className="text-base font-black text-gray-900 ml-2">Cover Letter</Text>
              <Text className="text-red-500 ml-1 font-black">*</Text>
            </View>

            <View className={`border rounded-3xl overflow-hidden ${isValid ? 'border-emerald-200' : charCount > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
              <TextInput
                className="p-5 text-gray-800 font-medium leading-6"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                placeholder={`Tell the employer why you're interested in this role and what makes you a great candidate...\n\nFor example:\n• Relevant skills and experience\n• Why you're excited about this company\n• What you hope to contribute`}
                placeholderTextColor="#D1D5DB"
                value={coverLetter}
                onChangeText={setCoverLetter}
                style={{ minHeight: 220 }}
              />
            </View>

            {/* Char count & validation */}
            <View className="flex-row items-center justify-between mt-2 px-1">
              <View className="flex-row items-center">
                {charCount > 0 && (
                  isValid
                    ? <CheckCircle2 size={12} color="#10B981" />
                    : <AlertCircle size={12} color="#F59E0B" />
                )}
                {charCount > 0 && !isValid && (
                  <Text className="text-amber-600 text-[10px] font-bold ml-1">
                    {MIN_COVER_LETTER - charCount} more characters needed
                  </Text>
                )}
                {isValid && (
                  <Text className="text-emerald-600 text-[10px] font-bold ml-1">
                    Looks good!
                  </Text>
                )}
              </View>
              <Text className={`text-[10px] font-bold ${charCount >= MIN_COVER_LETTER ? 'text-emerald-600' : 'text-gray-400'}`}>
                {charCount} chars
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View className="mx-6 mb-8 bg-gray-50 p-5 rounded-3xl border border-gray-100">
            <Text className="text-gray-900 font-black text-xs uppercase tracking-widest mb-3">Writing Tips</Text>
            {[
              'Mention 2-3 relevant skills or projects',
              'Explain why this specific company interests you',
              'Keep it concise — quality over quantity',
            ].map((tip, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <View className="w-4 h-4 bg-indigo-100 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-indigo-600 text-[8px] font-black">{i + 1}</Text>
                </View>
                <Text className="text-gray-500 text-xs font-medium flex-1">{tip}</Text>
              </View>
            ))}
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Submit */}
        <View className="px-6 py-4 border-t border-gray-50 bg-white">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !isValid}
            className={`w-full py-5 rounded-2xl flex-row items-center justify-center ${isValid ? 'bg-indigo-600' : 'bg-gray-100'}`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={16} color={isValid ? 'white' : '#9CA3AF'} />
                <Text className={`font-black uppercase tracking-widest text-xs ml-2 ${isValid ? 'text-white' : 'text-gray-400'}`}>
                  Submit Application
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
