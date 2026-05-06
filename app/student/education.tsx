import { Stack, router } from 'expo-router';
import { ArrowLeft, Calendar, GraduationCap, Plus, Trash2 } from 'lucide-react-native';
import { DatePickerButton } from '../../src/components/DatePickerButton';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import schoolCatalog from '../../data/school.json';
import universityCatalog from '../../data/university.json';
import apiClient from '../../src/api/apiClient';

const DEGREE_LEVELS = [
  { value: 'HIGH_SCHOOL', label: 'High School Diploma' },
  { value: 'ASSOCIATE', label: "Associate's Degree" },
  { value: 'BACHELOR', label: "Bachelor's Degree" },
];

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
      />
    </View>
  );
}

function parseDateInput(value: string) {
  const match = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addYearsToDate(startDate: string, years: number) {
  const parsed = parseDateInput(startDate);
  if (!parsed || !years || years <= 0) return '';
  const next = new Date(parsed);
  const targetYear = next.getFullYear() + years;
  const targetMonth = next.getMonth();
  const targetDay = Math.min(next.getDate(), daysInMonth(targetYear, targetMonth));
  next.setFullYear(targetYear, targetMonth, targetDay);
  return formatDateInput(next);
}

function calculateYearsBetween(startDate: string, endDate: string) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end || end < start) return '';

  let totalYears = end.getFullYear() - start.getFullYear();

  if (totalYears < 0) return '';

  const candidateEnd = parseDateInput(addYearsToDate(startDate, totalYears));
  if (candidateEnd && candidateEnd > end) {
    totalYears -= 1;
  }

  return totalYears > 0 ? String(totalYears) : '';
}

function formatDurationYears(durationMonths: any) {
  const months = Number(durationMonths);
  if (!Number.isFinite(months) || months <= 0) return '';
  const years = months / 12;
  const displayYears = Number.isInteger(years) ? String(years) : String(Number(years.toFixed(1)));
  return `Duration: ${displayYears} year${years === 1 ? '' : 's'}`;
}

export default function EducationScreen() {
  const [education, setEducation] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingSchool, setAddingSchool] = useState(false);
  const [removingSchool, setRemovingSchool] = useState<string | null>(null);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [showInstitutionSuggestions, setShowInstitutionSuggestions] = useState(false);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [form, setForm] = useState({
    institution: '', degree: '', field: '',
    degreeLevel: 'BACHELOR', startDate: '', endDate: '', durationYears: '',
  });
  const [schoolForm, setSchoolForm] = useState({ school: '' });

  const institutionSuggestions = form.institution.trim()
    ? ((universityCatalog as Record<string, Array<{ name: string; aliases?: string[] }>>)['Sri Lanka'] || [])
      .filter(u => {
        const q = form.institution.trim().toLowerCase();
        return u.name.toLowerCase().includes(q) || (u.aliases || []).some(a => a.toLowerCase().includes(q));
      })
      .map(u => u.name)
      .filter((name, idx, arr) => arr.indexOf(name) === idx)
      .slice(0, 6)
    : [];

  const schoolSuggestions = schoolForm.school.trim()
    ? ((schoolCatalog as Record<string, Array<{ name: string; aliases?: string[] }>>)['Sri Lanka'] || [])
      .filter(item => {
        const query = schoolForm.school.trim().toLowerCase();
        return item.name.toLowerCase().includes(query)
          || (item.aliases || []).some(alias => alias.toLowerCase().includes(query));
      })
      .map(item => item.name)
      .filter((name, index, array) => array.indexOf(name) === index)
      .slice(0, 6)
    : [];

  const set = (key: string) => (val: any) => setForm(f => ({ ...f, [key]: val }));
  
  const setInstitution = (val: string) => {
    setForm(f => ({ ...f, institution: val }));
    setShowInstitutionSuggestions(true);
  };

  const setSchool = (val: string) => {
    setSchoolForm({ school: val });
    setShowSchoolSuggestions(true);
  };
  
  
  const setStartDate = (val: string) => {
    setForm(f => {
      const next = { ...f, startDate: val };
      const years = Number(f.durationYears);
      if (val && Number.isFinite(years) && years > 0) {
        next.endDate = addYearsToDate(val, years);
      }
      return next;
    });
  };
  
  const setEndDate = (val: string) => {
    setForm(f => ({
      ...f,
      endDate: val,
      durationYears: f.startDate ? calculateYearsBetween(f.startDate, val) : f.durationYears,
    }));
  };
  
  const setDurationYears = (val: string) => {
    const digitsOnly = val.replace(/[^0-9]/g, '');
    const parsedYears = digitsOnly ? Number(digitsOnly) : 0;
    setForm(f => ({
      ...f,
      durationYears: digitsOnly,
      endDate: f.startDate && parsedYears > 0 ? addYearsToDate(f.startDate, parsedYears) : f.endDate,
    }));
  };

  useEffect(() => {
    apiClient.get('students/profile')
      .then(res => {
        if (res.data.success) {
          setEducation(res.data.data?.education || []);
          setSchools(res.data.data?.schools || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.institution || !form.degree || !form.field || !form.startDate) {
      Alert.alert('Missing Fields', 'Institution, degree, field and start date are required.');
      return;
    }
    try {
      setAdding(true);
      const payload = { ...form, durationMonths: form.durationYears ? Number(form.durationYears) * 12 : 0 } as any;
      delete payload.durationYears;
      const res = await apiClient.post('students/profile/education', payload);
      if (res.data.success) {
        setProfileState(res.data.data);
        setForm({ institution: '', degree: '', field: '', degreeLevel: 'BACHELOR', startDate: '', endDate: '', durationYears: '' });
        setShowInstitutionSuggestions(false);
        setEditingId(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const setProfileState = (student: any) => {
    setEducation(student?.education || []);
    setSchools(student?.schools || []);
  };

  const edit = (edu: any) => {
    const durationYears = edu.durationMonths ? String(Math.round(edu.durationMonths / 12)) : '';
    setForm({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      degreeLevel: edu.degreeLevel || 'BACHELOR',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      durationYears,
    });
    setEditingId(edu._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      institution: '', degree: '', field: '',
      degreeLevel: 'BACHELOR', startDate: '', endDate: '', durationYears: '',
    });
  };

  const update = async () => {
    if (!form.institution || !form.degree || !form.field || !form.startDate) {
      Alert.alert('Missing Fields', 'Institution, degree, field and start date are required.');
      return;
    }
    try {
      setAdding(true);
      const payload = { ...form, durationMonths: form.durationYears ? Number(form.durationYears) * 12 : 0 } as any;
      delete payload.durationYears;
      const res = await apiClient.put(`students/profile/education/${editingId}`, payload);
      if (res.data.success) {
        setProfileState(res.data.data);
        cancelEdit();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setAdding(false);
    }
  };

  const addSchool = async () => {
    if (!schoolForm.school.trim()) {
      Alert.alert('Missing Fields', 'School name is required.');
      return;
    }

    try {
      setAddingSchool(true);
      const res = await apiClient.post('students/profile/school', {
        school: schoolForm.school.trim(),
      });

      if (res.data.success) {
        setProfileState(res.data.data);
        setSchoolForm({ school: '' });
        setShowSchoolSuggestions(false);
        setEditingSchoolId(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add school');
    } finally {
      setAddingSchool(false);
    }
  };

  const editSchool = (schoolEntry: any) => {
    setSchoolForm({ school: schoolEntry.school || '' });
    setEditingSchoolId(schoolEntry._id);
    setShowSchoolSuggestions(false);
  };

  const cancelSchoolEdit = () => {
    setEditingSchoolId(null);
    setSchoolForm({ school: '' });
    setShowSchoolSuggestions(false);
  };

  const updateSchool = async () => {
    if (!editingSchoolId) return;
    if (!schoolForm.school.trim()) {
      Alert.alert('Missing Fields', 'School name is required.');
      return;
    }

    try {
      setAddingSchool(true);
      const res = await apiClient.put(`students/profile/school/${editingSchoolId}`, {
        school: schoolForm.school.trim(),
      });

      if (res.data.success) {
        setProfileState(res.data.data);
        cancelSchoolEdit();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update school');
    } finally {
      setAddingSchool(false);
    }
  };

  const removeSchool = (id: string) => {
    Alert.alert('Remove', 'Remove this school entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setRemovingSchool(id);
            const res = await apiClient.delete(`students/profile/school/${id}`);
            if (res.data.success) {
              setProfileState(res.data.data);
              if (editingSchoolId === id) cancelSchoolEdit();
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove school');
          } finally {
            setRemovingSchool(null);
          }
        },
      },
    ]);
  };

  const remove = (id: string) => {
    Alert.alert('Remove', 'Remove this education entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            setRemoving(id);
            const res = await apiClient.delete(`students/profile/education/${id}`);
            if (res.data.success) {
              setProfileState(res.data.data);
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-row items-center px-6 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-4">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View className="flex-row items-center flex-1">
            <GraduationCap size={18} color="#4F46E5" />
            <Text className="text-lg font-black text-gray-900 tracking-tight ml-2">Education</Text>
          </View>
          <View className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            <Text className="text-indigo-600 font-black text-xs">{education.length}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Existing entries */}
          {!loading && education.length > 0 && (
            <View className="px-6 pt-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Current</Text>
              {education.map((edu, i) => (
                <MotiView
                  key={edu._id || i}
                  from={{ opacity: 0, transform: [{ translateY: 8 }] }}
                  animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
                  transition={{ delay: i * 60 }}
                  className="bg-gray-50 p-5 rounded-3xl border border-gray-100 mb-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-gray-900 font-black text-base">{edu.institution}</Text>
                      <Text className="text-indigo-600 font-bold text-xs mt-0.5 uppercase tracking-widest">
                        {edu.degree} · {edu.field}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Calendar size={11} color="#9CA3AF" />
                        <Text className="text-gray-400 text-[10px] font-bold ml-1.5 uppercase tracking-widest">
                          {new Date(edu.startDate).getFullYear()} – {edu.endDate ? new Date(edu.endDate).getFullYear() : edu.isCurrentlyStudying ? 'Present' : ''}
                        </Text>
                        {edu.isCurrentlyStudying && !edu.endDate && (
                          <View className="ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <Text className="text-emerald-600 text-[8px] font-black">CURRENT</Text>
                          </View>
                        )}
                      </View>
                      {formatDurationYears(edu.durationMonths) ? (
                        <Text className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
                          {formatDurationYears(edu.durationMonths)}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => edit(edu)}
                        className="px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100"
                      >
                        <Text className="text-indigo-600 font-black text-xs">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => remove(edu._id)}
                        disabled={removing === edu._id}
                        className="p-2 bg-red-50 rounded-xl border border-red-100"
                      >
                        {removing === edu._id
                          ? <ActivityIndicator size="small" color="#EF4444" />
                          : <Trash2 size={14} color="#EF4444" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>
          )}

          {loading && (
            <View className="py-10 items-center">
              <ActivityIndicator color="#4F46E5" />
            </View>
          )}

          {/* Add/Edit form */}
          <View className="px-6 pt-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                {editingId ? 'Edit Education' : 'Add Education'}
              </Text>
              {editingId && (
                <TouchableOpacity onPress={cancelEdit} className="px-3 py-1 bg-gray-100 rounded-full">
                  <Text className="text-gray-600 text-xs font-bold">Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="mb-4">
              <View className="flex-row mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">Institution</Text>
                <Text className="text-red-400 ml-1">*</Text>
              </View>
              <TextInput
                className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                value={form.institution}
                onChangeText={setInstitution}
                placeholder="University of Jaffna"
                placeholderTextColor="#D1D5DB"
              />
              {showInstitutionSuggestions && institutionSuggestions.length > 0 && (
                <View className="bg-white border border-gray-100 rounded-2xl mt-2 overflow-hidden">
                  {institutionSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setForm(f => ({ ...f, institution: item }));
                        setShowInstitutionSuggestions(false);
                      }}
                      className={`px-4 py-3 ${idx !== institutionSuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <Text className="text-sm font-semibold text-gray-700">{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Field label="Degree" value={form.degree} onChangeText={set('degree')} placeholder="Bachelor of Science" required />
            <Field label="Field of Study" value={form.field} onChangeText={set('field')} placeholder="Computer Science" required />

            <DatePickerButton
              label="Start Date"
              required
              value={form.startDate}
              onChange={val => setStartDate(val)}
              placeholder="Select start date"
              maxDate={new Date()}
              minDate={new Date(1950, 0, 1)}
            />

            <Field
              label="Duration (Years)"
              value={form.durationYears}
              onChangeText={setDurationYears}
              placeholder="4"
              keyboardType="number-pad"
            />

            <DatePickerButton
              label="End Date"
              value={form.endDate}
              onChange={val => setEndDate(val)}
              placeholder="Select end date (optional)"
              minDate={parseDateInput(form.startDate) || new Date(1950, 0, 1)}
            />

            {/* Degree Level */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Degree Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {DEGREE_LEVELS.map(level => (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() => set('degreeLevel')(level.value)}
                      className={`px-4 py-2.5 rounded-2xl border ${form.degreeLevel === level.value ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-100'}`}
                    >
                      <Text className={`text-[10px] font-black uppercase tracking-widest ${form.degreeLevel === level.value ? 'text-white' : 'text-gray-500'}`}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={editingId ? update : add}
              disabled={adding}
              className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center"
            >
              {adding ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  {editingId ? (
                    <Text className="text-white font-black uppercase tracking-widest text-xs">Update Education</Text>
                  ) : (
                    <>
                      <Plus size={16} color="white" />
                      <Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Add Education</Text>
                    </>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="px-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Schools</Text>
              {schools.length > 0 && (
                <View className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  <Text className="text-indigo-600 font-black text-xs">{schools.length}</Text>
                </View>
              )}
            </View>

            {schools.length > 0 ? (
              <View className="mb-4">
                {schools.map((schoolEntry, index) => (
                  <View
                    key={schoolEntry._id || index}
                    className="bg-gray-50 p-5 rounded-3xl border border-gray-100 mb-3"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-gray-900 font-black text-base tracking-tight">
                          {schoolEntry.school}
                        </Text>
                        <Text className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
                          School record
                        </Text>
                      </View>
                      <View className="flex-row gap-1">
                        <TouchableOpacity
                          onPress={() => editSchool(schoolEntry)}
                          className="px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100"
                        >
                          <Text className="text-indigo-600 font-black text-xs">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeSchool(schoolEntry._id)}
                          disabled={removingSchool === schoolEntry._id}
                          className="p-2 bg-red-50 rounded-xl border border-red-100"
                        >
                          {removingSchool === schoolEntry._id
                            ? <ActivityIndicator size="small" color="#EF4444" />
                            : <Trash2 size={14} color="#EF4444" />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 p-5 rounded-3xl border border-dashed border-gray-200 mb-4">
                <Text className="text-gray-400 font-medium">No schools added yet.</Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                {editingSchoolId ? 'Edit School' : 'Add School'}
              </Text>
              {editingSchoolId && (
                <TouchableOpacity onPress={cancelSchoolEdit} className="px-3 py-1 bg-gray-100 rounded-full">
                  <Text className="text-gray-600 text-xs font-bold">Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="mb-4">
              <View className="flex-row mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">School</Text>
                <Text className="text-red-400 ml-1">*</Text>
              </View>
              <TextInput
                className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                value={schoolForm.school}
                onChangeText={setSchool}
                placeholder="Jaffna Central College"
                placeholderTextColor="#D1D5DB"
              />
              {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                <View className="bg-white border border-gray-100 rounded-2xl mt-2 overflow-hidden">
                  {schoolSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setSchoolForm({ school: item });
                        setShowSchoolSuggestions(false);
                      }}
                      className={`px-4 py-3 ${idx !== schoolSuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <Text className="text-sm font-semibold text-gray-700">{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={editingSchoolId ? updateSchool : addSchool}
              disabled={addingSchool}
              className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center"
            >
              {addingSchool ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black uppercase tracking-widest text-xs">
                  {editingSchoolId ? 'Update School' : 'Add School'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
