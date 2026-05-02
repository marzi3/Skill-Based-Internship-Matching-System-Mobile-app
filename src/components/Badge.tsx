import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md'
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'secondary': return 'bg-gray-50 text-gray-600 border-gray-100';
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'danger': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  const getSizeStyles = () => {
    return size === 'sm' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[10px]';
  };

  return (
    <View className={`${getStyles()} ${getSizeStyles()} rounded-full border`}>
      <Text className={`font-black uppercase tracking-widest ${getStyles().split(' ').find(s => s.startsWith('text-'))}`}>
        {children}
      </Text>
    </View>
  );
};
