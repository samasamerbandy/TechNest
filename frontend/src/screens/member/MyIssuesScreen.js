import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyTickets } from '../../services/ticketService';
import { API_BASE } from '../../config';

const STATUS_COLORS = {
  pending:     { bg: '#FFF7ED', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  resolved:    { bg: '#F0FDF4', text: '#14532D', dot: '#22C55E' },
  closed:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const STATUS_STEPS = ['pending', 'in_progress', 'resolved', 'closed'];




const formatStatus = (s) =>
  s?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function MyIssuesScreen({ navigation }) {
  const { logout, user } = useAuth();

  const hasFetched = useRef(false);
  const [issues,    setIssues]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!hasFetched.current) setLoading(true);

      const res = await getMyTickets();
      const tickets = res.data?.tickets ?? [];
      setIssues(Array.isArray(tickets) ? tickets : []);
    } catch (err) {
      console.error('fetchIssues error:', err);
      Alert.alert('Error', 'Failed to load your issues. Check your connection.');
    } finally {
      hasFetched.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time screen gains focus
  useFocusEffect(
    useCallback(() => { fetchIssues(); }, [fetchIssues])
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  // ── Progress bar ──────────────────────────────────────────────────────────
  const renderProgressBar = (status) => {
    const current = STATUS_STEPS.indexOf(status?.toLowerCase());
    return (
      <View style={styles.progressRow}>
        {STATUS_STEPS.map((step, i) => {
          const done   = i <= current;
          const active = i === current;
          const sc     = STATUS_COLORS[step];
          return (
            <React.Fragment key={step}>
              <View style={styles.stepCol}>
                <View style={[
                  styles.stepCircle,
                  done   && { backgroundColor: sc.dot, borderColor: sc.dot },
                  active && styles.stepCircleActive,
                ]}>
                  {done && <View style={styles.stepInner} />}
                </View>
                <Text style={[styles.stepLabel, done && { color: sc.dot }]}>
                  {step.replace('_', '\n')}
                </Text>
              </View>
              {i < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, i < current && { backgroundColor: '#1E3A8A' }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // ── Card ──────────────────────────────────────────────────────────────────
  const renderIssue = ({ item }) => {
    const statusKey = item.status?.toUpperCase();
    const sc        = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending;
    const location  = item.building
      ? `${item.building}${item.floor ? `, Fl. ${item.floor}` : ''}${item.roomNumber ? ` Rm ${item.roomNumber}` : ''}`
      : item.location || '—';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('IssueDetail', { issueId: item._id ?? item.id })}
      >
        {/* Top Row */}
        <View style={styles.cardTop}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>

        {/* Progress */}
        {renderProgressBar(item.status)}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.footerText}>{location}</Text>
          </View>
          <View style={styles.footerRight}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Worker assigned */}
        {item.worker && (
          <View style={styles.workerBanner}>
            <Ionicons name="construct-outline" size={13} color="#14532D" />
            <Text style={styles.workerBannerText}>
              Assigned to {item.worker.name ?? item.worker}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total      = issues.length;
  const pending    = issues.filter(i => i.status === 'pending').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const resolved   = issues.filter(i => ['resolved', 'closed'].includes(i.status?.toUpperCase())).length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>CC</Text>
        </View>
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Loading your issues...</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>COMMUNITY MEMBER</Text>
          <Text style={styles.headerTitle}>My Issues</Text>
          {user?.name ? <Text style={styles.headerWelcome}>👋 {user.name}</Text> : null}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="power-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* White body */}
      <View style={styles.body}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total',       num: total,      border: '#E2E8F0', color: '#1E3A8A' },
            { label: 'pending',     num: pending,    border: '#FED7AA', color: '#F59E0B' },
            { label: 'In Progress', num: inProgress, border: '#BFDBFE', color: '#3B82F6' },
            { label: 'resolved',    num: resolved,   border: '#BBF7D0', color: '#22C55E' },
          ].map(({ label, num, border, color }) => (
            <View key={label} style={[styles.statCard, { borderColor: border }]}>
              <Text style={[styles.statNum, { color }]}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Submit new issue */}
        <TouchableOpacity
          style={styles.newIssueBtn}
          onPress={() => navigation.navigate('Report Issue')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.newIssueText}>Submit New Issue</Text>
        </TouchableOpacity>

        {/* List */}
        <FlatList
          data={issues}
          keyExtractor={item => String(item._id ?? item.id)}
          renderItem={renderIssue}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchIssues(true)}
              colors={['#1E3A8A']}
              tintColor="#1E3A8A"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyCircle}>
                <Ionicons name="clipboard-outline" size={32} color="#93C5FD" />
              </View>
              <Text style={styles.emptyTitle}>No Issues Yet</Text>
              <Text style={styles.emptySubText}>Tap the button above to report an issue</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E3A8A' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  loadingLogo:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  loadingLogoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  loadingText:     { marginTop: 12, color: '#94A3B8', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
  },
  headerSub:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 4 },
  headerTitle:   { fontSize: 26, fontWeight: '700', color: '#fff' },
  headerWelcome: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Body
  body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statCard:  { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  statNum:   { fontSize: 20, fontWeight: '800', color: '#1E3A8A' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },

  // New issue button
  newIssueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E3A8A', borderRadius: 14, marginHorizontal: 20,
    paddingVertical: 14, marginBottom: 16, gap: 8,
    shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  newIssueText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  categoryText:  { color: '#1E3A8A', fontWeight: '700', fontSize: 12 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusText:    { fontSize: 12, fontWeight: '600' },
  cardDesc:      { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 14 },

  // Progress
  progressRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepCol:          { alignItems: 'center', width: 52 },
  stepCircle:       { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderWidth: 3 },
  stepInner:        { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  stepLabel:        { fontSize: 9, color: '#CBD5E1', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  stepLine:         { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 14 },

  // Footer
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between' },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText:  { fontSize: 12, color: '#64748B' },

  workerBanner:     { marginTop: 10, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#BBF7D0', flexDirection: 'row', alignItems: 'center', gap: 6 },
  workerBannerText: { fontSize: 12, color: '#14532D', fontWeight: '600' },

  // Empty
  empty:           { alignItems: 'center', paddingTop: 50 },
  emptyCircle:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySubText:    { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});