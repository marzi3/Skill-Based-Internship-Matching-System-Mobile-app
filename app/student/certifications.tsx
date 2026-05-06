import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Award, Eye, File, FileText, Plus, Trash2 } from 'lucide-react-native';
import { DatePickerButton } from '../../src/components/DatePickerButton';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';

function Field({ label, value, onChangeText, placeholder, keyboardType, required }: any) {
  return (
    <View className="mb-4">
      <View className="flex-row mb-2">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
        {required && <Text className="text-red-400 ml-1">*</Text>}
      </View>
      <TextInput
        className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor="#D1D5DB"
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function CertificationsScreen() {
  const [certs, setCerts]                   = useState<any[]>([]);
  const [documents, setDocuments]           = useState<any[]>([]);
  const [resume, setResume]                 = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [adding, setAdding]                 = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [removing, setRemoving]             = useState<string | null>(null);
  const [removingDoc, setRemovingDoc]       = useState<string | null>(null);
  const [removingResume, setRemovingResume] = useState(false);
  const [form, setForm] = useState({ name: '', credentialUrl: '', issuedDate: '' });
  const [docTitle, setDocTitle] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const [resumePreview, setResumePreview] = useState<string | null>(null);

  const getServerRoot = () => {
    const base = String(apiClient.defaults.baseURL || '').replace(/\/$/, '');
    return base.replace(/\/api\/v1\/?$/i, '') || base;
  };

  const normalizeFileUrl = (filePath?: string | null) => {
    if (!filePath) return null;
    const fp = String(filePath);
    if (/^https?:\/\//i.test(fp)) return fp;
    const serverRoot = getServerRoot();
    return serverRoot + (fp.startsWith('/') ? '' : '/') + fp;
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    apiClient.get('students/profile')
      .then(res => {
        if (res.data.success) {
          setCerts(res.data.data?.certifications || []);
          setDocuments(res.data.data?.uploadedCertificates || []);
          const r = res.data.data?.resume || null;
          setResume(r);
          if (r && r.filePath) {
            setResumePreview(normalizeFileUrl(String(r.filePath)));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateProfileState = (student: any) => {
    setCerts(student?.certifications || []);
    setDocuments(student?.uploadedCertificates || []);
    setResume(student?.resume || null);
  };

  const add = async () => {
    if (!form.name || !form.issuedDate) {
      Alert.alert('Missing Fields', 'Name and issued date are required.');
      return;
    }
    try {
      setAdding(true);
      const payload = { ...form };
      const res = await apiClient.post('students/profile/certification', payload);
      if (res.data.success) {
        updateProfileState(res.data.data);
        setForm({ name: '', credentialUrl: '', issuedDate: '' });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert('Remove', 'Remove this certification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            setRemoving(id);
            const res = await apiClient.delete(`students/profile/certification/${id}`);
            if (res.data.success) {
              updateProfileState(res.data.data);
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove');
          } finally {
            setRemoving(null);
          }
        },
      },
    ]);
  };

  const pickDocument = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (doc.canceled) return;

      const file = doc.assets[0];
      if (!file.uri) {
        Alert.alert('Error', 'Could not read file');
        return;
      }

      // Validate size and mime (try to get size/type when missing)
      let size: number | undefined = (file as any).size || (file as any).fileSize;
      let mime: string | undefined = (file as any).mimeType || (file as any).type || undefined;

      if (Platform.OS === 'web' && (!size || !mime)) {
        const r = await fetch(file.uri);
        const blob = await r.blob();
        size = blob.size;
        mime = blob.type;
      }

      if (size && size > MAX_FILE_SIZE) {
        Alert.alert('File too large', 'Certificate must be 5MB or smaller.');
        return;
      }

      if (mime && !ALLOWED_DOC_TYPES.includes(mime)) {
        Alert.alert('Invalid file type', 'Allowed: PDF, JPG, JPEG, WEBP');
        return;
      }

      // Save selected file for explicit upload
      setSelectedDoc(file);
      Alert.alert('Ready', `${file.name} selected. Tap "Upload Certificate File" to upload.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick document');
    }
  };
  const uploadDocument = async (fileParam?: any) => {
    const file = fileParam || selectedDoc;
    if (!file) {
      Alert.alert('No file', 'Please choose a file first');
      return;
    }
    // optional re-validate size/type here if needed
    try {
      setUploading(true);
      const formData = new FormData() as any;
      
      // On web, fetch the file as a Blob; on native, use the file object directly
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('certificateFile', blob, file.name);
      } else {
        formData.append('certificateFile', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }
      
      if (docTitle.trim()) {
        formData.append('title', docTitle.trim());
      }

      const res = await apiClient.post(
        'students/profile/certificate-file',
        formData
      );

      if (res.data.success) {
        updateProfileState(res.data.data);
        setDocTitle('');
        Alert.alert('Success', 'Document uploaded successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (id: string) => {
    Alert.alert('Remove', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            setRemovingDoc(id);
            const res = await apiClient.delete(`students/profile/certificate-file/${id}`);
            if (res.data.success) {
              updateProfileState(res.data.data);
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove document');
          } finally {
            setRemovingDoc(null);
          }
        },
      },
    ]);
  };

  const pickResume = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (doc.canceled) return;

      const file = doc.assets[0];
      if (!file.uri) {
        Alert.alert('Error', 'Could not read file');
        return;
      }

      // show preview immediately for faster feedback
      setResumePreview(file.uri);
      await uploadResume(file);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick resume');
    }
  };

  const uploadResume = async (file: any) => {
    try {
      setUploadingResume(true);
      const formData = new FormData() as any;
      
      // On web, fetch the file as a Blob; on native, use the file object directly
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('resume', blob, file.name);
      } else {
        formData.append('resume', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }

      const res = await apiClient.post(
        'students/profile/resume',
        formData
      );

      if (res.data.success) {
        const studentData = res.data.data?.student || res.data.data;
        updateProfileState(studentData);
        // set preview to the uploaded file URL returned by backend (if available)
        const r = studentData?.resume || (res.data.data?.student?.resume) || null;
        if (r && r.filePath) {
          setResumePreview(normalizeFileUrl(String(r.filePath)));
        }
        Alert.alert('Success', 'Resume uploaded successfully');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const openResume = () => {
    const preview = resumePreview || (resume && resume.filePath ? normalizeFileUrl(String(resume.filePath)) : null);
    if (!preview) {
      Alert.alert('Error', 'Resume path not available');
      return;
    }

    if (Platform.OS === 'web') {
      window.open(preview!, '_blank');
      return;
    }

    // Native: try to open with Linking (or fallback to showing URL)
    Linking.openURL(preview as string).catch(() => {
      Alert.alert('Resume', `File: ${resume?.fileName || 'Resume'}`, [
        { text: 'OK' }
      ]);
    });
  };

  const openDocument = (doc: any) => {
    if (!doc?.filePath) {
      Alert.alert('Error', 'Document path not available');
      return;
    }
    const preview = normalizeFileUrl(String(doc.filePath));
    if (Platform.OS === 'web') {
      window.open(preview!, '_blank');
      return;
    }
    Linking.openURL(preview as string).catch(() => {
      Alert.alert('Document', `File: ${doc?.fileName || 'Document'}`, [{ text: 'OK' }]);
    });
  };

  const openCredential = (url: string) => {
    if (!url) return;
    const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (Platform.OS === 'web') {
      window.open(full, '_blank');
      return;
    }
    Linking.openURL(full).catch(() =>
      Alert.alert('Cannot Open', 'Could not open the credential URL.')
    );
  };

  const deleteResume = () => {
    Alert.alert('Delete Resume', 'Remove your resume?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setRemovingResume(true);
            const res = await apiClient.delete('students/profile/resume');
            if (res.data.success) {
              const studentData = res.data.data?.student || res.data.data;
              updateProfileState(studentData);
              Alert.alert('Success', 'Resume deleted');
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete resume');
          } finally {
            setRemovingResume(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View className="flex-row items-center flex-1">
            <Award size={18} color="#F59E0B" />
            <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Credentials</Text>
          </View>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* CERTIFICATIONS */}
          {!loading && certs.length > 0 && (
            <View className="px-6 pt-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3">Certifications</Text>
              {certs.map((cert, i) => (
                <MotiView
                  key={cert._id || i}
                  from={{ opacity: 0, transform: [{ translateY: 8 }] }}
                  animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
                  transition={{ delay: i * 60 }}
                  className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-2"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                        <Award size={18} color="#F59E0B" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-black text-gray-900">{cert.name}</Text>
                        {cert.issuedDate && (
                          <Text className="text-amber-600 text-[10px] font-bold mt-0.5">
                            {new Date(cert.issuedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </Text>
                        )}
                        {cert.credentialUrl && (
                          <Text className="text-indigo-400 text-[10px] font-medium mt-1" numberOfLines={1}>
                            {cert.credentialUrl}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      {cert.credentialUrl && (
                        <TouchableOpacity
                          onPress={() => openCredential(cert.credentialUrl)}
                          className="p-2 bg-indigo-50 rounded-xl border border-indigo-100"
                        >
                          <Eye size={14} color="#4F46E5" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => remove(cert._id)}
                        disabled={removing === cert._id}
                        className="p-2 bg-red-50 rounded-xl border border-red-100"
                      >
                        {removing === cert._id
                          ? <ActivityIndicator size="small" color="#EF4444" />
                          : <Trash2 size={14} color="#EF4444" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>
          )}

          {/* DOCUMENTS */}
          {!loading && documents.length > 0 && (
            <View className="px-6 pt-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Documents</Text>
              {documents.map((doc, i) => (
                <View
                  key={doc._id || i}
                  className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                      <File size={18} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      {doc.title && <Text className="font-black text-gray-900">{doc.title}</Text>}
                      <Text className="text-blue-600 text-[10px] font-bold mt-0.5 uppercase tracking-widest">
                        {doc.fileName}
                      </Text>
                      {doc.uploadedAt && (
                        <Text className="text-gray-400 text-[10px] mt-1">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeDocument(doc._id)}
                    disabled={removingDoc === doc._id}
                    className="p-2 bg-red-50 rounded-xl border border-red-100"
                  >
                    {removingDoc === doc._id
                      ? <ActivityIndicator size="small" color="#EF4444" />
                      : <Trash2 size={14} color="#EF4444" />}
                  </TouchableOpacity>
                     <TouchableOpacity
                       onPress={() => openDocument(doc)}
                       className="ml-2 p-2 bg-blue-50 rounded-xl border border-blue-100"
                     >
                       <Eye size={14} color="#3B82F6" />
                     </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* RESUME */}
          {resume && resume.fileName && (
            <View className="px-6 pt-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-3">Resume</Text>
              <View className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
                    <FileText size={18} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-gray-900">{resume.fileName}</Text>
                    <Text className="text-green-600 text-[10px] font-bold mt-0.5 uppercase tracking-widest">
                      Resume
                    </Text>
                    {resume.uploadedAt && (
                      <Text className="text-gray-400 text-[10px] mt-1">
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => resume.filePath && openResume()}
                    className="p-2 bg-green-100 rounded-xl border border-green-200"
                  >
                    <Eye size={14} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={deleteResume}
                    disabled={removingResume}
                    className="p-2 bg-red-50 rounded-xl border border-red-100"
                  >
                    {removingResume
                      ? <ActivityIndicator size="small" color="#EF4444" />
                      : <Trash2 size={14} color="#EF4444" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {loading && <View className="py-10 items-center"><ActivityIndicator color="#4F46E5" /></View>}

          {/* ADD CERTIFICATION FORM */}
          <View className="px-6 pt-4 pb-2">
              <Text className="text-sm text-gray-600 mb-3">Online Certifications
              Add your professional certifications to improve your profile credibility.</Text>
              <Text className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Add Certification</Text>
              <Field label="Certification Name" value={form.name} onChangeText={set('name')} placeholder="e.g., AWS Certified Developer" required />

              <DatePickerButton
                label="Issued Date"
                required
                value={form.issuedDate}
                onChange={val => set('issuedDate')(val)}
                placeholder="Select issued date"
                maxDate={new Date()}
                minDate={new Date(1990, 0, 1)}
                accentColor="#F59E0B"
              />

              <Field label="Credential URL (optional)" value={form.credentialUrl} onChangeText={set('credentialUrl')} placeholder="https://credential-url.com" keyboardType="url" />

            <TouchableOpacity
              onPress={add}
              disabled={adding}
              className="bg-amber-500 py-5 rounded-2xl flex-row items-center justify-center"
            >
              {adding
                ? <ActivityIndicator color="white" />
                : <><Plus size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Add Certification</Text></>}
            </TouchableOpacity>
          </View>

          {/* UPLOAD DOCUMENT FORM */}
          <View className="px-6 pt-6 pb-2 border-t border-gray-100">
            <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Certificate File Upload</Text>
            <Text className="text-sm text-gray-600 mb-3">Upload certificate files from your device.</Text>
            <Field label="Certificate Title (Optional)" value={docTitle} onChangeText={setDocTitle} placeholder="e.g., AWS Developer Certificate" />
            <Text className="text-[10px] text-gray-500 mb-2">Allowed: PDF, JPG, JPEG, WEBP (max 5MB)</Text>

            <View className="mb-3">
              <Text className="text-sm text-gray-700">Certificate File: {selectedDoc?.name || 'No file chosen'}</Text>
            </View>

            {!selectedDoc ? (
              <TouchableOpacity
                onPress={pickDocument}
                disabled={uploading}
                className="bg-blue-500 py-5 rounded-2xl flex-row items-center justify-center"
              >
                <><Plus size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Choose File</Text></>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => uploadDocument()}
                disabled={uploading}
                className="bg-blue-500 py-5 rounded-2xl flex-row items-center justify-center"
              >
                {uploading
                  ? <ActivityIndicator color="white" />
                  : <><Plus size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Upload Certificate File</Text></>}
              </TouchableOpacity>
            )}
          </View>

          {/* UPLOAD RESUME FORM */}
          <View className="px-6 pt-6 pb-8 border-t border-gray-100">
            <Text className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-4">
              {resume && resume.fileName ? 'Update Resume' : 'Upload Resume'}
            </Text>
            <Text className="text-[10px] text-gray-500 mb-3">Supported: PDF, DOC, DOCX</Text>

            <TouchableOpacity
              onPress={pickResume}
              disabled={uploadingResume}
              className="bg-green-600 py-5 rounded-2xl flex-row items-center justify-center"
            >
              {uploadingResume
                ? <ActivityIndicator color="white" />
                : <><Plus size={16} color="white" /><Text className="text-white font-black uppercase tracking-widest text-xs ml-2">{resume && resume.fileName ? 'Update' : 'Upload'} Resume</Text></>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
