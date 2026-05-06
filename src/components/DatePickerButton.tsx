import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  value: string;           // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  accentColor?: string;
  required?: boolean;
  label?: string;
}

function formatDisplay(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function DatePickerButton({
  value,
  onChange,
  placeholder = 'Select date',
  minDate = new Date(1950, 0, 1),
  maxDate = new Date(),
  accentColor = '#4F46E5',
  required,
  label,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View className="mb-4">
        {label && (
          <View className="flex-row mb-2">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
            {required && <Text className="text-red-400 ml-1">*</Text>}
          </View>
        )}
        <View style={{ position: 'relative' }}>
          {/* Visible display row (pointer-events blocked so the input below captures clicks) */}
          <View
            className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            style={{ pointerEvents: 'none' } as any}
          >
            <Text className={`font-medium flex-1 ${value ? 'text-gray-900' : 'text-gray-300'}`}>
              {value ? formatDisplay(value) : placeholder}
            </Text>
            <Calendar size={18} color={accentColor} />
          </View>
          {/* Invisible native date input covering the whole button */}
          {(React as any).createElement('input', {
            type: 'date',
            value: value || '',
            min: minDate.toISOString().slice(0, 10),
            max: maxDate.toISOString().slice(0, 10),
            onChange: (e: any) => onChange(e.target.value),
            style: {
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            },
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {label && (
        <View className="flex-row mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</Text>
          {required && <Text className="text-red-400 ml-1">*</Text>}
        </View>
      )}
      <TouchableOpacity
        onPress={() => setShowPicker(v => !v)}
        className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
      >
        <Text className={`font-medium flex-1 ${value ? 'text-gray-900' : 'text-gray-300'}`}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Calendar size={18} color={showPicker ? '#818CF8' : accentColor} />
      </TouchableOpacity>
      {showPicker && (
        <>
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minDate}
            maximumDate={maxDate}
            onChange={(event, date) => {
              if (Platform.OS === 'android') setShowPicker(false);
              if (date && event.type !== 'dismissed') {
                onChange(date.toISOString().slice(0, 10));
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity onPress={() => setShowPicker(false)} className="mt-1 items-end">
              <Text className="font-black text-sm" style={{ color: accentColor }}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
