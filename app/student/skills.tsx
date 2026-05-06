import { Stack, router } from 'expo-router';
import { ArrowLeft, CheckCircle, Code, Plus, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    Text,
    TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import skillsCatalog from '../../data/skills.json';
import apiClient from '../../src/api/apiClient';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const LEVEL_STYLE: Record<string, string> = {
  BEGINNER:     'bg-gray-50 border-gray-200 text-gray-600',
  INTERMEDIATE: 'bg-blue-50 border-blue-200 text-blue-700',
  ADVANCED:     'bg-indigo-50 border-indigo-200 text-indigo-700',
  EXPERT:       'bg-emerald-50 border-emerald-200 text-emerald-700',
};

export default function SkillsScreen() {
  const [skills, setSkills]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [removing, setRemoving]   = useState<string | null>(null);
  const [skillName, setSkillName] = useState('');
  const [level, setLevel]         = useState('INTERMEDIATE');

  const suggestions = skillName.trim()
    ? (skillsCatalog as string[])
      .filter(s => s.toLowerCase().includes(skillName.trim().toLowerCase()))
      .filter(s => !skills.some(existing => (existing?.name || '').toLowerCase() === s.toLowerCase()))
      .slice(0, 6)
    : [];

  useEffect(() => {
    apiClient.get('students/profile/skills')
      .then(res => { if (res.data.success) setSkills(res.data.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!skillName.trim()) return;

    const typedName = skillName.trim();

    if (skills.some(s => (s?.name || '').toLowerCase() === typedName.toLowerCase())) {
      Alert.alert('Duplicate Skill', 'This skill is already in your profile.');
      return;
    }

    try {
      setAdding(true);
      const res = await apiClient.post('students/profile/skill', {
        name: typedName, proficiency: level,
      });
      if (res.data.success) {
        const serverSkill = res.data?.data?.skill || res.data?.data || {};
        const nextSkill = {
          _id: serverSkill?._id || `${Date.now()}`,
          name: serverSkill?.name || typedName,
          proficiency: serverSkill?.proficiency || level,
        };
        setSkills(prev => [...prev, nextSkill]);
        setSkillName('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add skill');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (skillId: string) => {
    Alert.alert('Remove Skill', 'Remove this skill from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            setRemoving(skillId);
            await apiClient.delete(`students/profile/skill/${skillId}`);
            setSkills(prev => prev.filter(s => s._id !== skillId));
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove');
          } finally {
            setRemoving(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <Code size={18} color="#4F46E5" />
          <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Skills</Text>
        </View>
        <View className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          <Text className="text-indigo-600 font-black text-xs">{skills.length}</Text>
        </View>
      </View>

      {/* Add form */}
      <View className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Add Skill</Text>
        <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 mb-3">
          <TextInput
            className="flex-1 py-4 text-gray-900 font-bold"
            placeholder="e.g. React Native, Python, Figma..."
            placeholderTextColor="#D1D5DB"
            value={skillName}
            onChangeText={setSkillName}
            onSubmitEditing={add}
            returnKeyType="done"
          />
        </View>
        {suggestions.length > 0 && (
          <View className="bg-white border border-gray-100 rounded-2xl mb-3 overflow-hidden">
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item}
                onPress={() => setSkillName(item)}
                className={`px-4 py-3 ${idx !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="text-sm font-semibold text-gray-700">{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View className="flex-row gap-2 mb-3">
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => setLevel(l)}
              className={`flex-1 py-2 rounded-xl border items-center ${level === l ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-100'}`}
            >
              <Text className={`text-[9px] font-black uppercase tracking-widest ${level === l ? 'text-white' : 'text-gray-400'}`}>
                {l[0] + l.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={add}
          disabled={adding || !skillName.trim()}
          className={`py-4 rounded-2xl flex-row items-center justify-center ${skillName.trim() ? 'bg-indigo-600' : 'bg-gray-100'}`}
        >
          {adding
            ? <ActivityIndicator color="white" />
            : <><Plus size={16} color={skillName.trim() ? 'white' : '#9CA3AF'} />
                <Text className={`font-black uppercase tracking-widest text-xs ml-1.5 ${skillName.trim() ? 'text-white' : 'text-gray-400'}`}>Add Skill</Text></>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Code size={40} color="#E5E7EB" />
              <Text className="text-gray-400 font-bold mt-4">No skills added yet</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const prof = item.proficiency || 'INTERMEDIATE';
            const styleClass = LEVEL_STYLE[prof] || LEVEL_STYLE['INTERMEDIATE'];
            return (
              <MotiView
                from={{ opacity: 0, transform: [{ translateX: -10 }] }}
                animate={{ opacity: 1, transform: [{ translateX: 0 }] }}
                transition={{ delay: index * 40 }}
                className={`flex-row items-center p-4 rounded-2xl border mb-2 ${styleClass}`}
              >
                <CheckCircle size={16} color={prof === 'EXPERT' ? '#10B981' : '#6366F1'} />
                <Text className="font-black text-gray-900 ml-3 flex-1">{item.name}</Text>
                <View className={`px-2.5 py-1 rounded-xl mr-3 ${styleClass}`}>
                  <Text className={`text-[9px] font-black uppercase ${styleClass.split(' ').find(c => c.startsWith('text-'))}`}>
                    {prof[0] + prof.slice(1).toLowerCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => remove(item._id)}
                  disabled={removing === item._id}
                  className="p-2"
                >
                  {removing === item._id
                    ? <ActivityIndicator size="small" color="#EF4444" />
                    : <Trash2 size={16} color="#EF4444" />}
                </TouchableOpacity>
              </MotiView>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
