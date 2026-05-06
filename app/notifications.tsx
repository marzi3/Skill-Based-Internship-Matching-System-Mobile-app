import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle, Bell, Briefcase,
  ChevronLeft, Clock, Lock, MessageCircle,
  ShieldCheck, Star, Trash2, Zap,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import apiClient from '../src/api/apiClient';

/* ─── Type metadata (matches backend enum exactly) ─────────── */

const TYPE_META: Record<string, { icon: any; color: string; bg: string; title: string }> = {
  APPLICATION_RECEIVED:  { icon: Briefcase,    color: '#F59E0B', bg: '#F59E0B', title: 'Application Received'    },
  APPLICATION_STATUS:    { icon: Briefcase,    color: '#6366F1', bg: '#6366F1', title: 'Application Update'      },
  NEW_MATCH:             { icon: Zap,          color: '#4F46E5', bg: '#4F46E5', title: 'New Match Found'         },
  INTERVIEW_SCHEDULED:   { icon: Clock,        color: '#0EA5E9', bg: '#0EA5E9', title: 'Interview Scheduled'     },
  ACCOUNT_STATUS:        { icon: AlertTriangle,color: '#F97316', bg: '#F97316', title: 'Account Status Update'   },
  NEW_MESSAGE:           { icon: MessageCircle,color: '#8B5CF6', bg: '#8B5CF6', title: 'New Message'             },
  WELCOME:               { icon: Star,         color: '#10B981', bg: '#10B981', title: 'Welcome!'                },
  PASSWORD_RESET:        { icon: Lock,         color: '#EF4444', bg: '#EF4444', title: 'Password Reset'          },
  VERIFICATION_STATUS:   { icon: ShieldCheck,  color: '#10B981', bg: '#10B981', title: 'Verification Update'     },
  USER_REPORTED:         { icon: AlertTriangle,color: '#EF4444', bg: '#EF4444', title: 'Report Received'         },
};

const DEFAULT_META = { icon: Bell, color: '#6B7280', bg: '#6B7280', title: 'Notification' };

function getMeta(type?: string) {
  if (!type) return DEFAULT_META;
  return TYPE_META[type] ?? DEFAULT_META;
}

/* ─── Helpers ───────────────────────────────────────────────── */

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Notification Item ─────────────────────────────────────── */

function NotificationItem({
  notification, onMarkRead, onDelete,
}: {
  notification: any;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = getMeta(notification.type);
  const Icon = meta.icon;

  const handlePress = () => {
    if (!notification.isRead) onMarkRead(notification._id);
    if (notification.link) {
      try { router.push(notification.link as any); } catch {}
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`flex-row px-5 py-4 border-b border-gray-50 ${notification.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
    >
      {/* Icon */}
      <View className="w-11 h-11 rounded-2xl items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: meta.bg + '20' }}>
        <Icon size={20} color={meta.color} />
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-start mb-0.5">
          <Text
            className={`text-sm flex-1 mr-3 ${notification.isRead ? 'text-gray-900 font-bold' : 'text-gray-900 font-black'}`}
            numberOfLines={1}
          >
            {meta.title}
          </Text>
          <Text className="text-[10px] text-gray-400 font-semibold flex-shrink-0">
            {timeAgo(notification.createdAt)}
          </Text>
        </View>

        <Text className="text-xs text-gray-500 leading-5 font-medium" numberOfLines={2}>
          {notification.message}
        </Text>

        {/* Interview metadata */}
        {notification.type === 'INTERVIEW_SCHEDULED' && notification.metadata && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {notification.metadata.date && (
              <View className="flex-row items-center bg-sky-50 px-2 py-0.5 rounded-full">
                <Clock size={9} color="#0EA5E9" />
                <Text className="text-sky-600 text-[10px] font-bold ml-1">{notification.metadata.date}</Text>
              </View>
            )}
            {notification.metadata.time && (
              <View className="bg-sky-50 px-2 py-0.5 rounded-full">
                <Text className="text-sky-600 text-[10px] font-bold">{notification.metadata.time}</Text>
              </View>
            )}
            {notification.metadata.location && (
              <View className="bg-sky-50 px-2 py-0.5 rounded-full">
                <Text className="text-sky-600 text-[10px] font-bold">{notification.metadata.location}</Text>
              </View>
            )}
          </View>
        )}

        {/* Link hint */}
        {notification.link && (
          <Text className="text-indigo-500 text-[10px] font-bold mt-1">Tap to view →</Text>
        )}
      </View>

      {/* Unread dot + delete */}
      <View className="items-center gap-2 flex-shrink-0">
        {!notification.isRead && (
          <View className="w-2 h-2 rounded-full bg-indigo-500" />
        )}
        <TouchableOpacity
          onPress={() => onDelete(notification._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={14} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Screen ────────────────────────────────────────────────── */

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/notifications/delete-all');
            setNotifications([]);
          } catch (err) {
            console.error('Clear all error:', err);
          }
        },
      },
    ]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread   = unreadCount > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-50">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full mr-3">
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-gray-900 tracking-tight">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-indigo-500 font-bold text-[10px] uppercase tracking-widest">{unreadCount} unread</Text>
            )}
          </View>
        </View>

        <View className="flex-row gap-2">
          {hasUnread && (
            <TouchableOpacity onPress={markAllRead} className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
              <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} className="bg-red-50 px-3 py-2 rounded-xl border border-red-100">
              <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest">Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="items-center justify-center py-24 px-8"
            >
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-dashed border-gray-200">
                <Bell size={32} color="#D1D5DB" />
              </View>
              <Text className="text-gray-900 font-black text-base mb-2">All caught up!</Text>
              <Text className="text-gray-400 text-sm text-center font-medium leading-5">
                No notifications yet. We'll let you know when something happens.
              </Text>
            </MotiView>
          ) : (
            notifications.map((n, idx) => (
              <MotiView
                key={n._id}
                from={{ opacity: 0, translateX: -16 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: Math.min(idx * 40, 300) }}
              >
                <NotificationItem
                  notification={n}
                  onMarkRead={markRead}
                  onDelete={deleteNotification}
                />
              </MotiView>
            ))
          )}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
