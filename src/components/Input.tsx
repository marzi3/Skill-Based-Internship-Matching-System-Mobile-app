import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon: Icon, 
  error, 
  secureTextEntry, 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View className="space-y-1 mb-4">
      {label && (
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-1">
          {label}
        </Text>
      )}
      <View className="relative">
        {Icon && (
          <View className="absolute left-3 top-[14px] z-10">
            <Icon size={18} color={error ? '#EF4444' : '#6B7280'} />
          </View>
        )}
        <TextInput
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor="#9CA3AF"
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} ${isPassword ? 'pr-10' : 'pr-4'} py-3 bg-white border rounded-xl focus:border-indigo-500 text-gray-900 ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[14px]"
          >
            {showPassword ? (
              <EyeOff size={18} color="#6B7280" />
            ) : (
              <Eye size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-rose-500 text-xs font-bold mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
};
