import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE } from '../../config';

const CATEGORIES = [
  'electrical',
  'plumbing',
  'cleaning',
  'furniture',
  'other',
];

const MIN_DESC = 10;

const capitalize = (s) =>
  s.charAt(0).toUpperCase() + s.slice(1);

export default function IssueSubmissionScreen({ navigation }) {

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electrical');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  // ─────────────────────────────────────────────
  // Image Picker
  // ─────────────────────────────────────────────
  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } =
          await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Please allow camera access.'
          );
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Please allow photo library access.'
          );
          return;
        }
      }

      const result = await (
        useCamera
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync
      )({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }

    } catch (err) {
      console.error('pickImage error:', err);

      Alert.alert(
        'Error',
        'Failed to select image.'
      );
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Attach Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () => pickImage(true),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validate = () => {
    const errors = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!description.trim()) {
      errors.description =
        'Description is required';
    } else if (
      description.trim().length < MIN_DESC
    ) {
      errors.description =
        `Description must be at least ${MIN_DESC} characters`;
    }

    if (!building.trim()) {
      errors.building =
        'Building is required';
    }

    if (!floor.trim()) {
      errors.floor = 'Floor is required';
    }

    if (!roomNumber.trim()) {
      errors.roomNumber =
        'Room number is required';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const clearError = (field) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {

    if (!validate()) return;

    setLoading(true);

    try {

      const token =
        await SecureStore.getItemAsync('token');

      const formData = new FormData();

      formData.append(
        'title',
        title.trim()
      );

      formData.append(
        'description',
        description.trim()
      );

      formData.append(
        'category',
        category
      );

      formData.append(
        'building',
        building.trim()
      );

      formData.append(
        'floor',
        floor.trim()
      );

      formData.append(
        'roomNumber',
        roomNumber.trim()
      );

      if (image) {

        const fileName =
          image.split('/').pop();

        const fileExt =
          fileName
            .split('.')
            .pop()
            .toLowerCase();

        formData.append('image', {
          uri:
            Platform.OS === 'android'
              ? image
              : image.replace('file://', ''),

          name: fileName,

          type: `image/${
            fileExt === 'jpg'
              ? 'jpeg'
              : fileExt
          }`,
        });
      }

      const response = await fetch(
        `${API_BASE}/tickets`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {

        const message =
          data.errors
            ?.map((e) => e.msg)
            .join('\n')
          || data.message
          || 'Failed to submit issue';

        Alert.alert(
          'Submission Failed',
          message
        );

        return;
      }

      Alert.alert(
        'Success',
        'Issue submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('My Issues'),
          },
        ]
      );

    } catch (err) {

      console.error(
        'handleSubmit error:',
        err
      );

      Alert.alert(
        'Error',
        err.message ||
          'Something went wrong.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerSub}>
            COMMUNITY MEMBER
          </Text>

          <Text style={styles.headerTitle}>
            Submit Issue
          </Text>
        </View>

      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Category */}
        <View style={styles.section}>

          <Text style={styles.sectionLabel}>
            CATEGORY
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >

            <View style={styles.chipRow}>

              {CATEGORIES.map((c) => (

                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    category === c &&
                      styles.chipActive,
                  ]}
                  onPress={() => setCategory(c)}
                >

                  <Text
                    style={[
                      styles.chipText,
                      category === c &&
                        styles.chipTextActive,
                    ]}
                  >
                    {capitalize(c)}
                  </Text>

                </TouchableOpacity>

              ))}

            </View>

          </ScrollView>

        </View>

        {/* Location */}
        <View style={styles.section}>

          <Text style={styles.sectionLabel}>
            LOCATION
          </Text>

          {/* Building */}
          <Text style={styles.fieldLabel}>
            Building
          </Text>

          <View
            style={[
              styles.inputWrapper,
              fieldErrors.building &&
                styles.inputError,
            ]}
          >

            <Ionicons
              name="business-outline"
              size={16}
              color="#94A3B8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="e.g. Building A"
              placeholderTextColor="#CBD5E1"
              value={building}
              onChangeText={(t) => {
                setBuilding(t);
                clearError('building');
              }}
            />

          </View>

          {fieldErrors.building ? (
            <Text style={styles.errorText}>
              {fieldErrors.building}
            </Text>
          ) : null}

          <View style={styles.rowFields}>

            {/* Floor */}
            <View style={{ flex: 1 }}>

              <Text style={styles.fieldLabel}>
                Floor
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.floor &&
                    styles.inputError,
                ]}
              >

                <Ionicons
                  name="layers-outline"
                  size={16}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  placeholderTextColor="#CBD5E1"
                  value={floor}
                  onChangeText={(t) => {
                    setFloor(t);
                    clearError('floor');
                  }}
                />

              </View>

              {fieldErrors.floor ? (
                <Text style={styles.errorText}>
                  {fieldErrors.floor}
                </Text>
              ) : null}

            </View>

            {/* Room */}
            <View style={{ flex: 1 }}>

              <Text style={styles.fieldLabel}>
                Room Number
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.roomNumber &&
                    styles.inputError,
                ]}
              >

                <Ionicons
                  name="pin-outline"
                  size={16}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101"
                  placeholderTextColor="#CBD5E1"
                  value={roomNumber}
                  onChangeText={(t) => {
                    setRoomNumber(t);
                    clearError('roomNumber');
                  }}
                />

              </View>

              {fieldErrors.roomNumber ? (
                <Text style={styles.errorText}>
                  {fieldErrors.roomNumber}
                </Text>
              ) : null}

            </View>

          </View>

        </View>

        {/* Title */}
        <View style={styles.section}>

          <Text style={styles.sectionLabel}>
            TITLE
          </Text>

          <View
            style={[
              styles.inputWrapper,
              fieldErrors.title &&
                styles.inputError,
            ]}
          >

            <Ionicons
              name="create-outline"
              size={16}
              color="#94A3B8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Brief title"
              placeholderTextColor="#CBD5E1"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                clearError('title');
              }}
            />

          </View>

          {fieldErrors.title ? (
            <Text style={styles.errorText}>
              {fieldErrors.title}
            </Text>
          ) : null}

        </View>

        {/* Description */}
        <View style={styles.section}>

          <Text style={styles.sectionLabel}>
            DESCRIPTION
          </Text>

          <View
            style={[
              styles.inputWrapper,
              styles.textAreaWrapper,
              fieldErrors.description &&
                styles.inputError,
            ]}
          >

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Describe the issue..."
              placeholderTextColor="#CBD5E1"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                clearError('description');
              }}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

          </View>

          {fieldErrors.description ? (
            <Text style={styles.errorText}>
              {fieldErrors.description}
            </Text>
          ) : null}

        </View>

        {/* Photo */}
        <View style={styles.section}>

          <Text style={styles.sectionLabel}>
            PHOTO (OPTIONAL)
          </Text>

          {image ? (

            <View style={styles.previewContainer}>

              <Image
                source={{ uri: image }}
                style={styles.preview}
              />

              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => setImage(null)}
              >

                <Ionicons
                  name="close"
                  size={13}
                  color="#fff"
                />

              </TouchableOpacity>

            </View>

          ) : (

            <TouchableOpacity
              style={styles.uploadBox}
              onPress={showImageOptions}
            >

              <Ionicons
                name="camera-outline"
                size={36}
                color="#94A3B8"
              />

              <Text style={styles.uploadTitle}>
                Attach a Photo
              </Text>

            </TouchableOpacity>

          )}

        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            loading &&
              styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >

          {loading ? (

            <ActivityIndicator color="#fff" />

          ) : (

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >

              <Ionicons
                name="send-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.submitBtnText}>
                Submit Issue
              </Text>

            </View>

          )}

        </TouchableOpacity>

        <View style={{ height: 40 }} />

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },

  body: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  scroll: {
    padding: 24,
  },

  section: {
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },

  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },

  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },

  chip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  chipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },

  chipText: {
    fontSize: 13,
    color: '#64748B',
  },

  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  inputError: {
    borderColor: '#EF4444',
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },

  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },

  textArea: {
    minHeight: 120,
    paddingTop: 0,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },

  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },

  uploadTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },

  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  preview: {
    width: '100%',
    height: 200,
  },

  removePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor:
      'rgba(239,68,68,0.9)',
    borderRadius: 20,
    padding: 8,
  },

  submitBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },

  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },

  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});