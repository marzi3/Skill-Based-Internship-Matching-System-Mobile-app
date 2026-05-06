import { DatePickerButton } from '../../src/components/DatePickerButton';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, Circle, Image as ImageIcon, Lock, Mail, Save, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import countries from '../../data/countries.json';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { storage } from '../../src/utils/storage';

const GENDER_OPTIONS   = ['Male', 'Female', 'Other', 'Prefer not to say'];
const WORK_MODE_OPTIONS = ['Remote', 'On-site', 'Hybrid'];
const SENIORITY_OPTIONS = ['Student', 'Graduate'];
const DEFAULT_COUNTRY = countries.default;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function calcAge(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime()) || d > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 100 ? age : null;
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, required }: any) {
  return (
    <View className="mb-5">
      <View className="flex-row mb-2">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
        {required && <Text className="text-red-400 ml-1">*</Text>}
      </View>
      <TextInput
        className={`bg-gray-50 border border-gray-100 rounded-2xl px-4 text-gray-900 font-medium ${multiline ? 'py-3' : 'py-4'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor="#D1D5DB"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType || 'default'}
        style={multiline ? { minHeight: 100 } : {}}
      />
    </View>
  );
}

function LockedField({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
        <Lock size={9} color="#D1D5DB" style={{ marginLeft: 4 }} />
      </View>
      <View className="bg-gray-100 border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
        {Icon && <Icon size={14} color="#9CA3AF" style={{ marginRight: 8 }} />}
        <Text className="text-gray-400 font-medium flex-1">{value || '—'}</Text>
        <Lock size={12} color="#D1D5DB" />
      </View>
      <Text className="text-gray-400 text-[10px] font-medium mt-1 ml-1">
        Cannot be changed here
      </Text>
    </View>
  );
}

function ChipGroup({ label, options, value, onSelect }: any) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            className={`px-4 py-2.5 rounded-2xl border ${value === opt ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-100'}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${value === opt ? 'text-white' : 'text-gray-500'}`}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function CheckboxGroup({ label, options, value, onToggle }: any) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{label}</Text>
      <View className="gap-2.5">
        {options.map((opt: string) => {
          const isSelected = value.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onToggle(opt)}
              className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5"
            >
              {isSelected ? (
                <CheckCircle2 size={18} color="#4F46E5" />
              ) : (
                <Circle size={18} color="#D1D5DB" />
              )}
              <Text className={`text-sm font-semibold ml-3 flex-1 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RadioGroup({ label, options, value, onSelect }: any) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{label}</Text>
      <View className="gap-2.5">
        {options.map((opt: string) => {
          const isSelected = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}
            >
              <View className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {isSelected && <View className="w-full h-full rounded-full bg-indigo-600" />}
              </View>
              <Text className={`text-sm font-semibold ml-3 flex-1 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function PersonalScreen() {
  const params = useLocalSearchParams<{ image?: string }>();
  const { user } = useAuth();
  const hasTriggeredFromParams = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [form, setForm] = useState({
    designation: '', phone: '', about: '',
    location: '', gpa: '', gender: '',
    dateOfBirth: '',
    workMode: [] as string[],
    seniority: '',
  });

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const getServerRoot = () => {
    const rawBase = String(apiClient.defaults.baseURL || '').replace(/\/$/, '');
    return rawBase.replace(/\/api\/v1\/?$/i, '') || rawBase;
  };

  const normalizeFileUrl = (filePath?: string | null) => {
    if (!filePath) return '';
    const fp = String(filePath);
    if (/^https?:\/\//i.test(fp)) return fp;
    const root = getServerRoot();
    return root + (fp.startsWith('/') ? '' : '/') + fp;
  };

  const validateSelectedImage = async (asset: any) => {
    let size: number | undefined = asset?.fileSize;
    let mime: string | undefined = asset?.mimeType || undefined;

    if (Platform.OS === 'web' && asset?.uri && (!size || !mime)) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      size = blob.size;
      mime = blob.type;
    }

    if (size && size > MAX_IMAGE_SIZE) {
      Alert.alert('File too large', 'Image must be 5MB or smaller.');
      return false;
    }

    if (mime && !ALLOWED_IMAGE_TYPES.includes(mime)) {
      Alert.alert('Invalid file type', 'Allowed types: JPG, PNG, WEBP.');
      return false;
    }

    return true;
  };

  const uploadImage = async (asset: any, mode: 'profile' | 'cover') => {
    const fieldName = mode === 'profile' ? 'profileImage' : 'coverImage';
    const endpoint = mode === 'profile' ? 'students/profile/image' : 'students/profile/cover';
    const setUploading = mode === 'profile' ? setUploadingProfile : setUploadingCover;
    const setPreview = mode === 'profile' ? setProfileImagePreview : setCoverImagePreview;

    try {
      setUploading(true);
      const formData = new FormData() as any;

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append(fieldName, blob, asset.fileName || `${fieldName}-${Date.now()}.jpg`);
      } else {
        formData.append(fieldName, {
          uri: asset.uri,
          name: asset.fileName || `${fieldName}-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });
      }

      const res = await apiClient.post(endpoint, formData);
      if (res.data.success) {
        const student = res.data.data?.student;
        const uploadedPath = mode === 'profile'
          ? (student?.profileImage?.filePath || res.data.data?.filePath)
          : (student?.coverImage?.filePath || res.data.data?.filePath);

        if (uploadedPath) {
          setPreview(normalizeFileUrl(String(uploadedPath)));
        }

        Alert.alert('Success', mode === 'profile' ? 'Profile photo uploaded successfully.' : 'Cover photo uploaded successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const pickAndUpload = async (mode: 'profile' | 'cover') => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please allow photo library access to upload images.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: mode === 'profile' ? [1, 1] : [16, 9],
        quality: 0.9,
        ...(Platform.OS === 'android' ? { legacy: true } : {}),
      });

      if (result.canceled || !result.assets?.length) return;
      const selected = result.assets[0];

      const isValid = await validateSelectedImage(selected);
      if (!isValid) return;

      setTimeout(() => {
        const uriPreview = selected?.uri || '';
        if (uriPreview) {
          if (mode === 'profile') setProfileImagePreview(uriPreview);
          else setCoverImagePreview(uriPreview);
        }
      }, 0);

      await uploadImage(selected, mode);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pick image');
    }
  };

  useEffect(() => {
    if (loading || hasTriggeredFromParams.current) return;

    const target = String(params?.image || '').toLowerCase();
    if (target === 'profile' || target === 'cover') {
      hasTriggeredFromParams.current = true;
      pickAndUpload(target as 'profile' | 'cover');
    }
  }, [params?.image, loading]);
  
  const toggleWorkMode = (mode: string) => {
    setForm(f => ({
      ...f,
      workMode: f.workMode.includes(mode)
        ? f.workMode.filter(m => m !== mode)
        : [...f.workMode, mode]
    }));
  };
  
  const setSeniority = (level: string) => setForm(f => ({ ...f, seniority: level }));

  useEffect(() => {
    const loadData = async () => {
      try {
        // First, try to load from storage cache
        const cachedWorkMode = await storage.getItem('student_workMode');
        const cachedSeniority = await storage.getItem('student_seniority');
        
        // Then fetch from API
        const res = await apiClient.get('students/profile');
        if (res.data.success) {
          const student = res.data.data || {};
          const info = res.data.data?.personalInfo || {};
          const prefs = res.data.data?.preferences || {};
          const seniorityData = res.data.data?.seniority || [];
          const rawDob = info.dateOfBirth ? info.dateOfBirth.slice(0, 10) : '';

          const profilePath = student?.profileImage?.filePath || user?.profilePicture || '';
          const coverPath = student?.coverImage?.filePath || '';
          setProfileImagePreview(normalizeFileUrl(profilePath));
          setCoverImagePreview(normalizeFileUrl(coverPath));
          
          // Use API data if available, otherwise fall back to cache
          const workModeFromAPI = prefs.workMode && prefs.workMode.length > 0 ? prefs.workMode : null;
          const seniorityFromAPI = seniorityData && seniorityData.length > 0 ? seniorityData[0] : null;
          
          setForm({
            designation:              info.designation || '',
            phone:                    (info.phone || '').replace(/^\+94/, '').replace(/^0/, ''),
            about:                    info.about || '',
            location:                 info.location || '',
            gpa:                      info.gpa || '',
            gender:                   info.gender || '',
            dateOfBirth:              rawDob,
            workMode:                 workModeFromAPI || (cachedWorkMode ? JSON.parse(cachedWorkMode) : []),
            seniority:                seniorityFromAPI || cachedSeniority || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Try to restore from cache on error
        try {
          const cachedWorkMode = await storage.getItem('student_workMode');
          const cachedSeniority = await storage.getItem('student_seniority');
          if (cachedWorkMode || cachedSeniority) {
            setForm(f => ({
              ...f,
              workMode: cachedWorkMode ? JSON.parse(cachedWorkMode) : f.workMode,
              seniority: cachedSeniority || f.seniority,
            }));
          }
        } catch (cacheError) {
          console.error('Cache restore error:', cacheError);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const save = async () => {
    if (!user?.name || !user?.email) {
      Alert.alert('Error', 'User account data is missing. Please log out and log in again.');
      return;
    }
    if (form.phone.length > 0 && form.phone.length < 9) {
      Alert.alert('Invalid Phone', 'Please enter 9 digits after +94.');
      return;
    }
    if (form.gpa !== '' && (isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4.0)) {
      Alert.alert('Invalid GPA', 'GPA must be between 0.00 and 4.00.');
      return;
    }
    try {
      setSaving(true);
      
      // Save to storage immediately for offline persistence
      await storage.setItem('student_workMode', JSON.stringify(form.workMode));
      await storage.setItem('student_seniority', form.seniority);
      
      // Then sync with backend
      await apiClient.post('students/profile/personal', {
        fullName: user.name,
        email:    user.email,
        designation: form.designation,
        phone: form.phone ? `+94${form.phone}` : '',
        about: form.about,
        country: DEFAULT_COUNTRY.name,
        location: form.location,
        gpa: form.gpa,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        preferences: {
          workMode: form.workMode,
        },
        seniority: form.seniority ? [form.seniority] : [],
      });
      Alert.alert('Saved', 'Personal information updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save';
      Alert.alert('Error', msg);
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
            <User size={18} color="#4F46E5" />
            <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Personal Info</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="py-6">

            {/* Profile & Cover images */}
            <View className="mb-6">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Profile & Cover Photos</Text>

              <View className="bg-gray-50 border border-gray-100 rounded-3xl p-4 mb-3">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cover Photo</Text>
                <View className="w-full h-28 rounded-2xl bg-white border border-gray-200 overflow-hidden items-center justify-center mb-3">
                  {coverImagePreview ? (
                    <Image source={{ uri: coverImagePreview }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center justify-center">
                      <ImageIcon size={20} color="#9CA3AF" />
                      <Text className="text-[10px] text-gray-400 font-medium mt-1">No cover photo</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => pickAndUpload('cover')}
                  disabled={uploadingCover}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex-row items-center justify-center"
                >
                  {uploadingCover ? (
                    <ActivityIndicator color="#4F46E5" />
                  ) : (
                    <>
                      <Camera size={14} color="#4F46E5" />
                      <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest ml-2">Select & Adjust Cover</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className="text-[10px] text-gray-400 font-medium mt-2">Adjustment: crop to 16:9 ratio before upload</Text>
              </View>

              <View className="bg-gray-50 border border-gray-100 rounded-3xl p-4">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Profile Photo</Text>
                <View className="w-28 h-28 rounded-2xl bg-white border border-gray-200 overflow-hidden items-center justify-center mb-3 self-center">
                  {profileImagePreview ? (
                    <Image source={{ uri: profileImagePreview }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center justify-center">
                      <User size={20} color="#9CA3AF" />
                      <Text className="text-[10px] text-gray-400 font-medium mt-1">No profile photo</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => pickAndUpload('profile')}
                  disabled={uploadingProfile}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex-row items-center justify-center"
                >
                  {uploadingProfile ? (
                    <ActivityIndicator color="#4F46E5" />
                  ) : (
                    <>
                      <Camera size={14} color="#4F46E5" />
                      <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest ml-2">Select & Adjust Profile</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className="text-[10px] text-gray-400 font-medium mt-2">Adjustment: crop to square (1:1) before upload</Text>
              </View>
            </View>

            {/* Read-only account fields */}
            <LockedField label="Name"  value={user?.name  || ''} icon={User} />
            <LockedField label="Email" value={user?.email || ''} icon={Mail} />
            <LockedField label="Country" value={`${DEFAULT_COUNTRY.flag} ${DEFAULT_COUNTRY.name} (${DEFAULT_COUNTRY.phoneCode})`} />

            {/* Editable fields */}
            <Field label="Designation" value={form.designation} onChangeText={set('designation')} placeholder="e.g. CS Student at UoJ" />

            {/* Phone with locked +94 prefix */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</Text>
              <View className="flex-row">
                <View className="bg-gray-100 border border-gray-100 rounded-l-2xl px-3 py-4 flex-row items-center"
                  style={{ borderRightWidth: 0 }}>
                  <Lock size={10} color="#9CA3AF" />
                  <Text className="text-gray-500 font-bold text-sm ml-1.5">+94</Text>
                </View>
                <TextInput
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-r-2xl px-4 py-4 text-gray-900 font-medium"
                  style={{ borderLeftWidth: 0 }}
                  value={form.phone}
                  onChangeText={val => set('phone')(val.replace(/\D/g, '').slice(0, 9))}
                  placeholder="771234567"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>
              {form.phone.length > 0 && form.phone.length < 9 && (
                <Text className="text-amber-500 text-[10px] font-medium mt-1 ml-1">Enter 9 digits after +94</Text>
              )}
              {form.phone.length === 9 && (
                <Text className="text-emerald-500 text-[10px] font-medium mt-1 ml-1">+94{form.phone} ✓</Text>
              )}
            </View>

            <Field label="Location" value={form.location} onChangeText={set('location')} placeholder="Jaffna, Sri Lanka" />

            {/* GPA with 0–4.0 validation */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">GPA</Text>
              <TextInput
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                value={form.gpa}
                onChangeText={val => set('gpa')(val.replace(/[^0-9.]/g, ''))}
                placeholder="3.80"
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
              />
              {form.gpa !== '' && (isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4.0) && (
                <Text className="text-red-400 text-[10px] font-medium mt-1 ml-1">GPA must be between 0.00 and 4.00</Text>
              )}
              {form.gpa !== '' && !isNaN(parseFloat(form.gpa)) && parseFloat(form.gpa) >= 0 && parseFloat(form.gpa) <= 4.0 && (
                <Text className="text-emerald-500 text-[10px] font-medium mt-1 ml-1">Valid GPA ✓</Text>
              )}
            </View>

            <DatePickerButton
              label="Date of Birth"
              value={form.dateOfBirth}
              onChange={val => set('dateOfBirth')(val)}
              placeholder="Select date of birth"
              maxDate={new Date()}
              minDate={new Date(1950, 0, 1)}
              accentColor="#4F46E5"
            />

            {/* Auto-calculated Age (read-only) */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">Age</Text>
                <Lock size={9} color="#D1D5DB" style={{ marginLeft: 4 }} />
              </View>
              <View className="bg-gray-100 border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
                <Text className="text-gray-400 font-medium flex-1">
                  {calcAge(form.dateOfBirth) !== null
                    ? `${calcAge(form.dateOfBirth)} years old`
                    : form.dateOfBirth ? 'Invalid date' : 'Select date of birth above'}
                </Text>
                <Lock size={12} color="#D1D5DB" />
              </View>
              <Text className="text-gray-400 text-[10px] font-medium mt-1 ml-1">Auto-calculated — cannot be edited</Text>
            </View>

            <Field label="About / Bio"  value={form.about}        onChangeText={set('about')}        placeholder="Tell employers about yourself..." multiline />

            <ChipGroup label="Gender" options={GENDER_OPTIONS} value={form.gender} onSelect={set('gender')} />

            <CheckboxGroup label="Work Mode" options={WORK_MODE_OPTIONS} value={form.workMode} onToggle={toggleWorkMode} />
            <RadioGroup label="Seniority Level" options={SENIORITY_OPTIONS} value={form.seniority} onSelect={setSeniority} />

            <TouchableOpacity
              onPress={save}
              disabled={saving}
              className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center mt-4 mb-8"
            >
              {saving
                ? <ActivityIndicator color="white" />
                : <><Save size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Save Changes</Text></>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
