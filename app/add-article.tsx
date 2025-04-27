import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { isValidUrl } from '@/utils/validation';
import { COLORS, lightColors } from '@/theme';
import { createItem } from '@/database/hooks/withItems';

export default function AddArticleScreen() {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  // State
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle navigation back
  const handleBack = () => {
    router.back();
  };

  // Handle URL input clear
  const handleClear = () => {
    setUrl('');
  };

  // Handle save article
  const handleSaveArticle = async () => {
    // Validate URL
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    // Add https if not present
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!isValidUrl(formattedUrl)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setIsLoading(true);
      // Create item in WatermelonDB
      await createItem(formattedUrl);

      // Show success alert with options
      Alert.alert('Article Saved', 'The article has been saved to your Pocket.', [
        {
          text: 'Add Another',
          onPress: () => setUrl(''),
          style: 'default',
        },
        {
          text: 'View List',
          onPress: handleBack,
          style: 'default',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'There was a problem saving this article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : lightColors.background.default },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDarkMode ? COLORS.white : COLORS.text }]}>
          Add to Pocket
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? COLORS.white : COLORS.text }]}>
          Add a URL
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                color: isDarkMode ? COLORS.white : COLORS.text,
                backgroundColor: isDarkMode ? COLORS.darkGray : COLORS.white,
                borderColor: isDarkMode ? COLORS.darkBorder : COLORS.lightBorder,
              },
            ]}
            placeholder="https://example.com/article"
            placeholderTextColor={lightColors.text.disabled}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleSaveArticle}
          />

          {url.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { opacity: url.trim().length === 0 || isLoading ? 0.6 : 1 }]}
          onPress={handleSaveArticle}
          disabled={url.trim().length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save to Pocket</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.infoText}>
          You can also save content to Pocket using the Share menu from your browser or other apps.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBorder,
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.primary.main,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  saveButton: {
    backgroundColor: COLORS.primary.main,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightBorder,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
