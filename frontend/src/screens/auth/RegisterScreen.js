import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, Modal, FlatList
} from 'react-native';
import api from '../../api/axiosInstance';
import { API_BASE } from '../../config';

const ROLES = [
  { label: 'Community Member', value: 'community_member', desc: 'Report and track campus issues' },
  { label: 'Facility Manager', value: 'facility_manager', desc: 'Manage and assign all issues' },
  { label: 'Worker', value: 'worker', desc: 'Handle assigned maintenance tasks' },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(ROLES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) e.password = 'Must contain a letter and a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

 const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      // 1. Prepare data - ensure we are sending exactly what the backend expects
      const registrationData = {
        name: name.trim(),
        email: email.trim().toLowerCase(), // Always lowercase emails!
        password: password,
        role: role.value, 
      };

      // 2. Call the API
      await api.post('/api/auth/register', registrationData);

      // 3. Success Feedback
      Alert.alert('Account Created!', 'You can now sign in with your credentials.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      
    } catch (err) {
      // 4. Detailed error logging for debugging
      console.log("Registration Error:", err.response?.data);
      
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >

        {/* Top Navy Section */}
        <View style={styles.top}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoLetters}>CC</Text>
            </View>
          </View>
          <Text style={styles.appName}>CampusCare</Text>
          <Text style={styles.appSub}>CREATE YOUR ACCOUNT</Text>
        </View>

        {/* White Sheet */}
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Get started</Text>
          <Text style={styles.sheetSub}>Fill in your details below</Text>

          {/* Full Name */}
          <Text style={styles.label}>FULL NAME</Text>
          <View style={[
            styles.inputRow,
            name.length > 0 && styles.inputRowActive,
            errors.name && styles.inputRowError,
          ]}>
            <View style={[styles.dot, name.length > 0 && styles.dotActive]} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#CBD5E1"
              value={name}
              onChangeText={(t) => { setName(t); setErrors({ ...errors, name: null }); }}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[
            styles.inputRow,
            email.length > 0 && styles.inputRowActive,
            errors.email && styles.inputRowError,
          ]}>
            <View style={[styles.dot, email.length > 0 && styles.dotActive]} />
            <TextInput
              style={styles.input}
              placeholder="you@university.edu"
              placeholderTextColor="#CBD5E1"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: null }); }}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>
          <View style={[
            styles.inputRow,
            password.length > 0 && styles.inputRowActive,
            errors.password && styles.inputRowError,
          ]}>
            <View style={[styles.dot, password.length > 0 && styles.dotActive]} />
            <TextInput
              style={styles.input}
              placeholder="Min. 8 chars, letter + number"
              placeholderTextColor="#CBD5E1"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: null }); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showBtn}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Role Picker */}
          <Text style={styles.label}>ROLE</Text>
          <TouchableOpacity
            style={styles.roleBtn}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.roleBtnLeft}>
              <View style={styles.roleDot} />
              <View>
                <Text style={styles.roleBtnTitle}>{role.label}</Text>
                <Text style={styles.roleBtnDesc}>{role.desc}</Text>
              </View>
            </View>
            <Text style={styles.roleArrow}>›</Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.footerRow}
          >
            <Text style={styles.footerText}>
              Already have an account?{'  '}
              <Text style={styles.footerLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Role Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Your Role</Text>
            <Text style={styles.modalSub}>Choose the role that fits your position</Text>

            <FlatList
              data={ROLES}
              keyExtractor={(item) => item.value}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    role.value === item.value && styles.modalOptionActive,
                  ]}
                  onPress={() => { setRole(item); setShowPicker(false); }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.modalDot,
                    role.value === item.value && styles.modalDotActive,
                  ]} />
                  <View style={styles.modalOptionText}>
                    <Text style={[
                      styles.modalOptionTitle,
                      role.value === item.value && styles.modalOptionTitleActive,
                    ]}>
                      {item.label}
                    </Text>
                    <Text style={styles.modalOptionDesc}>{item.desc}</Text>
                  </View>
                  {role.value === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E3A8A' },
  scroll: { flexGrow: 1 },

  // Top navy
  top: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetters: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  appSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    fontWeight: '600',
  },

  // White sheet
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 28,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },

  // Fields
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 12,
  },
  inputRowActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  inputRowError: { borderColor: '#EF4444' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: { backgroundColor: '#1E3A8A' },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  showBtn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
  },

  // Role Button
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
  },
  roleBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A8A',
  },
  roleBtnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  roleBtnDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  roleArrow: {
    fontSize: 22,
    color: '#1E3A8A',
    fontWeight: '300',
  },

  // Button
  btn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Footer
  footerRow: { marginTop: 24 },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94A3B8',
  },
  footerLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    gap: 14,
  },
  modalOptionActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  modalDotActive: { backgroundColor: '#1E3A8A' },
  modalOptionText: { flex: 1 },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  modalOptionTitleActive: { color: '#1E3A8A' },
  modalOptionDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  checkmark: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
});