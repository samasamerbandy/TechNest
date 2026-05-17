import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTicketById, assignTicket, getWorkers } from '../../services/ticketService';

const STATUS_COLORS = {
  pending:     { bg: '#FFF7ED', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  resolved:    { bg: '#F0FDF4', text: '#14532D', dot: '#22C55E' },
  closed:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const getId = (obj) => obj?._id || obj?.id;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStatus = (s) =>
  s?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';

export default function IssueAssignScreen({ route, navigation }) {
  const { issueId, preloadedWorkers = [] } = route.params;

  const hasFetched = useRef(false);
  const [issue,          setIssue]          = useState(null);
  const [workers,        setWorkers]        = useState(preloadedWorkers);
  const [loading,        setLoading]        = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [assigning,      setAssigning]      = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const loadWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    try {
      const res = await getWorkers();
      const list = res.data?.workers ?? res.data;
      setWorkers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('loadWorkers error:', err);
    } finally {
      setLoadingWorkers(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!issueId) {
      Alert.alert('Error', 'Invalid issue ID', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    if (!hasFetched.current) setLoading(true);
    try {
      const res = await getTicketById(issueId);
      setIssue(res.data?.ticket ?? res.data);
    } catch (err) {
      console.error('fetchData error:', err);
      Alert.alert('Error', 'Failed to load issue. Check your connection.');
    } finally {
      hasFetched.current = true;
      setLoading(false);
    }
    loadWorkers();
  }, [issueId, navigation, loadWorkers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation, fetchData]);

  const handleAssign = async () => {
    if (!selectedWorker) {
      Alert.alert('Select Worker', 'Please tap a worker below to select them.');
      return;
    }
    const currentWorker = issue?.assignedTo || issue?.worker;
    const msg = currentWorker
      ? `Reassign from ${currentWorker.name} to ${selectedWorker.name}?`
      : `Assign this issue to ${selectedWorker.name}?`;

    Alert.alert(
      currentWorker ? 'Reassign Worker' : 'Confirm Assignment',
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentWorker ? 'Reassign' : 'Assign',
          onPress: async () => {
            setAssigning(true);
            try {
              await assignTicket(issueId, getId(selectedWorker));
              Alert.alert('Success', `Issue assigned to ${selectedWorker.name}`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('handleAssign error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Assignment failed. Try again.');
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingLogoText}>CC</Text>
          </View>
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Loading issue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Issue not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[issue.status] ?? STATUS_COLORS.pending;
  const currentWorker = issue.assignedTo || issue.worker;
  const location = issue.building
    ? `${issue.building}${issue.floor ? `, Fl.${issue.floor}` : ''}${issue.roomNumber ? ` Rm ${issue.roomNumber}` : ''}`
    : issue.location || '—';

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>FACILITY MANAGER</Text>
          <Text style={styles.headerTitle}>Assign Issue</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[styles.statusPillText, { color: sc.text }]}>{formatStatus(issue.status)}</Text>
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Issue details */}
        <Text style={styles.sectionLabel}>ISSUE DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {issue.category ? issue.category.charAt(0).toUpperCase() + issue.category.slice(1) : 'General'}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(issue.createdAt)}</Text>
          </View>
          {issue.title ? (
            <>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <Text style={styles.fieldValue}>{issue.title}</Text>
              <View style={styles.divider} />
            </>
          ) : null}
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <Text style={styles.fieldValue}>{issue.description || '—'}</Text>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <Text style={styles.fieldValue}>{location}</Text>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>SUBMITTED BY</Text>
          <Text style={styles.fieldValue}>{issue.submittedBy?.name ?? issue.user?.name ?? '—'}</Text>
        </View>

        {/* Current assignment */}
        <Text style={styles.sectionLabel}>CURRENT ASSIGNMENT</Text>
        <View style={[styles.card, styles.assignmentCard, { borderLeftColor: currentWorker ? '#22C55E' : '#F59E0B' }]}>
          {currentWorker ? (
            <View style={styles.workerInfoRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{currentWorker.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{currentWorker.name}</Text>
                <Text style={styles.workerEmail}>{currentWorker.email}</Text>
              </View>
              <View style={styles.assignedBadge}>
                <Text style={styles.assignedBadgeText}>Assigned</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.unassignedText}>No worker assigned yet</Text>
          )}
        </View>

        {/* Worker list - inline, no modal */}
        <View style={styles.workersSectionHeader}>
          <Text style={styles.sectionLabel}>SELECT A WORKER</Text>
          <TouchableOpacity onPress={loadWorkers} disabled={loadingWorkers} style={styles.refreshBtn}>
            {loadingWorkers
              ? <ActivityIndicator size="small" color="#1E3A8A" />
              : <Ionicons name="refresh-outline" size={16} color="#1E3A8A" />
            }
          </TouchableOpacity>
        </View>

        {loadingWorkers ? (
          <View style={styles.workersLoading}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.workersLoadingText}>Loading workers...</Text>
          </View>
        ) : workers.length === 0 ? (
          <View style={styles.workersEmpty}>
            <Ionicons name="people-outline" size={36} color="#CBD5E1" />
            <Text style={styles.workersEmptyText}>No workers found</Text>
            <TouchableOpacity style={styles.reloadBtn} onPress={loadWorkers}>
              <Text style={styles.reloadBtnText}>Tap to reload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workersList}>
            {workers.map((item) => {
              const isSelected = getId(selectedWorker) === getId(item);
              const isCurrent  = getId(currentWorker) === getId(item);
              return (
                <TouchableOpacity
                  key={String(getId(item))}
                  style={[styles.workerCard, isSelected && styles.workerCardSelected]}
                  onPress={() => setSelectedWorker(isSelected ? null : item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.workerCardName, isSelected && styles.workerCardNameSelected]}>
                      {item.name}{isCurrent ? '  (current)' : ''}
                    </Text>
                    <Text style={styles.workerCardEmail}>{item.email}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#1E3A8A" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Assign button */}
        <TouchableOpacity
          style={[styles.assignBtn, (!selectedWorker || assigning) && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={!selectedWorker || assigning}
          activeOpacity={0.88}
        >
          {assigning
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.assignBtnText}>
                {selectedWorker
                  ? `${currentWorker ? 'Reassign' : 'Assign'} to ${selectedWorker.name}`
                  : currentWorker ? 'Reassign Worker' : 'Assign Worker'
                }
              </Text>
          }
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1E3A8A' },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingLogo:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  loadingLogoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  loadingText:     { marginTop: 12, color: '#94A3B8', fontSize: 14 },
  errorText:       { fontSize: 16, color: '#94A3B8', fontWeight: '500', marginBottom: 16 },
  retryBtn:        { backgroundColor: '#1E3A8A', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerSub:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 2 },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  sheet:  { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scroll: { padding: 24, paddingTop: 28 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 24,
    shadowColor: '#1E3A8A', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  assignmentCard: { borderLeftWidth: 4 },
  badgeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  categoryText:  { color: '#1E3A8A', fontWeight: '700', fontSize: 12 },
  dateText:      { fontSize: 12, color: '#94A3B8' },
  fieldLabel:    { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 5 },
  fieldValue:    { fontSize: 15, color: '#0F172A', fontWeight: '500', lineHeight: 22 },
  divider:       { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  workerInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:     { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  avatarCircleSelected: { backgroundColor: '#1E3A8A' },
  avatarText:       { color: '#fff', fontWeight: '700', fontSize: 17 },
  workerName:       { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  workerEmail:      { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  assignedBadge:    { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BBF7D0' },
  assignedBadgeText:{ fontSize: 11, fontWeight: '700', color: '#14532D' },
  unassignedText:   { fontSize: 14, color: '#92400E', fontWeight: '500' },

  workersSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  refreshBtn: { padding: 4 },

  workersLoading:     { alignItems: 'center', paddingVertical: 32, gap: 12 },
  workersLoadingText: { color: '#94A3B8', fontSize: 14 },

  workersEmpty:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
  workersEmptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '500' },
  reloadBtn:        { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1.5, borderColor: '#BFDBFE' },
  reloadBtnText:    { color: '#1E3A8A', fontWeight: '700', fontSize: 13 },

  workersList: { gap: 10, marginBottom: 24 },
  workerCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  workerCardSelected: { backgroundColor: '#EFF6FF', borderColor: '#1E3A8A' },
  workerCardName:         { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  workerCardNameSelected: { color: '#1E3A8A' },
  workerCardEmail:        { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  assignBtn:         { backgroundColor: '#1E3A8A', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  assignBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  assignBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});