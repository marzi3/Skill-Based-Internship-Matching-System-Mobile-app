import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Building2, Camera, Image as ImageIcon, Loader2, Save, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function countWords(value: string) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-4">
      <Text className="text-gray-900 text-lg font-black tracking-tight">{title}</Text>
      {subtitle ? <Text className="text-gray-500 text-sm mt-1 leading-5">{subtitle}</Text> : null}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#D1D5DB"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`bg-gray-50 border border-gray-100 rounded-2xl px-4 text-gray-900 font-medium ${multiline ? 'py-3 min-h-[120px]' : 'py-4'}`}
      />
    </View>
  );
}

function ChipGroup({ label, options, value, onSelect }: any) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option: string) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(option)}
              className={`px-4 py-2.5 rounded-2xl border ${selected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-100'}`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-widest ${selected ? 'text-white' : 'text-gray-500'}`}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ImageRow({ label, uri, icon: Icon, onPress, busy }: any) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</Text>
      <TouchableOpacity onPress={onPress} disabled={busy} className="bg-white border border-gray-100 rounded-3xl p-4 flex-row items-center shadow-sm">
        <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center overflow-hidden mr-4">
          {uri ? <Image source={{ uri }} className="w-full h-full" /> : <Icon size={20} color="#4F46E5" />}
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-black text-sm">{busy ? 'Uploading...' : uri ? 'Change image' : 'Upload image'}</Text>
          <Text className="text-gray-500 text-xs mt-1">Tap to choose a file</Text>
        </View>
        {busy ? <ActivityIndicator color="#4F46E5" /> : <Camera size={18} color="#D1D5DB" />}
      </TouchableOpacity>
    </View>
  );
}

export default function EmployerEditProfileScreen() {
  const { user, checkUserLoggedIn } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profilePreview, setProfilePreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [profileAsset, setProfileAsset] = useState<any>(null);
  const [coverAsset, setCoverAsset] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    companyDescription: '',
    businessRegistrationNumber: '',
    website: '',
    phone: '',
    positionInCompany: '',
    location: '',
    industry: '',
    companySize: '',
    foundedYear: '',
  });

  const coverUri = useMemo(() => coverPreview || user?.coverImage || '', [coverPreview, user?.coverImage]);
  const profileUri = useMemo(() => profilePreview || user?.profilePicture || '', [profilePreview, user?.profilePicture]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      companyName: user.companyName || '',
      companyDescription: user.companyDescription || '',
      businessRegistrationNumber: user.businessRegistrationNumber || '',
      website: user.website || '',
      phone: user.phone || '',
      positionInCompany: user.positionInCompany || '',
      location: user.location || '',
      industry: user.industry || '',
      companySize: user.companySize || '',
      foundedYear: user.foundedYear ? String(user.foundedYear) : '',
    });
  }, [user]);

  const getServerRoot = () => {
    const rawBase = String(apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
    return rawBase || 'http://localhost:5000';
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
    const fieldName = mode === 'profile' ? 'profilePicture' : 'coverImage';

    if (!asset) return null;

    try {
      const formData = new FormData() as any;

      if (Platform.OS === 'web') {
        // On web: fetch blob from URI
        try {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          formData.append(fieldName, blob, asset.fileName || `${fieldName}.jpg`);
        } catch (e) {
          console.log('Fetch failed, trying direct append');
          formData.append(fieldName, asset, asset.fileName || `${fieldName}.jpg`);
        }
      } else {
        // On native: use file object with uri, name, type
        formData.append(fieldName, {
          uri: asset.uri,
          name: asset.fileName || `${fieldName}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any);
      }

      return formData;
    } catch (error: any) {
      console.error(`Error preparing image (${mode}):`, error);
      return null;
    }
  };

  const pickImage = async (mode: 'profile' | 'cover') => {
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

      // Store asset and preview, upload will happen when user clicks Save
      const uriPreview = selected?.uri || '';
      if (mode === 'profile') {
        setProfileAsset(selected);
        setProfilePreview(uriPreview);
      } else {
        setCoverAsset(selected);
        setCoverPreview(uriPreview);
      }

      Alert.alert('Image Selected', 'Image will be uploaded when you save.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      if (countWords(form.companyDescription) > 200) {
        Alert.alert('Too long', 'Company description must be 200 words or less.');
        return;
      }

      setSaving(true);

      // Prepare FormData with form fields + images
      const formData = new FormData() as any;

      // Add text fields
      formData.append('name', form.name.trim());
      formData.append('companyName', form.companyName.trim());
      formData.append('businessRegistrationNumber', form.businessRegistrationNumber.trim());
      formData.append('website', form.website.trim());
      formData.append('phone', form.phone.trim());
      formData.append('companyDescription', form.companyDescription.trim());
      formData.append('positionInCompany', form.positionInCompany.trim());
      formData.append('location', form.location.trim());
      formData.append('industry', form.industry.trim());
      formData.append('companySize', form.companySize);
      formData.append('foundedYear', form.foundedYear.trim());

      // Add profile image if selected
      if (profileAsset) {
        if (Platform.OS === 'web') {
          try {
            const response = await fetch(profileAsset.uri);
            const blob = await response.blob();
            formData.append('profilePicture', blob, profileAsset.fileName || 'profilePicture.jpg');
          } catch (e) {
            console.log('Web profile fetch failed, trying direct append');
            formData.append('profilePicture', profileAsset, profileAsset.fileName || 'profilePicture.jpg');
          }
        } else {
          formData.append('profilePicture', {
            uri: profileAsset.uri,
            name: profileAsset.fileName || 'profilePicture.jpg',
            type: profileAsset.mimeType || 'image/jpeg',
          } as any);
        }
      }

      // Add cover image if selected
      if (coverAsset) {
        if (Platform.OS === 'web') {
          try {
            const response = await fetch(coverAsset.uri);
            const blob = await response.blob();
            console.log('Cover blob size:', blob.size, 'type:', blob.type);
            formData.append('coverImage', blob, coverAsset.fileName || 'coverImage.jpg');
          } catch (e) {
            console.error('Web cover fetch error:', e);
            try {
              // Fallback: try direct append
              formData.append('coverImage', coverAsset, coverAsset.fileName || 'coverImage.jpg');
            } catch (e2) {
              console.error('Web cover direct append failed:', e2);
            }
          }
        } else {
          formData.append('coverImage', {
            uri: coverAsset.uri,
            name: coverAsset.fileName || 'coverImage.jpg',
            type: coverAsset.mimeType || 'image/jpeg',
          } as any);
        }
      }

      console.log('FormData keys:', Array.from(formData.entries()).map((entry: any) => entry[0]));
      const response = await apiClient.put('/auth/profile', formData);
      if (response.data) {
        await checkUserLoggedIn();
        // Clear image assets after successful save
        setProfileAsset(null);
        setCoverAsset(null);
        Alert.alert('Success', 'Employer profile updated successfully.', [
          { text: 'OK', onPress: () => router.replace('/employer/profile' as any) },
        ]);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Save failed', error.response?.data?.message || error.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={() => router.replace('/employer/profile' as any)} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-gray-900 tracking-tight">Edit Employer Profile</Text>
            <Text className="text-xs text-gray-500 mt-1">Update only the fields supported by the backend.</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-6 py-6">
            <SectionTitle title="Photos" subtitle="Select your profile picture and cover image." />
            <ImageRow label="Profile Photo" uri={profileUri} icon={Building2} busy={uploadingProfile} onPress={() => pickImage('profile')} />
            <ImageRow label="Cover Image" uri={coverUri} icon={ImageIcon} busy={uploadingCover} onPress={() => pickImage('cover')} />

            <Text className="text-[10px] text-gray-400 font-medium mt-1 mb-4">
              Images will be uploaded when you click Save Profile below.
            </Text>

            <SectionTitle title="Company Details" subtitle="These fields map directly to your backend employer profile." />
            <Field label="Contact Person" value={form.name} onChangeText={(text: string) => setForm((prev) => ({ ...prev, name: text }))} placeholder="Your full name" />
            <Field label="Company Name" value={form.companyName} onChangeText={(text: string) => setForm((prev) => ({ ...prev, companyName: text }))} placeholder="Company name" />
            <Field label="Company Description" value={form.companyDescription} onChangeText={(text: string) => setForm((prev) => ({ ...prev, companyDescription: text }))} placeholder="Short company description" multiline />
            <Field label="Business Registration Number" value={form.businessRegistrationNumber} onChangeText={(text: string) => setForm((prev) => ({ ...prev, businessRegistrationNumber: text }))} placeholder="Registration number" />
            <Field label="Website" value={form.website} onChangeText={(text: string) => setForm((prev) => ({ ...prev, website: text }))} placeholder="https://..." />
            <Field label="Phone" value={form.phone} onChangeText={(text: string) => setForm((prev) => ({ ...prev, phone: text }))} placeholder="Phone number" keyboardType="phone-pad" />
            <Field label="Position in Company" value={form.positionInCompany} onChangeText={(text: string) => setForm((prev) => ({ ...prev, positionInCompany: text }))} placeholder="Founder, HR Manager, etc." />
            <Field label="Location" value={form.location} onChangeText={(text: string) => setForm((prev) => ({ ...prev, location: text }))} placeholder="City / country" />
            <Field label="Industry" value={form.industry} onChangeText={(text: string) => setForm((prev) => ({ ...prev, industry: text }))} placeholder="Software, Finance, etc." />
            <ChipGroup label="Company Size" options={COMPANY_SIZE_OPTIONS} value={form.companySize} onSelect={(option: string) => setForm((prev) => ({ ...prev, companySize: option }))} />
            <Field label="Founded Year" value={form.foundedYear} onChangeText={(text: string) => setForm((prev) => ({ ...prev, foundedYear: text.replace(/[^0-9]/g, '') }))} placeholder="2020" keyboardType="number-pad" />

            <View className="bg-gray-50 border border-gray-100 rounded-3xl p-4 mt-2 mb-4">
              <View className="flex-row items-center mb-2">
                <ShieldCheck size={16} color="#4F46E5" />
                <Text className="ml-2 text-gray-900 font-black text-xs uppercase tracking-widest">Verification Status</Text>
              </View>
              <Text className="text-gray-700 text-sm">{user.verificationStatus || 'unverified'}</Text>
              {user.verificationFeedback ? <Text className="text-gray-500 text-sm mt-2 leading-5">{user.verificationFeedback}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className={`rounded-3xl py-4 items-center flex-row justify-center ${saving ? 'bg-indigo-300' : 'bg-indigo-600'}`}
            >
              {saving ? (
                <Loader2 size={18} color="white" />
              ) : (
                <Save size={18} color="white" />
              )}
              <Text className="text-white font-black uppercase tracking-widest text-xs ml-3">
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <View className="h-10" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}