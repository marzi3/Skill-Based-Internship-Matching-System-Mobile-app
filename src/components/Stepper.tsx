import React from 'react';
import { View, Text } from 'react-native';

interface StepperProps {
  currentStep: number;
  steps: { id: number; title: string }[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <View className="flex-row items-center justify-center space-x-4 px-6 py-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View className="items-center">
            <View 
              className={`w-8 h-8 rounded-full items-center justify-center ${
                currentStep >= step.id ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`font-black text-[10px] ${currentStep >= step.id ? 'text-white' : 'text-gray-500'}`}>
                {step.id}
              </Text>
            </View>
            <Text 
              className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                currentStep >= step.id ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {step.title}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View 
              className={`h-0.5 w-8 -mt-4 ${
                currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'
              }`} 
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};
