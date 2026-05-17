import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, TextInput,
  ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllTickets, getWorkers } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending:     { bg: '#FFF7ED', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  resolved:    { bg: '#F0FDF4', text: '#14532D', dot: '#22C55E' },
  closed:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const STATUSES    = ['All', 'pending', 'in_progress', 'resolved', 'closed'];
const CATEGORIES  = ['All', 'electrical', 'plumbing', 'cleaning', 'furniture', 'other'];

const formatStatus = (s) =>
  s?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getItemId = (item) => item._id || item.id;

export default function AllIssuesScreen({ navigation }) {
  const { logout, user } = useAuth();

  const hasFetched = useRef(false);
  const [issues,      setIssues]      = useState([]);
  const [workers,     setWorkers]     = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeStatus,   setActiveStatus]   = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total      = issues.length;
  const pending    = issues.filter(i => i.status === 'pending').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const resolved   = issues.filter(i => ['resolved', 'closed'].includes(i.status)).length;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!hasFetched.current) setLoading(true);

      const [ticketsResult, workersResult] = await Promise.allSettled([
        getAllTickets(),
        getWorkers(),
      ]);

      if (ticketsResult.status === 'fulfilled') {
        const tickets = ticketsResult.value.data?.tickets ?? [];
        setIssues(Array.isArray(tickets) ? tickets : []);
      } else {
        console.error('getAllTickets error:', ticketsResult.reason);
        Alert.alert('Error', 'Failed to load issues. Check your connection.');
      }

      if (workersResult.status === 'fulfilled') {
        const list = workersResult.value.data?.workers ?? workersResult.value.data;
        setWorkers(Array.isArray(list) ? list : []);
      } else {
        console.error('getWorkers error:', workersResult.reason);
      }
    } finally {
      hasFetched.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // Re-fetch on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchIssues());
    return unsubscribe;
  }, [navigation, fetchIssues]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...issues];

    if (activeStatus !== 'All')
      result = result.filter(i => i.status === activeStatus);

    if (activeCategory !== 'All')
      result = result.filter(i => i.category?.toLowerCase() === activeCategory.toLowerCase());

    if (search.trim())
      result = result.filter(i =>
        i.description?.toLowerCase().includes(search.toLowerCase()) ||
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.category?.toLowerCase().includes(search.toLowerCase()) ||
        i.building?.toLowerCase().includes(search.toLowerCase())
      );

    setFiltered(result);
  }, [issues, activeStatus, activeCategory, search]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  // ── Card ──────────────────────────────────────────────────────────────────
  const renderIssue = ({ item }) => {
    const sc      = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const issueId = getItemId(item);
    const location = item.building
      ? `${item.building}${item.floor ? `, Fl.${item.floor}` : ''}`
      : item.location || '—';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('IssueManage', { issueId, preloadedWorkers: workers })}
      >
        {/* Top row */}
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

        {/* Title */}
        {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="location-outline" size={12} color="#94A3B8" />
            <Text style={styles.footerText}>{location}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
            <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Worker assigned */}
        {item.worker ? (
          <View style={styles.workerBanner}>
            <Ionicons name="person-outline" size={12} color="#1E3A8A" />
            <Text style={styles.workerText}>
              Assigned to {item.worker.name ?? item.worker}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.btnManage}
            onPress={() => navigation.navigate('IssueManage', { issueId, preloadedWorkers: workers })}
          >
            <Ionicons name="settings-outline" size={14} color="#1E3A8A" />
            <Text style={styles.btnManageText}>Manage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnAssign}
            onPress={() => navigation.navigate('IssueAssign', { issueId, preloadedWorkers: workers })}
          >
            <Ionicons name="person-add-outline" size={14} color="#fff" />
            <Text style={styles.btnAssignText}>Assign</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading issues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>FACILITY MANAGER</Text>
          <Text style={styles.headerTitle}>All Issues</Text>
          {user?.name ? <Text style={styles.headerWelcome}>👋 {user.name}</Text> : null}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="power-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* White body */}
      <View style={styles.body}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total',       num: total,      border: '#E2E8F0', color: '#1E3A8A' },
            { label: 'Pending',     num: pending,    border: '#FED7AA', color: '#F59E0B' },
            { label: 'In Progress', num: inProgress, border: '#BFDBFE', color: '#3B82F6' },
            { label: 'Resolved',    num: resolved,   border: '#BBF7D0', color: '#22C55E' },
          ].map(({ label, num, border, color }) => (
            <View key={label} style={[styles.statCard, { borderColor: border }]}>
              <Text style={[styles.statNum, { color }]}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues..."
            placeholderTextColor="#CBD5E1"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, activeStatus === s && styles.chipActive]}
                onPress={() => setActiveStatus(s)}
              >
                <Text style={[styles.chipText, activeStatus === s && styles.chipTextActive]}>
                  {s === 'All' ? 'All' : formatStatus(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Category filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, activeCategory === c && styles.chipActive]}
                onPress={() => setActiveCategory(c)}
              >
                <Text style={[styles.chipText, activeCategory === c && styles.chipTextActive]}>
                  {c === 'All' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Results count */}
        <Text style={styles.resultCount}>{filtered.length} issue{filtered.length !== 1 ? 's' : ''} found</Text>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => String(getItemId(item))}
          renderItem={renderIssue}
          extraData={workers}
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
              <Ionicons name="clipboard-outline" size={48} color="#BFDBFE" />
              <Text style={styles.emptyTitle}>No Issues Found</Text>
              <Text style={styles.emptySub}>Try changing filters or pull to refresh</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchIssues()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1E3A8A' },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },

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
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard:  { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  statNum:   { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '600', marginTop: 2 },

  // Search
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 20, marginBottom: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },

  // Chips
  chipScroll: { paddingLeft: 20, marginBottom: 8 },
  chipRow:    { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip:           { backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive:     { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  chipText:       { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  resultCount: { fontSize: 12, color: '#94A3B8', paddingHorizontal: 20, marginBottom: 8 },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  categoryText:  { color: '#1E3A8A', fontWeight: '700', fontSize: 12 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusText:    { fontSize: 12, fontWeight: '600' },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  cardDesc:      { fontSize: 13, color: '#334155', lineHeight: 18, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#64748B' },

  workerBanner: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#BBF7D0', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  workerText:   { fontSize: 12, color: '#14532D', fontWeight: '600' },

  cardActions:   { flexDirection: 'row', gap: 10 },
  btnManage:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#1E3A8A' },
  btnManageText: { color: '#1E3A8A', fontWeight: '700', fontSize: 13 },
  btnAssign:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1E3A8A' },
  btnAssignText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  retryBtn:   { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:  { color: '#1E3A8A', fontWeight: '700' },
});