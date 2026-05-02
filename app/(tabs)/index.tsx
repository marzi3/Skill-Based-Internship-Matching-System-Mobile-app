import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { StudentDashboard } from '../../src/components/StudentDashboard';
import { EmployerDashboard } from '../../src/components/EmployerDashboard';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {user?.role === 'employer' ? (
        <EmployerDashboard />
      ) : (
        <StudentDashboard />
      )}
    </SafeAreaView>
  );
}
