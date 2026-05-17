import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTicketById } from '../../services/ticketService';
import { API_BASE } from '../../config';

const toImageUrl = (path) => path ? `${API_BASE.replace('/api', '')}${path}` : null;

// ─── Status config ────────────────────────────────────────────────────────────
// CORRECT — matches backend
const STATUS_COLORS = {
  pending:     { bg: '#FFF7ED', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  resolved:    { bg: '#F0FDF4', text: '#14532D', dot: '#22C55E' },
  closed:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const STATUS_STEPS = ['pending', 'in_progress', 'resolved', 'closed'];

const formatStatus = (status) =>
  status?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';

const getStatusConfig = (status) => {
  const key = status?.toLowerCase();
  return STATUS_COLORS[key] ?? { bg: '#F1F5F9', text: '#334155', label: formatStatus(status) };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function IssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const hasFetched = useRef(false);
  const [issue, setIssue]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch every time this screen gains focus (e.g., back-navigation)
  useFocusEffect(
    useCallback(() => {
      fetchIssueDetails();
    }, [issueId])
  );

  const fetchIssueDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!hasFetched.current) setLoading(true);

      const res = await getTicketById(issueId);
      setIssue(res.data);
    } catch (err) {
      console.error('fetchIssueDetails error:', err);
      Alert.alert('Error', 'Failed to load issue details. Please try again.');
    } finally {
      hasFetched.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  const statusCfg = getStatusConfig(issue?.status);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchIssueDetails(true)}
            tintColor="#1E3A8A"
          />
        }
      >
        <View style={styles.sheet}>
          {/* Category + Status */}
          <View style={styles.topRow}>
            <Text style={styles.category}>{issue?.category?.toUpperCase() ?? 'ISSUE'}</Text>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
            </View>
          </View>

          {/* Title / description as heading */}
          <Text style={styles.title}>
            {issue?.description?.slice(0, 60) ?? 'Issue Details'}
          </Text>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.label}>DESCRIPTION</Text>
          <Text style={styles.bodyText}>{issue?.description ?? '—'}</Text>

          {/* Location */}
          <Text style={styles.label}>LOCATION</Text>
          <Text style={styles.bodyText}>{issue?.location ?? '—'}</Text>

          {/* Submitted photo */}
          {issue?.imageUrl ? (
            <>
              <Text style={styles.label}>SUBMITTED PHOTO</Text>
              <Image
                source={{ uri: toImageUrl(issue.imageUrl) }}
                style={styles.image}
                resizeMode="cover"
              />
            </>
          ) : null}

          {/* Completion / fix photo from worker */}
          {issue?.evidenceUrl ? (
            <>
              <Text style={styles.label}>COMPLETION PHOTO</Text>
              <Image
                source={{ uri: toImageUrl(issue.evidenceUrl) }}
                style={styles.image}
                resizeMode="cover"
              />
            </>
          ) : null}

          {/* Comments / worker updates */}
          <Text style={styles.label}>UPDATES / COMMENTS</Text>
          {issue?.comments?.length > 0 ? (
            issue.comments.map((c, i) => (
              <View key={String(c._id ?? c.id ?? i)} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Ionicons name="person-circle-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.commentAuthor}>
                    {c.author?.name ?? c.addedBy ?? 'Staff'}
                  </Text>
                  {c.createdAt ? (
                    <Text style={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.commentText}>
                  {c.content}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyComments}>No updates yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E3A8A' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E3A8A',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Sheet
  scroll: { flexGrow: 1, paddingTop: 12 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    flex: 1,
    minHeight: '100%',
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: { fontSize: 12, fontWeight: '800', color: '#1E3A8A', letterSpacing: 1 },

  // Status badge
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // Title
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 4 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },

  // Labels + body
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 4,
  },
  bodyText: { fontSize: 16, color: '#334155', lineHeight: 22 },

  // Images
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: '#F1F5F9',
  },

  // Comments
  commentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#1E3A8A', flex: 1 },
  commentDate:   { fontSize: 11, color: '#94A3B8' },
  commentText:   { fontSize: 14, color: '#334155', lineHeight: 20 },

  emptyComments: { fontSize: 14, color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
});