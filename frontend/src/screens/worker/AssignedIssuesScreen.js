import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getAssignedTickets } from '../../services/ticketService';
import StatusBadge from '../../components/StatusBadge';
import { API_BASE } from '../../config';

export default function AssignedIssuesScreen({ navigation }) {
  const { logout } = useAuth();
  const hasFetched = useRef(false);
  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchAssignedIssues();
    }, [])
  );

  const fetchAssignedIssues = async (attempt = 1) => {
    try {
      if (!hasFetched.current) setLoading(true);
      setError(null);
      const res = await getAssignedTickets();
      const tickets = res.data?.tickets ?? [];
      setIssues(Array.isArray(tickets) ? tickets : []);
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      if (isTimeout && attempt < 3) {
        setTimeout(() => fetchAssignedIssues(attempt + 1), 1500 * attempt);
        return;
      }
      const message = isTimeout
        ? 'Request timed out. Please check your connection.'
        : 'Failed to load tasks. Pull down to retry.';
      setError(message);
      console.error('Error fetching assigned issues:', err);
    } finally {
      hasFetched.current = true;
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedIssues();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('IssueWork', { issueId: item.id })}
    >
      <View style={styles.cardAccent} />
      <View style={{ flex: 1, paddingLeft: 14 }}>
        <Text style={styles.cardCategory}>{item.category?.toUpperCase()}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.arrowWrap}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {issues.length} {issues.length === 1 ? 'task' : 'tasks'} assigned
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>WORKER PORTAL</Text>
          <Text style={styles.headerTitle}>My Tasks</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>⏻</Text>
          <Text style={styles.logoutLabel}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Loading tasks…</Text>
          </View>
        ) : (
          <>
            {error ? (
              <TouchableOpacity style={styles.errorBanner} onPress={() => fetchAssignedIssues()}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.errorRetry}>Tap to retry</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <FlatList
              data={issues}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={issues.length > 0 ? renderHeader : null}
              ListEmptyComponent={
                !error ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>All clear!</Text>
                    <Text style={styles.emptyText}>You have no assigned issues right now.</Text>
                  </View>
                ) : null
              }
              refreshing={refreshing}
              onRefresh={onRefresh}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E3A8A' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
  },
  headerEyebrow: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5, marginBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, gap: 6,
  },
  logoutIcon:  { fontSize: 14, color: '#fff' },
  logoutLabel: { fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },

  sheet: {
    flex: 1, backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 24,
  },

  listHeader: { marginBottom: 16 },
  listHeaderText: {
    fontSize: 12, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden', shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    paddingVertical: 18, paddingRight: 16,
  },
  cardAccent: {
    width: 4, alignSelf: 'stretch', backgroundColor: '#1E3A8A',
    borderRadius: 4, marginLeft: 16,
  },
  cardCategory: { fontSize: 10, fontWeight: '800', color: '#1E3A8A', letterSpacing: 1, opacity: 0.7 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 5, lineHeight: 21 },
  arrowWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  arrow: { fontSize: 20, color: '#1E3A8A', lineHeight: 24 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  errorIcon:  { fontSize: 20 },
  errorText:  { fontSize: 13, fontWeight: '600', color: '#991B1B' },
  errorRetry: { fontSize: 12, color: '#EF4444', marginTop: 2 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '500' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptyText:  { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});