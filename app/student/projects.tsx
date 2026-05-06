import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Edit2, ExternalLink, FolderKanban, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function Field({ label, value, onChangeText, placeholder, required, multiline, maxLength }: any) {
  return (
    <View className="mb-4">
      <View className="flex-row mb-2">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
        {required && <Text className="text-red-400 ml-1">*</Text>}
      </View>
      <TextInput
        className={`bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium ${multiline ? 'min-h-[110px]' : ''}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor="#D1D5DB"
        autoCapitalize="none"
        multiline={!!multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxLength={maxLength}
      />
    </View>
  );
}

export default function ProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<any[]>([]);
  const [removeScreenshotIds, setRemoveScreenshotIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    technologies: '',
    repositoryUrl: '',
    liveUrl: '',
    description: '',
  });

  const descriptionCount = useMemo(() => form.description.length, [form.description]);
  const isEditing = !!editingProjectId;

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

  const normalizeExternalUrl = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const loadProjects = async () => {
    try {
      const res = await apiClient.get('students/profile');
      if (res.data.success) {
        setProjects(res.data.data?.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const set = (key: string) => (val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const pickImages = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (picked.canceled) return;

      const assets = Array.isArray(picked.assets) ? picked.assets : [];
      if (assets.length === 0) return;

      const accepted: any[] = [];
      const errors: string[] = [];

      for (const file of assets) {
        let size: number | undefined = (file as any).size || (file as any).fileSize;
        let mime: string | undefined = (file as any).mimeType || (file as any).type || undefined;

        if (Platform.OS === 'web' && (!size || !mime) && file.uri) {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          size = blob.size;
          mime = blob.type;
        }

        if (size && size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: larger than 5MB`);
          continue;
        }

        if (mime && !ALLOWED_IMAGE_TYPES.includes(mime)) {
          errors.push(`${file.name}: invalid type`);
          continue;
        }

        accepted.push(file);
      }

      const next = [...selectedImages, ...accepted].slice(0, MAX_IMAGES);
      setSelectedImages(next);

      if (errors.length > 0) {
        Alert.alert('Some files skipped', errors.slice(0, 3).join('\n'));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to choose images');
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExistingScreenshot = (screenshotId: string) => {
    if (!screenshotId) return;
    setRemoveScreenshotIds((prev) =>
      prev.includes(screenshotId)
        ? prev.filter((id) => id !== screenshotId)
        : [...prev, screenshotId]
    );
  };

  const openExternalUrl = async (url: string) => {
    const normalized = normalizeExternalUrl(url);
    if (!normalized) return;
    try {
      const canOpen = await Linking.canOpenURL(normalized);
      if (!canOpen) {
        Alert.alert('Invalid Link', 'This link cannot be opened.');
        return;
      }
      await Linking.openURL(normalized);
    } catch {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const openScreenshot = async (filePath?: string) => {
    const url = normalizeFileUrl(filePath || '');
    if (!url) return;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open screenshot.');
    }
  };

  const resetForm = () => {
    setForm({ title: '', technologies: '', repositoryUrl: '', liveUrl: '', description: '' });
    setSelectedImages([]);
    setEditingProjectId(null);
    setExistingScreenshots([]);
    setRemoveScreenshotIds([]);
  };

  const startEditProject = (project: any) => {
    setEditingProjectId(project?._id || null);
    setForm({
      title: String(project?.title || ''),
      technologies: Array.isArray(project?.technologies) ? project.technologies.join(', ') : '',
      repositoryUrl: String(project?.repositoryUrl || ''),
      liveUrl: String(project?.liveUrl || ''),
      description: String(project?.description || ''),
    });
    setExistingScreenshots(Array.isArray(project?.screenshots) ? project.screenshots : []);
    setRemoveScreenshotIds([]);
    setSelectedImages([]);
  };

  const saveProject = async () => {
    if (!form.title.trim()) {
      Alert.alert('Missing Field', 'Project title is required.');
      return;
    }

    if (isEditing) {
      const keepCount = existingScreenshots.filter((shot) => !removeScreenshotIds.includes(String(shot?._id))).length;
      if (keepCount + selectedImages.length > MAX_IMAGES) {
        Alert.alert('Too many images', 'You can keep and upload up to 10 screenshots per project.');
        return;
      }
    } else if (selectedImages.length > MAX_IMAGES) {
      Alert.alert('Too many images', 'You can upload up to 10 images.');
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData() as any;
      fd.append('title', form.title.trim());
      fd.append('technologies', form.technologies.trim());
      fd.append('repositoryUrl', form.repositoryUrl.trim());
      fd.append('liveUrl', form.liveUrl.trim());
      fd.append('description', form.description.trim());

      if (isEditing && removeScreenshotIds.length > 0) {
        fd.append('removeScreenshotIds', JSON.stringify(removeScreenshotIds));
      }

      for (const file of selectedImages) {
        if (!file?.uri) continue;

        if (Platform.OS === 'web') {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          fd.append('projectImages', blob, file.name || `project-${Date.now()}.jpg`);
        } else {
          fd.append('projectImages', {
            uri: file.uri,
            name: file.name || `project-${Date.now()}.jpg`,
            type: file.mimeType || 'image/jpeg',
          });
        }
      }

      const res = isEditing
        ? await apiClient.put(`students/profile/project/${editingProjectId}`, fd)
        : await apiClient.post('students/profile/project', fd);

      if (res.data.success) {
        setProjects(res.data.data?.projects || []);
        resetForm();
        Alert.alert('Success', isEditing ? 'Project updated successfully.' : 'Project added successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || (isEditing ? 'Failed to update project' : 'Failed to add project'));
    } finally {
      setSaving(false);
    }
  };

  const removeProject = (projectId: string) => {
    Alert.alert('Delete Project', 'Remove this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingProjectId(projectId);
            const res = await apiClient.delete(`students/profile/project/${projectId}`);
            if (res.data.success) {
              setProjects(res.data.data?.projects || []);
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete project');
          } finally {
            setDeletingProjectId(null);
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
            <FolderKanban size={18} color="#4F46E5" />
            <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Projects</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                {isEditing ? 'Edit Project' : 'Add Project'}
              </Text>
              {isEditing && (
                <TouchableOpacity
                  onPress={resetForm}
                  className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-full"
                >
                  <Text className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Field
              label="Project Title"
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g., Internship Matching Engine"
              required
            />

            <Field
              label="Technologies (comma separated)"
              value={form.technologies}
              onChangeText={set('technologies')}
              placeholder="React, Node.js, MongoDB"
            />

            <Field
              label="Repository URL (optional)"
              value={form.repositoryUrl}
              onChangeText={set('repositoryUrl')}
              placeholder="https://github.com/username/repo"
            />

            <Field
              label="Live URL (optional)"
              value={form.liveUrl}
              onChangeText={set('liveUrl')}
              placeholder="https://your-project.com"
            />

            <Field
              label="Description (optional)"
              value={form.description}
              onChangeText={set('description')}
              placeholder="Describe your project and what you built"
              multiline
              maxLength={500}
            />
            <Text className="text-[10px] text-gray-400 font-bold text-right -mt-2 mb-4">{descriptionCount}/500</Text>

            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Project Screenshots / UI Images</Text>

              <TouchableOpacity
                onPress={pickImages}
                className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <ImageIcon size={16} color="#4F46E5" />
                  <Text className="text-gray-700 font-medium ml-2">
                    {selectedImages.length > 0 ? `${selectedImages.length} file(s) selected` : 'No file chosen'}
                  </Text>
                </View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Choose</Text>
              </TouchableOpacity>

              <Text className="text-[11px] text-gray-400 mt-2 leading-4">
                Upload up to 10 images. Each file must be JPG, PNG, or WEBP and under 5MB.
              </Text>

              {isEditing && existingScreenshots.length > 0 && (
                <View className="mt-3">
                  <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Existing Screenshots ({existingScreenshots.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {existingScreenshots.map((shot: any, idx: number) => {
                      const src = normalizeFileUrl(shot?.filePath);
                      const isMarkedForRemoval = removeScreenshotIds.includes(String(shot?._id));
                      return (
                        <View key={shot?._id || idx} className="mr-2">
                          <TouchableOpacity onPress={() => openScreenshot(shot?.filePath)} activeOpacity={0.85}>
                            {src ? (
                              <Image
                                source={{ uri: src }}
                                className={`w-20 h-20 rounded-xl border ${isMarkedForRemoval ? 'border-red-400' : 'border-gray-200'}`}
                                resizeMode="cover"
                              />
                            ) : (
                              <View className={`w-20 h-20 rounded-xl border bg-white items-center justify-center ${isMarkedForRemoval ? 'border-red-400' : 'border-gray-200'}`}>
                                <ImageIcon size={16} color="#9CA3AF" />
                              </View>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleRemoveExistingScreenshot(String(shot?._id || ''))}
                            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full items-center justify-center ${isMarkedForRemoval ? 'bg-red-600' : 'bg-black/60'}`}
                          >
                            <Trash2 size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                  {removeScreenshotIds.length > 0 && (
                    <Text className="text-[10px] text-red-500 font-bold mt-2">
                      {removeScreenshotIds.length} screenshot(s) will be removed when you update.
                    </Text>
                  )}
                </View>
              )}

              {selectedImages.length > 0 && (
                <View className="mt-3">
                  <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    New Image Preview ({selectedImages.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedImages.map((img, i) => (
                      <View key={`${img?.name || 'image'}-${i}`} className="mr-2">
                        <Image
                          source={{ uri: img?.uri }}
                          className="w-20 h-20 rounded-xl border border-gray-200"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => removeSelectedImage(i)}
                          className="absolute -top-1 -right-1 bg-red-600 w-6 h-6 rounded-full items-center justify-center"
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={saveProject}
              disabled={saving}
              className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Plus size={16} color="white" />
                  <Text className="text-white font-black uppercase tracking-widest text-xs ml-2">{isEditing ? 'Update Project' : 'Add Project'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="pb-10">
            <Text className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">My Projects</Text>

            {loading ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#4F46E5" />
              </View>
            ) : projects.length === 0 ? (
              <View className="bg-gray-50 p-5 rounded-2xl border border-dashed border-gray-200">
                <Text className="text-gray-400 font-medium">No projects added yet.</Text>
              </View>
            ) : (
              projects.map((project: any) => (
                <View key={project?._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-black text-gray-900">{project?.title || 'Untitled Project'}</Text>
                      {!!project?.description && (
                        <Text className="text-xs text-gray-500 mt-1">{project.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeProject(project._id)} className="p-1">
                      {deletingProjectId === project._id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Trash2 size={16} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startEditProject(project)} className="p-1 ml-2">
                      <Edit2 size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>

                  {Array.isArray(project?.technologies) && project.technologies.length > 0 && (
                    <Text className="text-[11px] text-indigo-600 font-bold mt-2">
                      {project.technologies.join(' • ')}
                    </Text>
                  )}

                  <View className="flex-row mt-3">
                    {!!project?.repositoryUrl && (
                      <TouchableOpacity
                        onPress={() => openExternalUrl(project.repositoryUrl)}
                        className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl mr-2 flex-row items-center"
                      >
                        <ExternalLink size={11} color="#4F46E5" />
                        <Text className="text-[10px] font-black text-indigo-600 ml-1">Repository</Text>
                      </TouchableOpacity>
                    )}
                    {!!project?.liveUrl && (
                      <TouchableOpacity
                        onPress={() => openExternalUrl(project.liveUrl)}
                        className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex-row items-center"
                      >
                        <ExternalLink size={11} color="#10B981" />
                        <Text className="text-[10px] font-black text-emerald-600 ml-1">Live</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {Array.isArray(project?.screenshots) && project.screenshots.length > 0 && (
                    <View className="mt-3">
                      <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Screenshots ({project.screenshots.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {project.screenshots.map((shot: any, idx: number) => {
                          const src = normalizeFileUrl(shot?.filePath);
                          return (
                            <TouchableOpacity
                              key={shot?._id || idx}
                              onPress={() => openScreenshot(shot?.filePath)}
                              className="mr-2"
                              activeOpacity={0.85}
                            >
                              {src ? (
                                <Image
                                  source={{ uri: src }}
                                  className="w-20 h-20 rounded-xl border border-gray-200"
                                  resizeMode="cover"
                                />
                              ) : (
                                <View className="w-20 h-20 rounded-xl border border-gray-200 bg-white items-center justify-center">
                                  <ImageIcon size={16} color="#9CA3AF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
