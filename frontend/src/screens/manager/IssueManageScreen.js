import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, Image, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
import {
  getTicketById,
  getWorkers,
  updateTicketStatus,
  assignTicket,
  closeTicket,
  deleteTicket,
} from '../../services/ticketService';

const toImageUrl = (path) => path ? `${API_BASE.replace('/api', '')}${path}` : null;

const getId = (obj) => obj?._id || obj?.id;

const STATUS_COLORS = {
  pending:     { bg: '#FFF7ED', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  resolved:    { bg: '#F0FDF4', text: '#14532D', dot: '#22C55E' },
  closed:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const STATUS_FLOW = ['pending', 'in_progress', 'resolved', 'closed'];

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

export default function IssueManageScreen({ route, navigation }) {
  const { issueId, preloadedWorkers = [] } = route.params;

  const hasFetched = useRef(false);
  const [issue,              setIssue]              = useState(null);
  const [workers,            setWorkers]            = useState(preloadedWorkers);
  const [loading,            setLoading]            = useState(true);
  const [loadingWorkers,     setLoadingWorkers]     = useState(false);
  const [updatingStatus,     setUpdatingStatus]     = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [assigning,          setAssigning]          = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [imageModalVisible,  setImageModalVisible]  = useState(false);
  const [selectedWorker,     setSelectedWorker]     = useState(null);
  const [activeImage,        setActiveImage]        = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!issueId) {
      Alert.alert('Error', 'Invalid issue ID', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    if (!hasFetched.current) setLoading(true);
    try {
      const [issueResult, workersResult] = await Promise.allSettled([
        getTicketById(issueId),
        getWorkers(),
      ]);

      if (issueResult.status === 'fulfilled') {
        setIssue(issueResult.value.data?.ticket ?? issueResult.value.data);
      } else {
        console.error('getTicketById error:', issueResult.reason);
        Alert.alert('Error', 'Failed to load issue. Check your connection.');
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
    }
  }, [issueId, navigation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation, fetchData]);

  const reloadWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res = await getWorkers();
      const list = res.data?.workers ?? res.data;
      setWorkers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('reloadWorkers error:', err);
      Alert.alert('Error', 'Could not load workers. Check your connection.');
    } finally {
      setLoadingWorkers(false);
    }
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === issue.status) { setStatusModalVisible(false); return; }
    if (issue.status === 'closed') {
      Alert.alert('Issue Closed', 'This issue has been closed and cannot be reopened.');
      setStatusModalVisible(false);
      return;
    }
    setStatusModalVisible(false);
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(issueId, newStatus);
      setIssue(prev => ({ ...prev, status: newStatus }));
      Alert.alert('Updated', `Status changed to ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      console.error('handleStatusUpdate error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Close issue ───────────────────────────────────────────────────────────
  const handleCloseIssue = () => {
    if (issue.status === 'closed') {
      Alert.alert('Already Closed', 'This issue is already closed.');
      return;
    }
    Alert.alert(
      'Close Issue',
      'Mark this issue as CLOSED? This action indicates the issue is fully resolved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Issue', style: 'destructive',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              await closeTicket(issueId);
              setIssue(prev => ({ ...prev, status: 'closed' }));
              Alert.alert('Closed', 'Issue has been closed.');
            } catch (err) {
              console.error('handleCloseIssue error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to close issue.');
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  // ── Assign worker ─────────────────────────────────────────────────────────
  const currentWorker = issue?.assignedTo || issue?.worker;

  const handleAssignWorker = async () => {
    if (!selectedWorker) return;
    const isReassign = !!currentWorker;
    Alert.alert(
      isReassign ? 'Reassign Worker' : 'Assign Worker',
      `${isReassign ? 'Reassign' : 'Assign'} this issue to ${selectedWorker.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isReassign ? 'Reassign' : 'Assign',
          onPress: async () => {
            setAssigning(true);
            setAssignModalVisible(false);
            try {
              await assignTicket(issueId, getId(selectedWorker));
              setIssue(prev => ({ ...prev, assignedTo: selectedWorker, worker: selectedWorker }));
              setSelectedWorker(null);
              Alert.alert('Success', `Issue assigned to ${selectedWorker.name}`);
            } catch (err) {
              console.error('handleAssignWorker error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Assignment failed.');
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to permanently delete this issue? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteTicket(issueId);
              Alert.alert('Deleted', 'Issue has been deleted.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('handleDelete error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete issue.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
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

  const sc       = STATUS_COLORS[issue.status] ?? STATUS_COLORS.pending;
  const isClosed = issue.status === 'closed';
  const location = issue.building
    ? `${issue.building}${issue.floor ? `, Fl.${issue.floor}` : ''}${issue.roomNumber ? ` Rm ${issue.roomNumber}` : ''}`
    : issue.location || '—';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>FACILITY MANAGER</Text>
          <Text style={styles.headerTitle}>Manage Issue</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
          {deleting
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Ionicons name="trash-outline" size={18} color="#EF4444" />
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: sc.dot + '40' }]}>
          <View style={[styles.statusBannerDot, { backgroundColor: sc.dot }]} />
          <Text style={[styles.statusBannerText, { color: sc.text }]}>
            {STATUS_LABELS[issue.status] || issue.status}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.statusBannerDate, { color: sc.text }]}>
            Since {formatDate(issue.updatedAt || issue.createdAt)}
          </Text>
        </View>

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

          <View style={styles.twoCol}>
            <View style={styles.colItem}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <Text style={styles.fieldValue}>{location}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.fieldLabel}>SUBMITTED BY</Text>
              <Text style={styles.fieldValue}>
                {issue.submittedBy?.name ?? issue.user?.name ?? '—'}
              </Text>
            </View>
          </View>

          {issue.imageUrl ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>SUBMISSION PHOTO</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => { setActiveImage(toImageUrl(issue.imageUrl)); setImageModalVisible(true); }}
              >
                <Image source={{ uri: toImageUrl(issue.imageUrl) }} style={styles.issueImage} resizeMode="cover" />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Tap to enlarge</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Assigned worker */}
        <Text style={styles.sectionLabel}>ASSIGNED WORKER</Text>
        <View style={[styles.card, styles.workerCard, { borderLeftColor: currentWorker ? '#22C55E' : '#F59E0B' }]}>
          {currentWorker ? (
            <View style={styles.workerInfoRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{currentWorker.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{currentWorker.name}</Text>
                <Text style={styles.workerEmail}>{currentWorker.email || '—'}</Text>
              </View>
              <View style={styles.assignedBadge}>
                <Text style={styles.assignedBadgeText}>✓ Assigned</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.unassignedText}>No worker assigned yet</Text>
          )}
        </View>

        {/* Worker comments */}
        {issue.comments?.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>WORKER UPDATES</Text>
            <View style={styles.card}>
              {issue.comments.map((comment, index) => (
                <View key={String(getId(comment) ?? index)}>
                  <View style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {comment.author?.name?.charAt(0)?.toUpperCase() ?? 'W'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.author?.name ?? 'Worker'}</Text>
                        <Text style={styles.commentTime}>
                          {formatDate(comment.createdAt)} {formatTime(comment.createdAt)}
                        </Text>
                      </View>
                      {/* ✅ backend field is "content" */}
                      <Text style={styles.commentText}>{comment.content ?? comment.text ?? '—'}</Text>
                    </View>
                  </View>
                  {index < issue.comments.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Completion photo */}
        {issue.evidenceUrl ? (
          <>
            <Text style={styles.sectionLabel}>COMPLETION PHOTO</Text>
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => { setActiveImage(toImageUrl(issue.evidenceUrl)); setImageModalVisible(true); }}
              >
                <Image source={{ uri: toImageUrl(issue.evidenceUrl) }} style={styles.issueImage} resizeMode="cover" />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Tap to enlarge</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Actions */}
        <Text style={styles.sectionLabel}>ACTIONS</Text>

        <TouchableOpacity
          style={[styles.actionBtn, styles.statusBtn, isClosed && styles.actionBtnDisabled]}
          onPress={() => !isClosed && setStatusModalVisible(true)}
          disabled={updatingStatus || isClosed}
          activeOpacity={0.85}
        >
          {updatingStatus
            ? <ActivityIndicator color="#1E3A8A" />
            : <>
                <Ionicons name="refresh-outline" size={18} color="#1E3A8A" />
                <Text style={styles.statusBtnText}>{isClosed ? 'Issue Closed' : 'Update Status'}</Text>
                {!isClosed && <Ionicons name="chevron-forward" size={18} color="#1E3A8A" style={{ marginLeft: 'auto' }} />}
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.assignBtn, isClosed && styles.actionBtnDisabled]}
          onPress={() => !isClosed && (setAssignModalVisible(true), reloadWorkers())}
          disabled={assigning || isClosed}
          activeOpacity={0.85}
        >
          {assigning
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.assignBtnText}>{currentWorker ? 'Reassign Worker' : 'Assign Worker'}</Text>
              </>
          }
        </TouchableOpacity>

        {!isClosed && issue.status === 'resolved' ? (
          <TouchableOpacity style={[styles.actionBtn, styles.closeBtn]} onPress={handleCloseIssue} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#14532D" />
            <Text style={styles.closeBtnText}>Close Issue</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Status modal */}
      <Modal visible={statusModalVisible} animationType="slide" transparent onRequestClose={() => setStatusModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSub}>Select the new status for this issue</Text>
            {STATUS_FLOW.map((status) => {
              const sColor    = STATUS_COLORS[status];
              const isCurrent = issue.status === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusRow, isCurrent && styles.statusRowActive]}
                  onPress={() => handleStatusUpdate(status)}
                >
                  <View style={[styles.statusRowDot, { backgroundColor: sColor.dot }]} />
                  <Text style={[styles.statusRowLabel, isCurrent && { color: '#1E3A8A' }]}>
                    {STATUS_LABELS[status]}
                  </Text>
                  {isCurrent ? <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assign modal */}
      <Modal visible={assignModalVisible} animationType="slide" transparent onRequestClose={() => setAssignModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAssignModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{currentWorker ? 'Reassign Worker' : 'Assign Worker'}</Text>
            <Text style={styles.modalSub}>Choose a worker for this issue</Text>
            {loadingWorkers ? (
              <View style={styles.emptyWorkers}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={styles.emptyText}>Loading workers...</Text>
              </View>
            ) : workers.length === 0 ? (
              <View style={styles.emptyWorkers}>
                <Text style={styles.emptyText}>No workers available</Text>
                <TouchableOpacity style={styles.retryWorkerBtn} onPress={reloadWorkers} disabled={loadingWorkers}>
                  {loadingWorkers
                    ? <ActivityIndicator size="small" color="#1E3A8A" />
                    : <Text style={styles.retryWorkerText}>Retry</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {workers.map((item, index) => {
                  const isSelected = getId(selectedWorker) === getId(item);
                  const isCurrent  = getId(currentWorker) === getId(item);
                  return (
                    <React.Fragment key={String(getId(item))}>
                      <TouchableOpacity
                        style={[styles.workerRow, isSelected && styles.workerRowActive]}
                        onPress={() => setSelectedWorker(item)}
                      >
                        <View style={styles.avatarCircleSmall}>
                          <Text style={styles.avatarTextSmall}>{item.name?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.workerRowName, isSelected && { color: '#1E3A8A' }]}>
                            {item.name}{isCurrent ? '  (current)' : ''}
                          </Text>
                          <Text style={styles.workerRowEmail}>{item.email}</Text>
                        </View>
                        {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" /> : null}
                      </TouchableOpacity>
                      {index < workers.length - 1 && <View style={styles.separator} />}
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            )}
            {selectedWorker ? (
              <TouchableOpacity style={styles.confirmAssignBtn} onPress={handleAssignWorker}>
                <Text style={styles.confirmAssignBtnText}>Confirm — {selectedWorker.name}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setAssignModalVisible(false); setSelectedWorker(null); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Image fullscreen modal */}
      <Modal visible={imageModalVisible} animationType="fade" transparent onRequestClose={() => setImageModalVisible(false)}>
        <TouchableOpacity style={styles.imageModalOverlay} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
          {activeImage ? <Image source={{ uri: activeImage }} style={styles.fullImage} resizeMode="contain" /> : null}
          <View style={styles.imageModalClose}>
            <Text style={styles.imageModalCloseText}>✕ Close</Text>
          </View>
        </TouchableOpacity>
      </Modal>

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
  deleteBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center', justifyContent: 'center' },

  sheet:  { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scroll: { padding: 24, paddingTop: 20 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },

  statusBanner:     { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20, gap: 10 },
  statusBannerDot:  { width: 10, height: 10, borderRadius: 5 },
  statusBannerText: { fontSize: 15, fontWeight: '700' },
  statusBannerDate: { fontSize: 12, fontWeight: '500' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 20,
    shadowColor: '#1E3A8A', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  workerCard: { borderLeftWidth: 4 },

  badgeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  categoryText:  { color: '#1E3A8A', fontWeight: '700', fontSize: 12 },
  dateText:      { fontSize: 12, color: '#94A3B8' },

  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 5 },
  fieldValue: { fontSize: 15, color: '#0F172A', fontWeight: '500', lineHeight: 22 },
  divider:    { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  twoCol:     { flexDirection: 'row', gap: 16 },
  colItem:    { flex: 1 },

  issueImage:       { width: '100%', height: 180, borderRadius: 10, marginTop: 8, backgroundColor: '#F8FAFC' },
  imageOverlay:     { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  imageOverlayText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  workerInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  avatarText:       { color: '#fff', fontWeight: '700', fontSize: 18 },
  workerName:       { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  workerEmail:      { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  assignedBadge:    { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BBF7D0' },
  assignedBadgeText:{ fontSize: 11, fontWeight: '700', color: '#14532D' },
  unassignedText:   { fontSize: 14, color: '#92400E', fontWeight: '500' },

  commentRow:        { flexDirection: 'row', gap: 12 },
  commentAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#1E3A8A', fontWeight: '700', fontSize: 13 },
  commentHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor:     { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  commentTime:       { fontSize: 11, color: '#94A3B8' },
  commentText:       { fontSize: 14, color: '#334155', lineHeight: 20 },

  actionBtn:         { flexDirection: 'row', alignItems: 'center', borderRadius: 14, height: 54, paddingHorizontal: 18, marginBottom: 12, gap: 10 },
  actionBtnDisabled: { opacity: 0.45 },
  statusBtn:         { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE' },
  statusBtnText:     { fontSize: 15, fontWeight: '700', color: '#1E3A8A', flex: 1 },
  assignBtn:         { backgroundColor: '#1E3A8A', shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  assignBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  closeBtn:          { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  closeBtnText:      { fontSize: 15, fontWeight: '700', color: '#14532D', flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '75%', paddingBottom: 32, paddingTop: 16 },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: '#0F172A', paddingHorizontal: 24, marginBottom: 4 },
  modalSub:     { fontSize: 13, color: '#94A3B8', paddingHorizontal: 24, marginBottom: 16 },

  statusRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 14 },
  statusRowActive: { backgroundColor: '#EFF6FF' },
  statusRowDot:    { width: 12, height: 12, borderRadius: 6 },
  statusRowLabel:  { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 },

  workerRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 12 },
  workerRowActive:  { backgroundColor: '#EFF6FF' },
  avatarCircleSmall:{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  workerRowName:    { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  workerRowEmail:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  separator:        { height: 1, backgroundColor: '#F1F5F9', marginLeft: 74 },
  emptyWorkers:    { alignItems: 'center', paddingVertical: 32 },
  emptyText:       { color: '#94A3B8', fontSize: 15, marginBottom: 12 },
  retryWorkerBtn:  { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1.5, borderColor: '#BFDBFE' },
  retryWorkerText: { color: '#1E3A8A', fontWeight: '700', fontSize: 14 },

  confirmAssignBtn:     { marginHorizontal: 24, marginTop: 12, backgroundColor: '#1E3A8A', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmAssignBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel:          { marginHorizontal: 24, marginTop: 10, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0' },
  modalCancelText:      { fontSize: 15, color: '#94A3B8', fontWeight: '600' },

  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  fullImage:         { width: '100%', height: '80%' },
  imageModalClose:   { position: 'absolute', top: 56, right: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  imageModalCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});