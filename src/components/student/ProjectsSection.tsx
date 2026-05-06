import { router } from 'expo-router';
import { Edit2, ExternalLink, FolderKanban } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  projects: any[];
}

const normalizeUrl = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export function ProjectsSection({ projects }: Props) {
  const items = Array.isArray(projects) ? projects : [];

  const openUrl = async (url: string) => {
    const normalized = normalizeUrl(url);
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

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <FolderKanban size={14} color="#4F46E5" />
          <Text className="text-base font-black uppercase text-gray-900 ml-2">Projects</Text>
          {items.length > 0 && (
            <View className="ml-2 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              <Text className="text-indigo-700 text-xs font-black">{items.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/projects' as any)}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
        >
          <Edit2 size={12} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs font-black ml-1.5 uppercase">Manage</Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <View className="bg-gray-50 rounded-3xl px-5 border border-gray-100">
          {items.slice(0, 3).map((project: any, i: number, arr: any[]) => (
            <View key={project?._id || i} className={`py-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Text className="text-gray-900 text-base font-black">{project?.title || 'Untitled Project'}</Text>
              {!!project?.description && (
                <Text className="text-sm text-gray-900 font-semibold mt-1" numberOfLines={2}>{project.description}</Text>
              )}

              {Array.isArray(project?.technologies) && project.technologies.length > 0 && (
                <Text className="text-sm text-indigo-700 font-black mt-2" numberOfLines={1}>
                  {project.technologies.join(' • ')}
                </Text>
              )}

              <View className="flex-row mt-3">
                {!!project?.repositoryUrl && (
                  <TouchableOpacity
                    onPress={() => openUrl(project.repositoryUrl)}
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl mr-2 flex-row items-center"
                  >
                    <ExternalLink size={11} color="#4F46E5" />
                    <Text className="text-xs font-black text-indigo-700 ml-1">Repo</Text>
                  </TouchableOpacity>
                )}
                {!!project?.liveUrl && (
                  <TouchableOpacity
                    onPress={() => openUrl(project.liveUrl)}
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <ExternalLink size={11} color="#10B981" />
                    <Text className="text-xs font-black text-emerald-700 ml-1">Live</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {items.length > 3 && (
            <TouchableOpacity
              onPress={() => router.push('/student/projects' as any)}
              className="py-3 border-t border-gray-100"
            >
              <Text className="text-sm font-black text-indigo-700">View all {items.length} projects</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/student/projects' as any)}
          className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 flex-row items-center"
        >
          <Edit2 size={16} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-base ml-3">Add projects...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
