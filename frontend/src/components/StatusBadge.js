import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_META = {
  open:        { label: 'Open',        bg: '#DBEAFE', color: '#1D4ED8' },
  pending:     { label: 'pending',     bg: '#FEF9C3', color: '#92400E' },
  in_progress: { label: 'In Progress', bg: '#FEF9C3', color: '#92400E' },
  resolved:    { label: 'resolved',    bg: '#DCFCE7', color: '#166534' },
  closed:      { label: 'closed',      bg: '#F1F5F9', color: '#475569' },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, bg: '#F1F5F9', color: '#475569' };
  return (
    <View style={[styles.root, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
           paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  dot:   { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
