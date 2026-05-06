import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────── */

type VerificationUser = {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'employer' | 'admin';
  verificationStatus?: string;
  status?: string;
  isVerified?: boolean;
  companyName?: string;
  businessRegistrationNumber?: string;
  businessDocument?: string;
  studentId?: string;
  studentIdImage?: string;
  website?: string;
  createdAt?: string;
  reviewType?: 'verification' | 'account';
};

type ReportData = {
  applicationsTrend: { _id: string; count: number }[];
  placements: { _id: string; count: number }[];
  skillsDemand: { _id: string; count: number }[];
  matchDistribution: { _id: string; count: number }[];
};

type RecentUser = {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'employer';
  status: string;
  isVerified: boolean;
  companyName?: string;
  createdAt: string;
};

/* ─── Constants ─────────────────────────────────────────────── */

const SCREEN_W = Dimensions.get('window').width;
const CHART_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
const MATCH_COLORS: Record<string, string> = {
  EXCELLENT: '#10B981',
  GOOD: '#6366F1',
  FAIR: '#F59E0B',
  POOR: '#EF4444',
};

const STATS_CONFIG = [
  { key: 'totalStudents',     label: 'Students',     icon: GraduationCap, color: '#6366F1', bg: '#EEF2FF' },
  { key: 'totalEmployers',    label: 'Employers',    icon: Building2,     color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'activeInternships', label: 'Internships',  icon: Briefcase,     color: '#10B981', bg: '#ECFDF5' },
  { key: 'totalApplications', label: 'Applications', icon: BookOpen,      color: '#F59E0B', bg: '#FFFBEB' },
] as const;

/* ─── Chart helpers ─────────────────────────────────────────── */

const getApiOrigin = () => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  return raw.replace(/\/api\/v1$/, '');
};
const getUploadUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiOrigin()}/${path.replace(/^\/+/, '')}`;
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  approved:  { bg: '#ECFDF5', text: '#059669', label: 'Approved' },
  pending:   { bg: '#FFFBEB', text: '#D97706', label: 'Pending'  },
  suspended: { bg: '#FEF2F2', text: '#DC2626', label: 'Suspended'},
};

/* ─── Line / Area Chart ─────────────────────────────────────── */

function TrendChart({ data }: { data: { _id: string; count: number }[] }) {
  if (data.length < 2) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 100 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No trend data yet</Text>
      </View>
    );
  }

  const W = SCREEN_W - 88;
  const H = 130;
  const PAD = { top: 16, right: 12, bottom: 30, left: 30 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.count), 1);

  const gx = (i: number) => PAD.left + (i / (data.length - 1)) * iW;
  const gy = (v: number) => PAD.top + (1 - v / maxVal) * iH;

  const pts = data.map((d, i) => ({ x: gx(i), y: gy(d.count) }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + iH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + iH).toFixed(1)} Z`;
  const baseline = PAD.top + iH;

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6366F1" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#6366F1" stopOpacity="0.0" />
        </LinearGradient>
      </Defs>
      {/* Grid */}
      {[0, 0.5, 1].map((t, i) => {
        const y = PAD.top + (1 - t) * iH;
        return (
          <G key={i}>
            <Path d={`M ${PAD.left} ${y.toFixed(1)} L ${W - PAD.right} ${y.toFixed(1)}`}
              stroke="#F3F4F6" strokeWidth={1} />
            <SvgText x={PAD.left - 4} y={y + 3.5} fontSize={8} fill="#D1D5DB" textAnchor="end">
              {Math.round(t * maxVal)}
            </SvgText>
          </G>
        );
      })}
      {/* Baseline */}
      <Path d={`M ${PAD.left} ${baseline} L ${W - PAD.right} ${baseline}`} stroke="#E5E7EB" strokeWidth={1} />
      {/* Area */}
      <Path d={areaPath} fill="url(#tg)" />
      {/* Line */}
      <Path d={linePath} stroke="#6366F1" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={5} fill="white" />
          <Circle cx={p.x} cy={p.y} r={3.5} fill="#6366F1" />
        </G>
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        i % 2 === 0 ? (
          <SvgText key={i} x={gx(i)} y={H - 6} fontSize={8} fill="#9CA3AF" textAnchor="middle">
            {d._id.slice(5)}
          </SvgText>
        ) : null
      ))}
    </Svg>
  );
}

/* ─── Donut Chart ───────────────────────────────────────────── */

function DonutChart({ data, size = 130 }: { data: { _id: string; count: number }[]; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.4, r = size * 0.25;
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth={R - r} />
        <SvgText x={cx} y={cy + 4} fontSize={10} fill="#D1D5DB" textAnchor="middle">No data</SvgText>
      </Svg>
    );
  }

  let cursor = -Math.PI / 2;
  const segments = data.map(d => {
    const angle = (d.count / total) * 2 * Math.PI;
    const seg = { d, sa: cursor, ea: cursor + angle, angle };
    cursor += angle;
    return seg;
  });

  const arc = (sa: number, ea: number, angle: number) => {
    const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
    const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
    const ix1 = cx + r * Math.cos(ea), iy1 = cy + r * Math.sin(ea);
    const ix2 = cx + r * Math.cos(sa), iy2 = cy + r * Math.sin(sa);
    const lg = angle > Math.PI ? 1 : 0;
    return [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${R} ${R} 0 ${lg} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
      `A ${r} ${r} 0 ${lg} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
      'Z',
    ].join(' ');
  };

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const color = MATCH_COLORS[seg.d._id] || CHART_COLORS[i % CHART_COLORS.length];
        return <Path key={i} d={arc(seg.sa, seg.ea, seg.angle)} fill={color} />;
      })}
      <SvgText x={cx} y={cy - 5} fontSize={18} fill="#1F2937" fontWeight="bold" textAnchor="middle">
        {total}
      </SvgText>
      <SvgText x={cx} y={cy + 11} fontSize={8} fill="#9CA3AF" textAnchor="middle">
        MATCHES
      </SvgText>
    </Svg>
  );
}

/* ─── Skill Bars ────────────────────────────────────────────── */

const resolveSkillName = (id: any): string => {
  if (!id) return 'Unknown';
  if (typeof id === 'string') return id;
  if (typeof id === 'object') return id.name || id.label || JSON.stringify(id);
  return String(id);
};

function SkillBars({ data }: { data: { _id: any; count: number }[] }) {
  const top = data.slice(0, 6);
  const max = Math.max(...top.map(d => d.count), 1);
  return (
    <View>
      {top.map((d, i) => {
        const skillName = resolveSkillName(d._id);
        return (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#374151', fontSize: 11, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {skillName}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>
                {d.count}
              </Text>
            </View>
            <View style={{ height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                height: 5,
                width: `${(d.count / max) * 100}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                borderRadius: 3,
              }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ─── Placements Bar Chart ──────────────────────────────────── */

function PlacementsChart({ data }: { data: { _id: string; count: number }[] }) {
  const top = data.slice(0, 5);
  if (top.length === 0) return null;

  const W = SCREEN_W - 88;
  const H = 120;
  const PAD = { top: 16, right: 10, bottom: 38, left: 28 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...top.map(d => d.count), 1);
  const slotW = iW / top.length;
  const barW = Math.min(28, slotW * 0.55);
  const baseline = PAD.top + iH;

  return (
    <Svg width={W} height={H}>
      <Path d={`M ${PAD.left} ${baseline} L ${W - PAD.right} ${baseline}`} stroke="#E5E7EB" strokeWidth={1} />
      {top.map((d, i) => {
        const barH = Math.max((d.count / maxVal) * iH, 2);
        const cx = PAD.left + i * slotW + slotW / 2;
        const x = cx - barW / 2;
        const y = baseline - barH;
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const label = (d._id || 'Other').length > 7 ? (d._id || 'Other').slice(0, 6) + '…' : (d._id || 'Other');
        return (
          <G key={i}>
            <Rect x={x.toFixed(1)} y={y.toFixed(1)} width={barW} height={barH.toFixed(1)} rx={4} fill={color} opacity={0.9} />
            <SvgText x={cx} y={y - 4} fontSize={8.5} fill={color} textAnchor="middle" fontWeight="bold">
              {d.count}
            </SvgText>
            <SvgText x={cx} y={H - 10} fontSize={7.5} fill="#9CA3AF" textAnchor="middle">
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [pending, setPending]           = useState<VerificationUser[]>([]);
  const [stats, setStats]               = useState({ totalStudents: 0, totalEmployers: 0, activeInternships: 0, totalApplications: 0 });
  const [reports, setReports]           = useState<ReportData | null>(null);
  const [recentUsers, setRecentUsers]   = useState<RecentUser[]>([]);
  const [filter, setFilter]             = useState<'all' | 'student' | 'employer'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VerificationUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredPending = useMemo(() => {
    if (filter === 'all') return pending;
    return pending.filter(item => item.role === filter);
  }, [filter, pending]);

  const employerCount = pending.filter(i => i.role === 'employer').length;
  const studentCount  = pending.filter(i => i.role === 'student').length;

  const fetchData = async () => {
    try {
      const [dashRes, pendingRes, employersRes, studentsRes, reportsRes, recentStudentsRes, recentEmployersRes] = await Promise.all([
        apiClient.get('/admin/dashboard'),
        apiClient.get('/verification/pending'),
        apiClient.get('/admin/employers', { params: { status: 'pending', limit: 50 } }),
        apiClient.get('/admin/students',  { params: { status: 'pending', limit: 50 } }),
        apiClient.get('/admin/reports').catch(() => ({ data: null })),
        apiClient.get('/admin/students',  { params: { limit: 8 } }),
        apiClient.get('/admin/employers', { params: { limit: 8 } }),
      ]);

      if (dashRes.data?.success) {
        setStats({
          totalStudents:     dashRes.data.data?.totalStudents     || 0,
          totalEmployers:    dashRes.data.data?.totalEmployers    || 0,
          activeInternships: dashRes.data.data?.activeInternships || 0,
          totalApplications: dashRes.data.data?.totalApplications || 0,
        });
      }

      if (reportsRes.data?.success) {
        setReports(reportsRes.data.data);
      }

      const combined: RecentUser[] = [
        ...(recentStudentsRes.data?.data || []),
        ...(recentEmployersRes.data?.data || []),
      ]
        .sort((a: RecentUser, b: RecentUser) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
      setRecentUsers(combined);

      const verificationRequests = (Array.isArray(pendingRes.data) ? pendingRes.data : [])
        .map((i: VerificationUser) => ({ ...i, reviewType: 'verification' as const }));
      const pendingEmployers = (employersRes.data?.data || [])
        .map((i: VerificationUser) => ({ ...i, reviewType: 'account' as const }));
      const pendingStudents  = (studentsRes.data?.data  || [])
        .map((i: VerificationUser) => ({ ...i, reviewType: 'account' as const }));

      const merged = new Map<string, VerificationUser>();
      [...pendingEmployers, ...pendingStudents, ...verificationRequests].forEach(i => merged.set(i._id, i));

      setPending(Array.from(merged.values()).sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
    else setLoading(false);
  }, [user?.role]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const approveUser = async (item: VerificationUser) => {
    try {
      setActionLoadingId(item._id);
      if (item.reviewType === 'account') {
        const ep = item.role === 'employer'
          ? `/admin/employers/${item._id}/status`
          : `/admin/students/${item._id}/status`;
        await apiClient.patch(ep, { status: 'approved' });
      } else {
        await apiClient.put(`/verification/${item._id}/approve`);
      }
      setPending(prev => prev.filter(u => u._id !== item._id));
      Alert.alert('Approved ✓', `${item.name} is now verified.`);
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not approve');
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectUser = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoadingId(rejectTarget._id);
      if (rejectTarget.reviewType === 'account') {
        const ep = rejectTarget.role === 'employer'
          ? `/admin/employers/${rejectTarget._id}/status`
          : `/admin/students/${rejectTarget._id}/status`;
        await apiClient.patch(ep, { status: 'suspended' });
      } else {
        await apiClient.put(`/verification/${rejectTarget._id}/reject`, {
          reason: rejectReason.trim() || 'Your documentation did not meet our verification standards.',
        });
      }
      setPending(prev => prev.filter(u => u._id !== rejectTarget._id));
      setRejectTarget(null);
      setRejectReason('');
      Alert.alert('Rejected', `${rejectTarget.name}'s request has been rejected.`);
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDocument = async (path?: string) => {
    const url = getUploadUrl(path);
    if (!url) { Alert.alert('No Document', 'No uploaded document for this request.'); return; }
    await Linking.openURL(url);
  };

  if (user?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center px-8 bg-white">
        <View className="w-20 h-20 bg-indigo-50 rounded-3xl items-center justify-center mb-6">
          <ShieldCheck size={36} color="#6366F1" />
        </View>
        <Text className="text-gray-900 font-black text-xl text-center">Admin Access Only</Text>
        <Text className="text-gray-400 text-center mt-2 leading-6">Sign in with an admin account to access this console.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mt-4">Loading Console</Text>
      </View>
    );
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ backgroundColor: '#1E1B4B' }} className="px-6 pt-6 pb-8">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="w-9 h-9 bg-indigo-500 rounded-xl items-center justify-center mr-3">
                <ShieldCheck size={18} color="white" />
              </View>
              <View>
                <Text style={{ color: '#A5B4FC' }} className="text-[10px] font-black uppercase tracking-widest">Admin Console</Text>
                <Text className="text-white font-black text-base">{user?.name || 'Administrator'}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text className="text-white text-base">↺</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#C7D2FE' }} className="text-xs font-medium mb-1">{today}</Text>
          <Text className="text-white font-black text-2xl leading-tight">Dashboard Overview</Text>

          {/* Stats row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-5 -mx-1">
            {STATS_CONFIG.map(s => {
              const Icon = s.icon;
              return (
                <View
                  key={s.key}
                  className="mx-1.5 px-4 py-4 rounded-2xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', minWidth: 110 }}
                >
                  <View className="w-8 h-8 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                    <Icon size={15} color={s.color} />
                  </View>
                  <Text className="text-white font-black text-2xl">{stats[s.key]}</Text>
                  <Text style={{ color: '#A5B4FC' }} className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{s.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-5">

          {/* ── Analytics Section ── */}
          <View className="mt-5 mb-1 flex-row items-center">
            <View className="w-7 h-7 bg-indigo-50 rounded-lg items-center justify-center mr-2">
              <TrendingUp size={14} color="#6366F1" />
            </View>
            <Text className="text-gray-900 font-black text-base tracking-tight">Analytics</Text>
          </View>

          {/* Application Trend */}
          <View className="mt-3 bg-white rounded-3xl border border-gray-100 p-5 overflow-hidden">
            <Text className="text-gray-900 font-black text-sm mb-0.5">Application Trend</Text>
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Last 7 Days</Text>
            <TrendChart data={reports?.applicationsTrend || []} />
          </View>

          {/* Match Distribution + Skills row */}
          <View className="flex-row gap-3 mt-3">
            {/* Donut – Match Quality */}
            <View className="flex-1 bg-white rounded-3xl border border-gray-100 p-4">
              <Text className="text-gray-900 font-black text-xs mb-0.5">Match Quality</Text>
              <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-3">Distribution</Text>
              <View className="items-center">
                <DonutChart data={reports?.matchDistribution || []} size={110} />
              </View>
              {/* Legend */}
              <View className="mt-3">
                {(reports?.matchDistribution || []).slice(0, 4).map((d, i) => {
                  const color = MATCH_COLORS[d._id] || CHART_COLORS[i % CHART_COLORS.length];
                  const total = (reports?.matchDistribution || []).reduce((s, x) => s + x.count, 0) || 1;
                  return (
                    <View key={i} className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center">
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 5 }} />
                        <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '700' }}>{d._id}</Text>
                      </View>
                      <Text style={{ color: '#9CA3AF', fontSize: 9, fontWeight: '700' }}>
                        {Math.round((d.count / total) * 100)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Skills in Demand */}
            <View className="flex-1 bg-white rounded-3xl border border-gray-100 p-4">
              <Text className="text-gray-900 font-black text-xs mb-0.5">Top Skills</Text>
              <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-3">In Demand</Text>
              {reports?.skillsDemand && reports.skillsDemand.length > 0 ? (
                <SkillBars data={reports.skillsDemand} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <Text style={{ color: '#D1D5DB', fontSize: 11 }}>No data yet</Text>
                </View>
              )}
            </View>
          </View>

          {/* Placements by Domain */}
          {reports?.placements && reports.placements.length > 0 && (
            <View className="mt-3 bg-white rounded-3xl border border-gray-100 p-5 overflow-hidden">
              <Text className="text-gray-900 font-black text-sm mb-0.5">Placements by Domain</Text>
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Accepted Applications</Text>
              <PlacementsChart data={reports.placements} />
            </View>
          )}

          {/* ── Recent Users ── */}
          <View className="mt-5 mb-1 flex-row items-center">
            <View className="w-7 h-7 bg-sky-50 rounded-lg items-center justify-center mr-2">
              <Users size={14} color="#0EA5E9" />
            </View>
            <Text className="text-gray-900 font-black text-base tracking-tight">Recent Users</Text>
          </View>

          <View className="mt-3 bg-white rounded-3xl border border-gray-100 overflow-hidden">
            {recentUsers.length === 0 ? (
              <View className="py-10 items-center justify-center">
                <Text className="text-gray-400 text-sm font-medium">No users yet</Text>
              </View>
            ) : (
              recentUsers.map((u, idx) => {
                const isEmployer = u.role === 'employer';
                const roleColor  = isEmployer ? '#0EA5E9' : '#8B5CF6';
                const roleBg     = isEmployer ? '#E0F2FE' : '#EDE9FE';
                const initials   = getInitials(u.name);
                const st         = STATUS_STYLE[u.status] || STATUS_STYLE['pending'];
                const subtitle   = isEmployer && u.companyName ? u.companyName : u.email;
                const isLast     = idx === recentUsers.length - 1;

                return (
                  <View
                    key={u._id}
                    className={`flex-row items-center px-5 py-4 ${!isLast ? 'border-b border-gray-50' : ''}`}
                  >
                    {/* Avatar */}
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                      style={{ backgroundColor: roleBg }}
                    >
                      <Text style={{ color: roleColor, fontSize: 13, fontWeight: '900' }}>{initials}</Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1 mr-2">
                      <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>{u.name}</Text>
                      <Text className="text-gray-400 text-xs font-medium mt-0.5" numberOfLines={1}>{subtitle}</Text>
                    </View>

                    {/* Badges + time */}
                    <View className="items-end gap-1">
                      <View className="flex-row gap-1.5">
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: roleBg }}>
                          <Text style={{ color: roleColor, fontSize: 9, fontWeight: '800' }}>
                            {u.role.toUpperCase()}
                          </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg }}>
                          <Text style={{ color: st.text, fontSize: 9, fontWeight: '800' }}>{st.label.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-[10px] font-medium">{timeAgo(u.createdAt)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Pending Banner ── */}
          <View className="mt-5 mb-4 bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <View className="flex-row items-center px-5 py-4">
              <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mr-4">
                <AlertTriangle size={22} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-black text-xl">{pending.length}</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pending Reviews</Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </View>
            <View className="flex-row border-t border-gray-50">
              <View className="flex-1 items-center py-3 border-r border-gray-50">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
                  <Text className="text-gray-900 font-black text-sm">{studentCount}</Text>
                </View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Students</Text>
              </View>
              <View className="flex-1 items-center py-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-sky-500 mr-1.5" />
                  <Text className="text-gray-900 font-black text-sm">{employerCount}</Text>
                </View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Employers</Text>
              </View>
            </View>
          </View>

          {/* ── Filter Pills ── */}
          <View className="flex-row gap-2 mb-5">
            {([
              { key: 'all',      label: `All  ${pending.length}` },
              { key: 'student',  label: `Students  ${studentCount}` },
              { key: 'employer', label: `Employers  ${employerCount}` },
            ] as const).map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={`px-4 py-2.5 rounded-2xl border ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-gray-500'}`}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Review Cards ── */}
          {filteredPending.length > 0 ? (
            filteredPending.map(item => {
              const isEmployer   = item.role === 'employer';
              const documentPath = isEmployer ? item.businessDocument : item.studentIdImage;
              const hasDoc       = !!documentPath;
              const busy         = actionLoadingId === item._id;
              const roleColor    = isEmployer ? '#0EA5E9' : '#8B5CF6';
              const roleBg       = isEmployer ? '#E0F2FE' : '#EDE9FE';

              return (
                <View key={item._id} className="bg-white rounded-3xl border border-gray-100 mb-4 overflow-hidden">
                  <View style={{ height: 4, backgroundColor: roleColor }} />
                  <View className="p-5">
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: roleBg }}>
                          {isEmployer
                            ? <Building2 size={20} color={roleColor} />
                            : <GraduationCap size={20} color={roleColor} />}
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-black text-base" numberOfLines={1}>{item.name}</Text>
                          <Text className="text-gray-400 text-xs font-medium mt-0.5" numberOfLines={1}>{item.email}</Text>
                        </View>
                      </View>
                      <View className="items-end gap-1.5">
                        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: roleBg }}>
                          <Text style={{ color: roleColor }} className="text-[10px] font-black uppercase tracking-widest">{item.role}</Text>
                        </View>
                        <View className={`px-2.5 py-1 rounded-full ${item.reviewType === 'verification' ? 'bg-amber-50' : 'bg-gray-100'}`}>
                          <Text className={`text-[10px] font-black uppercase tracking-widest ${item.reviewType === 'verification' ? 'text-amber-600' : 'text-gray-500'}`}>
                            {item.reviewType === 'verification' ? 'Docs' : 'Account'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-4">
                      {isEmployer ? (
                        <>
                          <DetailRow label="Company"   value={item.companyName                  || '—'} />
                          <DetailRow label="BR Number" value={item.businessRegistrationNumber   || '—'} />
                          <DetailRow label="Website"   value={item.website                      || '—'} last />
                        </>
                      ) : (
                        <DetailRow label="Student ID" value={item.studentId || '—'} last />
                      )}
                      <View className="pt-2 mt-1 border-t border-gray-100">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                          Submitted {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'recently'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-2">
                      <TouchableOpacity
                        onPress={() => openDocument(documentPath)}
                        disabled={!hasDoc}
                        className={`flex-row items-center justify-center px-4 py-3 rounded-2xl border ${hasDoc ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-100 opacity-40'}`}
                      >
                        <ExternalLink size={14} color="#374151" />
                        <Text className="text-gray-700 font-black text-[10px] uppercase tracking-widest ml-1.5">Doc</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => approveUser(item)}
                        disabled={busy}
                        className="flex-1 flex-row items-center justify-center py-3 rounded-2xl bg-emerald-500"
                      >
                        {busy
                          ? <ActivityIndicator size="small" color="white" />
                          : <>
                              <CheckCircle2 size={15} color="white" />
                              <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-1.5">Approve</Text>
                            </>}
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => setRejectTarget(item)}
                      disabled={busy}
                      className="flex-row items-center justify-center py-3 rounded-2xl border border-red-100 bg-red-50"
                    >
                      <XCircle size={15} color="#EF4444" />
                      <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest ml-1.5">Reject Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-16 bg-white rounded-3xl border border-dashed border-gray-200 items-center justify-center">
              <View className="w-16 h-16 bg-gray-50 rounded-3xl items-center justify-center mb-4">
                <Users size={28} color="#D1D5DB" />
              </View>
              <Text className="text-gray-900 font-black text-base">All clear!</Text>
              <Text className="text-gray-400 font-medium text-center mt-1 px-8 leading-5">
                No pending verification requests right now.
              </Text>
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* ── Reject Modal ── */}
      <Modal visible={!!rejectTarget} transparent animationType="slide" onRequestClose={() => setRejectTarget(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 bg-red-50 rounded-2xl items-center justify-center mr-3">
                <XCircle size={20} color="#EF4444" />
              </View>
              <View>
                <Text className="text-gray-900 font-black text-lg">Reject Request</Text>
                <Text className="text-gray-400 text-xs font-medium">{rejectTarget?.name}</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm leading-5 mt-3 mb-4">
              {rejectTarget?.reviewType === 'verification'
                ? 'This reason will be sent to the user. Make it clear and actionable.'
                : 'This will suspend the account. The user will be notified.'}
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection (optional)..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
              style={{ minHeight: 100 }}
            />
            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => { setRejectTarget(null); setRejectReason(''); }}
                className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="text-gray-700 font-black text-xs uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={rejectUser}
                className="flex-1 py-4 rounded-2xl bg-red-500 items-center"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-2 ${!last ? 'border-b border-gray-100' : ''}`}>
      <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</Text>
      <Text className="text-gray-800 text-xs font-bold flex-1 text-right ml-4" numberOfLines={1}>{value}</Text>
    </View>
  );
}
