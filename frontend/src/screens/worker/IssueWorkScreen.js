import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, SafeAreaView, StatusBar
} from 'react-native';
import { getTicketById, updateTicketStatus } from '../../services/ticketService';
import StatusBadge from '../../components/StatusBadge';
import { API_BASE } from '../../config';

export default function IssueWorkScreen({ route, navigation }) {
  const issueId = route?.params?.issueId;

  const [ticket, setTicket]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!issueId) {
      Alert.alert('Error', 'No ticket ID provided.');
      navigation.goBack();
      return;
    }
    fetchTicket();
  }, [issueId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await getTicketById(issueId);
      setTicket(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load ticket details.');
      console.error('fetchTicket error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await updateTicketStatus(issueId, newStatus);
      Alert.alert(
        'Updated',
        `Ticket marked as ${newStatus.replace(/_/g, ' ')}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
      console.error('updateStatus error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const confirmUpdate = (newStatus, label) => {
    Alert.alert(
      `Mark as ${label}?`,
      'This will update the ticket status for everyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateStatus(newStatus) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading ticket…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEyebrow}>TICKET DETAIL</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ticket?.title ?? 'No Title'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sheet}>

          {/* Ticket meta */}
          {ticket && (
            <View style={styles.metaCard}>
              <Row label="Category" value={ticket.category?.toUpperCase() ?? '—'} />
              <Row label="Priority" value={ticket.priority ?? '—'} />
              <Row label="Building" value={ticket.building ?? '—'} />
              <Row label="Floor"    value={ticket.floor ?? '—'} />
              <Row label="Room"     value={ticket.roomNumber ?? '—'} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Status</Text>
                <StatusBadge status={ticket.status} />
              </View>
              {ticket.description ? (
                <View style={styles.descWrap}>
                  <Text style={styles.metaLabel}>Description</Text>
                  <Text style={styles.descText}>{ticket.description}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Action Center */}
          <Text style={styles.sectionLabel}>ACTION CENTER</Text>

          {/* Mark In Progress */}
          <TouchableOpacity
            style={[styles.btn, styles.progressBtn, updating && styles.btnDisabled]}
            onPress={() => confirmUpdate('in_progress', 'In Progress')}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.btnIcon}>🔧</Text>
                <Text style={styles.btnText}>Mark as In Progress</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Mark Resolved */}
          <TouchableOpacity
            style={[styles.btn, styles.resolveBtn, updating && styles.btnDisabled]}
            onPress={() => confirmUpdate('resolved', 'resolved')}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.btnIcon}>✅</Text>
                <Text style={styles.btnText}>Mark as Resolved</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#1E3A8A' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 14,
  },
  backBtn:       { width: 38, height: 38, borderRadius: 12,
                   backgroundColor: 'rgba(255,255,255,0.15)',
                   alignItems: 'center', justifyContent: 'center' },
  backArrow:     { fontSize: 18, color: '#fff', lineHeight: 22 },
  headerEyebrow: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },

  scroll: { flexGrow: 1, paddingBottom: 40 },
  sheet:  { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, flex: 1, minHeight: '100%' },

  metaCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24,
               borderWidth: 1, borderColor: '#E2E8F0',
               shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  metaRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  metaLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8',
               letterSpacing: 0.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#0F172A',
               maxWidth: '55%', textAlign: 'right' },
  descWrap:  { paddingTop: 12 },
  descText:  { fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 6 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8',
                  letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },

  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 padding: 18, borderRadius: 14, marginBottom: 12, gap: 8,
                 shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                 shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  btnDisabled: { opacity: 0.6 },
  progressBtn: { backgroundColor: '#F59E0B' },
  resolveBtn:  { backgroundColor: '#10B981' },
  btnIcon:     { fontSize: 16 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});