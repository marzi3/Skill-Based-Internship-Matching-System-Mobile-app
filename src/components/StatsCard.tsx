import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'primary' | 'white';
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'white' 
}) => {
  const isPrimary = variant === 'primary';

  const content = (
    <View className="p-5 space-y-3 justify-between">
      <View className={`p-2.5 rounded-xl w-fit ${isPrimary ? 'bg-white/20' : 'bg-indigo-50'}`}>
        <Icon size={20} color={isPrimary ? 'white' : '#4F46E5'} />
      </View>
      <View>
        <Text className={`font-bold uppercase text-[10px] tracking-widest ${isPrimary ? 'text-indigo-100' : 'text-gray-500'}`}>
          {title}
        </Text>
        <Text className={`text-2xl font-black ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className={`flex-1 rounded-2xl overflow-hidden shadow-sm ${isPrimary ? 'shadow-indigo-200' : 'bg-white border border-gray-100 shadow-gray-100'}`}
      style={{ height: 130 }}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#4F46E5', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </MotiView>
  );
};
