import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../src/lib/validationSchemas';
import { useAuth } from '../../src/context/AuthContext';
import { Link, router } from 'expo-router';
import { MotiView } from 'moti';
import { Mail, Lock, User, ArrowRight, AlertCircle, Briefcase } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function RegisterScreen() {
  const { register: authRegister } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student' as const,
    },
  });

  const selectedRole = watch('role');

  const handleRoleSelect = (role: 'student' | 'employer') => {
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await authRegister(data);
      if (!result.success) {
        setServerError(result.error || 'Registration failed');
      }
    } catch (err) {
      setServerError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            className="h-48 px-8 justify-center"
          >
            <MotiView from={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Text className="text-3xl font-bold text-white tracking-tight">
                Create Account
              </Text>
              <Text className="text-indigo-100 text-base mt-1">
                Join the platform for verified talent.
              </Text>
            </MotiView>
          </LinearGradient>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="flex-1 -mt-8 bg-white rounded-t-[40px] px-8 pt-8"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Sign Up</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-indigo-600 font-bold">Sign In instead</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {serverError && (
              <View className="bg-red-50 p-4 rounded-xl flex-row items-center mb-6 border border-red-100">
                <AlertCircle size={18} color="#EF4444" className="mr-2" />
                <Text className="text-red-600 flex-1 text-sm">{serverError}</Text>
              </View>
            )}

            {/* Role Selection */}
            <View className="flex-row space-x-4 mb-6">
              <TouchableOpacity 
                onPress={() => handleRoleSelect('student')}
                className={`flex-1 p-4 rounded-2xl border ${selectedRole === 'student' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'} mr-2`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${selectedRole === 'student' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                  <User size={20} color={selectedRole === 'student' ? 'white' : '#6B7280'} />
                </View>
                <Text className={`font-bold ${selectedRole === 'student' ? 'text-indigo-900' : 'text-gray-700'}`}>Student</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleRoleSelect('employer')}
                className={`flex-1 p-4 rounded-2xl border ${selectedRole === 'employer' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'} ml-2`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${selectedRole === 'employer' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                  <Briefcase size={20} color={selectedRole === 'employer' ? 'white' : '#6B7280'} />
                </View>
                <Text className={`font-bold ${selectedRole === 'employer' ? 'text-indigo-900' : 'text-gray-700'}`}>Employer</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    icon={User}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address"
                    placeholder="student@university.edu"
                    icon={Mail}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    icon={Lock}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    secureTextEntry
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="••••••••"
                    icon={Lock}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    secureTextEntry
                  />
                )}
              />

              <Button
                title="Create Account"
                isLoading={isLoading}
                onPress={handleSubmit(onSubmit)}
                icon={ArrowRight}
                className="mt-4"
              />
            </View>

            <View className="h-20" />
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
