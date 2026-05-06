import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code,
  GraduationCap,
  Sparkles,
  Users,
  X
} from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as z from 'zod';
import skillsCatalog from '../../data/skills.json';
import apiClient from '../../src/api/apiClient';
import { Input } from '../../src/components/Input';
import { Stepper } from '../../src/components/Stepper';
import { useAuth } from '../../src/context/AuthContext';

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const internshipSchema = z.object({
  positionTitle: z.string().min(1, 'Position title is required'),
  domain: z.string().min(1, 'Domain is required'),
  workEnvironment: z.enum(['Remote', 'On-site', 'Hybrid']),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().min(1, 'Duration is required'),
  expiryDate: z.string().min(1, 'Expiry date is required').refine((value) => {
    const expiry = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(expiry.getTime()) && expiry > today;
  }, 'Expiry date must be in the future'),
  numberOfOpenings: z.string().min(1, 'Openings required').refine((value) => {
    const openings = Number(value);
    return Number.isInteger(openings) && openings > 0;
  }, 'Openings must be a whole number'),
  description: z.string().min(20, 'Description must be at least 20 chars'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  educationRequirements: z.string().optional(),
  minimumGPA: z.string().optional(),
  stipendAmount: z.string().optional(),
});

const domainOptions = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Data Science',
  'Backend Development',
  'Frontend Development',
  'Cloud & DevOps',
  'Machine Learning',
];

const workEnvironmentOptions = ['Remote', 'On-site', 'Hybrid'];
const durationOptions = ['1', '2', '3', '6', '12'];
const experienceLevelOptions = ['Entry Level', 'Student', 'Graduate', 'Intermediate'];
const skillCatalog = skillsCatalog as string[];

const normalizeSkillText = (value: string) => value.trim().toLowerCase();

const getSkillSuggestions = (query: string, selectedSkills: string[]) => {
  const normalizedQuery = normalizeSkillText(query);
  if (!normalizedQuery) return [];

  return skillCatalog
    .filter(skill => skill.toLowerCase().includes(normalizedQuery))
    .filter(skill => !selectedSkills.some(existing => normalizeSkillText(existing) === skill.toLowerCase()))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b);
    })
    .slice(0, 8);
};

function OptionGroup({ label, options, value, onChange, error }: any) {
  return (
    <View className="space-y-2 mb-4">
      <Text className={`text-xs font-semibold uppercase tracking-wider ml-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option: string) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              className={`px-4 py-3 rounded-xl border ${selected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-widest ${selected ? 'text-white' : 'text-gray-600'}`}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text className="text-rose-500 text-xs font-bold ml-1">{error}</Text>}
    </View>
  );
}

function TagInput({
  label,
  value,
  onChangeText,
  onAdd,
  items,
  onRemove,
  placeholder,
  icon: Icon,
  required,
  suggestions,
  suggestionHint,
  onPickSuggestion,
}: any) {
  return (
    <View className="space-y-3">
      <Text className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
        {label}{required && <Text className="text-red-400"> *</Text>}
      </Text>
      <View className="flex-row space-x-3">
        <View className="flex-1 relative">
          {Icon && (
            <View className="absolute left-3 top-[15px] z-10">
              <Icon size={18} color="#6B7280" />
            </View>
          )}
          <TextInput
            className={`bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-4 ${Icon ? 'pl-10' : 'px-4'} font-bold text-gray-900`}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onAdd}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={onAdd}
          className="bg-indigo-600 px-5 rounded-2xl items-center justify-center shadow-md shadow-indigo-200"
        >
          <Text className="text-white font-black text-[10px] uppercase tracking-widest">Add</Text>
        </TouchableOpacity>
      </View>
        {!!value?.trim() && !!suggestions?.length && (
          <View className="rounded-2xl border border-gray-200 bg-white overflow-hidden max-h-44 shadow-sm">
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((skill: string, index: number) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => onPickSuggestion?.(skill)}
                  className={`px-4 py-3 active:bg-indigo-50 ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <Text className="text-sm font-semibold text-gray-700">{skill}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      <View className="flex-row flex-wrap gap-2">
        {items.map((item: string) => (
          <View key={item} className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex-row items-center">
            <Text className="text-indigo-700 font-bold text-xs uppercase tracking-widest">{item}</Text>
            <TouchableOpacity onPress={() => onRemove(item)} className="ml-2">
              <X size={14} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PostInternshipScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, checkUserLoggedIn } = useAuth();
  const editingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(editingId);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [requiredDegreeField, setRequiredDegreeField] = useState<string[]>([]);
  const [perks, setPerks] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [preferredSkillInput, setPreferredSkillInput] = useState('');
  const [degreeInput, setDegreeInput] = useState('');
  const [perkInput, setPerkInput] = useState('');
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors }, trigger, reset } = useForm({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      positionTitle: '',
      domain: '',
      workEnvironment: 'Remote',
      location: '',
      duration: '3',
      expiryDate: addDays(30),
      numberOfOpenings: '1',
      description: '',
      experienceLevel: 'Entry Level',
      educationRequirements: '',
      minimumGPA: '',
      stipendAmount: '',
    }
  });

  useEffect(() => {
    if (!isEditing || !editingId) return;

    const loadInternship = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/internships/${editingId}`);
        if (!res.data?.success) return;

        const internship = res.data.data;
        const nextRequiredSkills = Array.isArray(internship.requiredSkills)
          ? internship.requiredSkills.map((skill: any) => (typeof skill === 'string' ? skill : skill?.name || '')).filter(Boolean)
          : [];
        const nextPreferredSkills = Array.isArray(internship.preferredSkills)
          ? internship.preferredSkills.filter(Boolean)
          : [];
        const nextDegreeFields = Array.isArray(internship.requiredDegreeField)
          ? internship.requiredDegreeField.filter(Boolean)
          : [];
        const nextPerks = Array.isArray(internship.perks)
          ? internship.perks.filter(Boolean)
          : [];

        setRequiredSkills(nextRequiredSkills);
        setPreferredSkills(nextPreferredSkills);
        setRequiredDegreeField(nextDegreeFields);
        setPerks(nextPerks);

        reset({
          positionTitle: internship.positionTitle || '',
          domain: internship.domain || '',
          workEnvironment: internship.workEnvironment || 'Remote',
          location: internship.location || '',
          duration: String(internship.duration || '3'),
          expiryDate: internship.expiryDate ? new Date(internship.expiryDate).toISOString().split('T')[0] : addDays(30),
          numberOfOpenings: String(internship.numberOfOpenings || 1),
          description: internship.description || '',
          experienceLevel: internship.experienceLevel || 'Entry Level',
          educationRequirements: internship.educationRequirements || '',
          minimumGPA: internship.minimumGPA != null ? String(internship.minimumGPA) : '',
          stipendAmount: internship.stipend?.amount != null ? String(internship.stipend.amount) : '',
        });
      } catch (error) {
        console.error('Load internship for edit failed:', error);
        Alert.alert('Error', 'Could not load internship for editing.');
      } finally {
        setLoading(false);
      }
    };

    loadInternship();
  }, [editingId, isEditing, reset]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ['positionTitle', 'domain', 'workEnvironment', 'location', 'duration', 'numberOfOpenings', 'expiryDate'];
    } else if (step === 2) {
      if (requiredSkills.length === 0) {
        Alert.alert("Requirement Missing", "Please add at least one required skill.");
        return;
      }
      if (requiredDegreeField.length === 0) {
        Alert.alert("Requirement Missing", "Please add at least one accepted degree field.");
        return;
      }
      fieldsToValidate = ['experienceLevel'];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) setStep(prev => prev + 1);
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;

    if (!requiredSkills.some(item => normalizeSkillText(item) === normalizeSkillText(skill))) {
      setRequiredSkills([...requiredSkills, skill]);
      setSkillInput('');
    }
  };

  const addRequiredSkill = (skill: string) => {
    if (!requiredSkills.some(item => normalizeSkillText(item) === normalizeSkillText(skill))) {
      setRequiredSkills([...requiredSkills, skill]);
    }
    setSkillInput('');
  };

  const addPreferredSkill = () => {
    const skill = preferredSkillInput.trim();
    if (skill && !preferredSkills.some(item => normalizeSkillText(item) === normalizeSkillText(skill))) {
      setPreferredSkills([...preferredSkills, skill]);
      setPreferredSkillInput('');
    }
  };

  const addPreferredSkillFromSuggestion = (skill: string) => {
    if (!preferredSkills.some(item => normalizeSkillText(item) === normalizeSkillText(skill))) {
      setPreferredSkills([...preferredSkills, skill]);
    }
    setPreferredSkillInput('');
  };

  const addDegree = () => {
    const degree = degreeInput.trim();
    if (degree && !requiredDegreeField.includes(degree)) {
      setRequiredDegreeField([...requiredDegreeField, degree]);
      setDegreeInput('');
    }
  };

  const addPerk = () => {
    const perk = perkInput.trim();
    if (perk && !perks.includes(perk)) {
      setPerks([...perks, perk]);
      setPerkInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const requiredSkillSuggestions = getSkillSuggestions(skillInput, requiredSkills);
  const preferredSkillSuggestions = getSkillSuggestions(preferredSkillInput, preferredSkills);

  const getVerificationMessage = (currentUser: any) => {
    if (!currentUser) return 'Please sign in again before posting an internship.';
    if (currentUser.role !== 'employer') return 'Only employer accounts can post internships.';
    if (currentUser.verificationStatus === 'pending') {
      return 'Your employer verification is pending admin approval. You can post internships after approval.';
    }
    if (currentUser.verificationStatus === 'rejected') {
      return currentUser.verificationFeedback
        ? `Your employer verification was rejected: ${currentUser.verificationFeedback}`
        : 'Your employer verification was rejected. Please update your verification documents.';
    }
    return 'Your employer account must be verified before you can post internships.';
  };

  const getCurrentUser = async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const canPost = currentUser?.role === 'employer'
        && (currentUser?.isVerified === true || currentUser?.verificationStatus === 'approved');

      if (!canPost) {
        Alert.alert('Verification Required', getVerificationMessage(currentUser));
        return;
      }

      const payload: any = {
        positionTitle: data.positionTitle.trim(),
        domain: data.domain.trim(),
        workEnvironment: data.workEnvironment,
        location: data.location.trim(),
        duration: data.duration,
        expiryDate: data.expiryDate,
        requiredSkills: requiredSkills.map(s => ({ name: s, mandatory: true, prefersSenior: false })),
        preferredSkills,
        requiredDegreeField,
        description: data.description.trim(),
        numberOfOpenings: parseInt(data.numberOfOpenings, 10) || 1,
        experienceLevel: data.experienceLevel,
        educationRequirements: data.educationRequirements?.trim() || '',
        minimumGPA: data.minimumGPA ? parseFloat(data.minimumGPA) : 0,
        perks,
        stipend: { amount: parseInt(data.stipendAmount) || 0, currency: 'LKR' },
      };

      const res = isEditing && editingId
        ? await apiClient.put(`internships/${editingId}`, payload)
        : await apiClient.post('internships/create', { ...payload, status: 'Hiring' });

      if (res.data.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Internship updated successfully!' : 'Internship posted successfully!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (err: any) {
      const message = err.response?.data?.errors?.map((item: any) => item.msg).join('\n')
        || err.response?.data?.message
        || "Failed to post internship";

      if (err.response?.status === 403) {
        await checkUserLoggedIn();
        Alert.alert('Verification Required', message);
      } else {
        Alert.alert("Error", message);
      }
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
        <Text className="text-lg font-black text-gray-900 uppercase tracking-tight">{isEditing ? 'Edit Role' : 'Post Role'}</Text>
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

      {user?.role === 'employer' && !(user?.isVerified === true || user?.verificationStatus === 'approved') && (
        <View className="mx-6 mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Text className="text-amber-900 text-xs font-black uppercase tracking-widest">Verification Required</Text>
          <Text className="text-amber-800 text-sm font-semibold mt-1 leading-5">
            {getVerificationMessage(user)}
          </Text>
        </View>
      )}

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <AnimatePresence>
          {step === 1 && (
            <MotiView 
              key="step1"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
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
              <Controller
                control={control}
                name="domain"
                render={({ field: { onChange, value } }) => (
                  <OptionGroup
                    label="Domain Category"
                    options={domainOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.domain?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="workEnvironment"
                render={({ field: { onChange, value } }) => (
                  <OptionGroup
                    label="Work Environment"
                    options={workEnvironmentOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.workEnvironment?.message}
                  />
                )}
              />
              <Input
                label="Specific Location"
                placeholder="Colombo, LK"
                control={control}
                name="location"
                error={errors.location?.message}
                icon={Building2}
              />
              <Controller
                control={control}
                name="duration"
                render={({ field: { onChange, value } }) => (
                  <OptionGroup
                    label="Duration (Months)"
                    options={durationOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.duration?.message}
                  />
                )}
              />
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <View className="space-y-2 mb-4">
                    <Text className={`text-xs font-semibold uppercase tracking-wider ml-1 ${errors.expiryDate ? 'text-red-500' : 'text-gray-500'}`}>
                      Expiry Date
                    </Text>
                    <Controller
                      control={control}
                      name="expiryDate"
                      render={({ field: { onChange, value } }) => (
                        <>
                          {Platform.OS === 'web' ? (
                            <input
                              type="date"
                              value={value || ''}
                              min={addDays(1)}
                              onChange={(event) => onChange(event.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 16,
                                border: `1px solid ${errors.expiryDate ? '#EF4444' : '#E5E7EB'}`,
                                background: '#FFFFFF',
                                color: '#111827',
                                fontSize: 14,
                                fontWeight: 600,
                                outline: 'none',
                              }}
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() => setShowExpiryDatePicker(true)}
                              className={`bg-white border rounded-2xl px-4 py-4 flex-row items-center justify-between ${errors.expiryDate ? 'border-red-300' : 'border-gray-100'}`}
                            >
                              <Text className={`font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                                {value || 'Select expiry date'}
                              </Text>
                              <Calendar size={18} color="#4F46E5" />
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    />
                    {errors.expiryDate && <Text className="text-rose-500 text-xs font-bold ml-1">{errors.expiryDate.message}</Text>}
                  </View>
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
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              className="space-y-6"
            >
              <TagInput
                label="Required Skills"
                value={skillInput}
                onChangeText={setSkillInput}
                onAdd={addSkill}
                items={requiredSkills}
                onRemove={removeSkill}
                placeholder="React Native, Node.js..."
                icon={Code}
                required
                suggestions={requiredSkillSuggestions}
                suggestionHint="Tap to add"
                onPickSuggestion={addRequiredSkill}
              />
              <Text className="mb-2 text-[11px] font-semibold text-gray-500 leading-5">
                Use the exact skill names you want the matcher to score. Required skills are treated as mandatory.
              </Text>

              <TagInput
                label="Accepted Degree Fields"
                value={degreeInput}
                onChangeText={setDegreeInput}
                onAdd={addDegree}
                items={requiredDegreeField}
                onRemove={(degree: string) => setRequiredDegreeField(requiredDegreeField.filter(item => item !== degree))}
                placeholder="Computer Science, Software Engineering..."
                icon={GraduationCap}
                required
              />

              <TagInput
                label="Preferred Skills"
                value={preferredSkillInput}
                onChangeText={setPreferredSkillInput}
                onAdd={addPreferredSkill}
                items={preferredSkills}
                onRemove={(skill: string) => setPreferredSkills(preferredSkills.filter(item => item !== skill))}
                placeholder="Docker, AWS..."
                icon={Sparkles}
                suggestions={preferredSkillSuggestions}
                suggestionHint="Optional"
                onPickSuggestion={addPreferredSkillFromSuggestion}
              />
              <Text className="mb-2 text-[11px] font-semibold text-gray-500 leading-5">
                Preferred skills improve the score without disqualifying candidates.
              </Text>

              <Controller
                control={control}
                name="experienceLevel"
                render={({ field: { onChange, value } }) => (
                  <OptionGroup
                    label="Experience Level"
                    options={experienceLevelOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.experienceLevel?.message}
                  />
                )}
              />
            </MotiView>
          )}

          {step === 3 && (
            <MotiView 
              key="step3"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
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
                label="Academic Standard"
                placeholder="Bachelor's Degree, Diploma, Undergraduate..."
                control={control}
                name="educationRequirements"
                error={errors.educationRequirements?.message}
                icon={GraduationCap}
              />

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Input
                    label="Minimum GPA"
                    placeholder="0.0"
                    keyboardType="decimal-pad"
                    control={control}
                    name="minimumGPA"
                    error={errors.minimumGPA?.message}
                    icon={GraduationCap}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Stipend (LKR)"
                    placeholder="15000"
                    keyboardType="numeric"
                    control={control}
                    name="stipendAmount"
                    error={errors.stipendAmount?.message}
                    icon={Banknote}
                  />
                </View>
              </View>

              <TagInput
                label="Perks & Benefits"
                value={perkInput}
                onChangeText={setPerkInput}
                onAdd={addPerk}
                items={perks}
                onRemove={(perk: string) => setPerks(perks.filter(item => item !== perk))}
                placeholder="Mentorship, Certificate..."
                icon={Sparkles}
              />

            </MotiView>
          )}
        </AnimatePresence>

        {showExpiryDatePicker && Platform.OS !== 'web' && (
          <Controller
            control={control}
            name="expiryDate"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value ? new Date(`${value}T12:00:00`) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                onChange={(event, selectedDate) => {
                  if (event.type === 'dismissed') {
                    setShowExpiryDatePicker(false);
                    return;
                  }

                  if (selectedDate) {
                    onChange(formatDateForInput(selectedDate));
                    setShowExpiryDatePicker(false);
                  }
                }}
              />
            )}
          />
        )}

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
                {step === 3 ? (isEditing ? 'Save Changes' : 'Deploy Protocol') : 'Next Step'}
              </Text>
              <ChevronRight size={16} color="white" className="ml-2" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
