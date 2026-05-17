import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || (err.message === 'Network Error'
            ? 'Cannot reach server. Check your connection or update the IP in config.js.'
            : 'Login failed. Please try again.');
      Alert.alert('Sign In Failed', msg);
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
          <Text style={styles.appSub}>SMART FACILITY MANAGEMENT</Text>
        </View>

        {/* White Sheet */}
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Welcome back</Text>
          <Text style={styles.sheetSub}>Sign in to continue</Text>

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
              onChangeText={(t) => {
                setEmail(t);
                const { email: _, ...rest } = errors;
                setErrors(rest);
              }}
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
              placeholder="Enter your password"
              placeholderTextColor="#CBD5E1"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                const { password: _, ...rest } = errors;
                setErrors(rest);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showBtn}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Forgot Password - disabled until implemented */}
          <TouchableOpacity style={styles.forgotRow} disabled>
            <Text style={[styles.forgotText, { opacity: 0.4 }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button - disabled until implemented */}
          <TouchableOpacity style={[styles.googleBtn, { opacity: 0.4 }]} disabled>
            <Text style={styles.googleLetter}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Register */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.footerRow}
          >
            <Text style={styles.footerText}>
              Don't have an account?{'  '}
              <Text style={styles.footerLink}>Register</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E3A8A' },
  scroll: { flexGrow: 1 },

  top: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 52,
  },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  logoInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetters: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  appName:     { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.3, marginBottom: 6 },
  appSub:      { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, fontWeight: '600' },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16, flex: 1,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#E2E8F0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 28,
  },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  sheetSub:   { fontSize: 14, color: '#94A3B8', marginBottom: 8 },

  label: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 0.8, marginTop: 20, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5,
    borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, height: 52, gap: 12,
  },
  inputRowActive: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  inputRowError:  { borderColor: '#EF4444' },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  dotActive: { backgroundColor: '#1E3A8A' },
  input:     { flex: 1, fontSize: 15, color: '#0F172A' },
  showBtn:   { fontSize: 10, fontWeight: '700', color: '#1E3A8A', letterSpacing: 0.5, paddingLeft: 8 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 5 },

  forgotRow: { alignItems: 'flex-end', marginTop: 12, marginBottom: 4 },
  forgotText: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },

  btn: {
    backgroundColor: '#1E3A8A', borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
    shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
  dividerText: { fontSize: 11, fontWeight: '700', color: '#CBD5E1', letterSpacing: 1 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, height: 52, backgroundColor: '#fff',
  },
  googleLetter: { fontSize: 17, fontWeight: '800', color: '#EA4335' },
  googleText:   { fontSize: 15, fontWeight: '600', color: '#374151' },

  footerRow: { marginTop: 28 },
  footerText: { textAlign: 'center', fontSize: 14, color: '#94A3B8' },
  footerLink: { color: '#1E3A8A', fontWeight: '700' },
});