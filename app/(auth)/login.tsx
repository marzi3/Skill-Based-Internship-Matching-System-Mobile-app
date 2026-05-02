import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../src/lib/validationSchemas';
import { useAuth } from '../../src/context/AuthContext';
import { Link, router } from 'expo-router';
import { MotiView } from 'moti';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        setServerError(result.error || 'Login failed');
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
          {/* Header Section */}
          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            className="h-64 px-8 justify-center"
          >
            <MotiView
              from={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 200 }}
            >
              <Text className="text-4xl font-bold text-white tracking-tight">
                Welcome Back
              </Text>
              <Text className="text-indigo-100 text-lg mt-2">
                Sign in to continue your journey.
              </Text>
            </MotiView>
          </LinearGradient>

          {/* Form Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="flex-1 -mt-10 bg-white rounded-t-[40px] px-8 pt-10"
          >
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-bold text-gray-900">Sign In</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-indigo-600 font-bold">Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {serverError && (
              <View className="bg-red-50 p-4 rounded-xl flex-row items-center mb-6 border border-red-100">
                <AlertCircle size={20} color="#EF4444" className="mr-2" />
                <Text className="text-red-600 flex-1">{serverError}</Text>
              </View>
            )}

            <View className="space-y-4">
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

              <TouchableOpacity className="items-end mb-6">
                <Text className="text-gray-500 font-medium">Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                isLoading={isLoading}
                onPress={handleSubmit(onSubmit)}
                icon={ArrowRight}
              />
            </View>

            {/* Social Login (Optional in Mobile, usually requires native SDKs) */}
            <View className="mt-10">
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="mx-4 text-gray-400 text-sm">Or continue with</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              <View className="flex-row space-x-4">
                <TouchableOpacity className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl bg-white mr-2">
                  <Text className="text-gray-700 font-bold">Google</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl bg-white ml-2">
                  <Text className="text-gray-700 font-bold">LinkedIn</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-20" />
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
