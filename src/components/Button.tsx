import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  isLoading, 
  icon: Icon, 
  variant = 'primary', 
  ...props 
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const content = (
    <View className="flex-row items-center justify-center py-4 px-6 rounded-xl">
      {isLoading ? (
        <ActivityIndicator color={isOutline ? '#4F46E5' : 'white'} />
      ) : (
        <>
          <Text className={`font-bold text-lg ${isOutline ? 'text-indigo-600' : 'text-white'}`}>
            {title}
          </Text>
          {Icon && <Icon size={18} color={isOutline ? '#4F46E5' : 'white'} className="ml-2" />}
        </>
      )}
    </View>
  );

  if (isPrimary && !props.disabled) {
    return (
      <TouchableOpacity activeOpacity={0.8} {...props} className="shadow-lg shadow-indigo-300">
        <LinearGradient
          colors={['#4F46E5', '#9333EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-xl"
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      {...props} 
      className={`rounded-xl border ${
        isOutline ? 'border-gray-200 bg-white' : 'bg-gray-900 border-transparent'
      } ${props.disabled ? 'opacity-50' : ''}`}
    >
      {content}
    </TouchableOpacity>
  );
};
