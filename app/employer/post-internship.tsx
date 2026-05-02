import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  Users, 
  Code, 
  ChevronRight, 
  ChevronLeft,
  X,
  Banknote,
  GraduationCap
} from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stepper } from '../../src/components/Stepper';
import apiClient from '../../src/api/apiClient';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { MotiView } from 'moti';

const internshipSchema = z.object({
  positionTitle: z.string().min(1, 'Position title is required'),
  domain: z.string().min(1, 'Domain is required'),
  workEnvironment: z.string().min(1, 'Work environment is required'),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().min(1, 'Duration is required'),
  numberOfOpenings: z.string().min(1, 'Openings required'),
  description: z.string().min(20, 'Description must be at least 20 chars'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  stipendAmount: z.string().optional(),
});

export default function PostInternshipScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const { control, handleSubmit, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      positionTitle: '',
      domain: '',
      workEnvironment: 'Remote',
      location: '',
      duration: '3',
      numberOfOpenings: '1',
      description: '',
      experienceLevel: 'Entry Level',
      stipendAmount: '',
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ['positionTitle', 'domain', 'workEnvironment', 'location', 'duration', 'numberOfOpenings'];
    } else if (step === 2) {
      if (requiredSkills.length === 0) {
        Alert.alert("Requirement Missing", "Please add at least one required skill.");
        return;
      }
      fieldsToValidate = ['experienceLevel'];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) setStep(prev => prev + 1);
  };

  const addSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        requiredSkills: requiredSkills.map(s => ({ name: s, mandatory: true })),
        stipend: { amount: parseInt(data.stipendAmount) || 0, currency: 'LKR' },
        status: 'Hiring'
      };

      const res = await apiClient.post('internships/create', payload);
      if (res.data.success) {
        Alert.alert("Success", "Internship posted successfully!");
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to post internship");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-gray-900 uppercase tracking-tight">Post Role</Text>
        <View className="w-6" />
      </View>

      <Stepper 
        currentStep={step} 
        steps={[
          { id: 1, title: 'Basics' },
          { id: 2, title: 'Requirements' },
          { id: 3, title: 'Details' }
        ]} 
      />

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <MotiView 
              key="step1"
              from={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Input
                label="Position Title"
                placeholder="e.g. Software Engineer Intern"
                control={control}
                name="positionTitle"
                error={errors.positionTitle?.message}
                icon={Briefcase}
              />
              <Input
                label="Domain Category"
                placeholder="e.g. Web Development"
                control={control}
                name="domain"
                error={errors.domain?.message}
                icon={Code}
              />
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Input
                    label="Work Type"
                    placeholder="Remote/Hybrid"
                    control={control}
                    name="workEnvironment"
                    error={errors.workEnvironment?.message}
                    icon={MapPin}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Location"
                    placeholder="Colombo, LK"
                    control={control}
                    name="location"
                    error={errors.location?.message}
                    icon={MapPin}
                  />
                </View>
              </View>
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Input
                    label="Duration (Months)"
                    placeholder="3"
                    keyboardType="numeric"
                    control={control}
                    name="duration"
                    error={errors.duration?.message}
                    icon={Clock}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Openings"
                    placeholder="1"
                    keyboardType="numeric"
                    control={control}
                    name="numberOfOpenings"
                    error={errors.numberOfOpenings?.message}
                    icon={Users}
                  />
                </View>
              </View>
            </MotiView>
          )}

          {step === 2 && (
            <MotiView 
              key="step2"
              from={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <View className="space-y-4">
                <Text className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Required Skills</Text>
                <View className="flex-row space-x-3">
                  <TextInput
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-gray-900"
                    placeholder="Type skill..."
                    value={skillInput}
                    onChangeText={setSkillInput}
                  />
                  <TouchableOpacity 
                    onPress={addSkill}
                    className="bg-indigo-600 px-6 rounded-2xl items-center justify-center shadow-md shadow-indigo-200"
                  >
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">Add</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-2 pt-2">
                  {requiredSkills.map(skill => (
                    <View key={skill} className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex-row items-center">
                      <Text className="text-indigo-700 font-bold text-xs uppercase tracking-widest">{skill}</Text>
                      <TouchableOpacity onPress={() => removeSkill(skill)} className="ml-2">
                        <X size={14} color="#4F46E5" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <Input
                label="Experience Level"
                placeholder="Entry/Student/Graduate"
                control={control}
                name="experienceLevel"
                error={errors.experienceLevel?.message}
                icon={Briefcase}
              />
            </MotiView>
          )}

          {step === 3 && (
            <MotiView 
              key="step3"
              from={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <View className="space-y-2">
                <Text className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="bg-gray-50 border border-gray-100 rounded-[32px] p-6 font-bold text-gray-900 h-40 text-left align-top"
                      placeholder="Detailed mission overview..."
                      multiline
                      value={value}
                      onChangeText={onChange}
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.description && <Text className="text-red-500 text-[10px] ml-1">{errors.description.message}</Text>}
              </View>

              <Input
                label="Stipend (LKR)"
                placeholder="15000"
                keyboardType="numeric"
                control={control}
                name="stipendAmount"
                error={errors.stipendAmount?.message}
                icon={Banknote}
              />
            </MotiView>
          )}
        </AnimatePresence>

        <View className="h-10" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="p-6 bg-white border-t border-gray-100 flex-row space-x-4">
        {step > 1 && (
          <TouchableOpacity 
            onPress={() => setStep(step - 1)}
            className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={step < 3 ? nextStep : handleSubmit(onSubmit)}
          disabled={loading}
          className="flex-1 h-16 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-white font-black uppercase tracking-widest text-xs">
                {step === 3 ? 'Deploy Protocol' : 'Next Step'}
              </Text>
              <ChevronRight size={16} color="white" className="ml-2" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
