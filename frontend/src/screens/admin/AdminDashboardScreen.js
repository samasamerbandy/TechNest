import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRes = await api.get('/api/auth/workers');
      setUsers(usersRes.data.workers || []);
      
      // Fetch all tickets
      const ticketsRes = await api.get('/api/tickets');
      setTickets(ticketsRes.data.tickets || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>System Overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="people" size={28} color="#1E3A8A" />
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="document-text" size={28} color="#D97706" />
          <Text style={styles.statValue}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Tickets</Text>
        </View>
      </View>

      {/* Users Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          users.slice(0, 5).map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Ionicons name="person-circle" size={40} color="#94A3B8" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={[styles.userRole, { color: u.isActive ? '#059669' : '#DC2626' }]}>
                    {u.isActive ? '✓ Active' : '✗ Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        {users.length > 5 && (
          <Text style={styles.moreText}>+ {users.length - 5} more users</Text>
        )}
      </View>

      {/* Tickets Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tickets ({tickets.length})</Text>
        {tickets.length === 0 ? (
          <Text style={styles.emptyText}>No tickets found</Text>
        ) : (
          tickets.slice(0, 5).map((t) => (
            <View key={t.id} style={styles.ticketCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketTitle}>{t.title || 'Untitled'}</Text>
                <Text style={styles.ticketDesc} numberOfLines={2}>{t.description}</Text>
                <View style={styles.ticketMeta}>
                  <Text style={[
                    styles.ticketStatus,
                    t.status === 'pending' && { color: '#F59E0B' },
                    t.status === 'in_progress' && { color: '#3B82F6' },
                    t.status === 'resolved' && { color: '#059669' },
                    t.status === 'closed' && { color: '#6B7280' },
                  ]}>
                    {t.status}
                  </Text>
                  <Text style={styles.ticketPriority}>{t.priority}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        {tickets.length > 5 && (
          <Text style={styles.moreText}>+ {tickets.length - 5} more tickets</Text>
        )}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.refreshBtnText}>Refresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ticketStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  ticketPriority: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 20,
    textAlign: 'center',
  },
  moreText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshBtn: {
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
