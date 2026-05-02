import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MotiView } from 'moti';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const ProfileStrengthRing: React.FC<Props> = ({ 
  percentage = 0, 
  size = 120, 
  strokeWidth = 8 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return { stroke: '#10b981', label: 'Excellent' };
    if (pct >= 50) return { stroke: '#6366f1', label: 'Good' };
    return { stroke: '#f59e0b', label: 'Needs work' };
  };

  const { stroke, label } = getColor(percentage);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className="text-2xl font-black text-gray-900">{percentage}%</Text>
        <Text className="text-[8px] font-black uppercase tracking-widest text-gray-500">{label}</Text>
      </View>
    </View>
  );
};
