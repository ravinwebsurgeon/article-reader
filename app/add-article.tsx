import React, { useState } from "react";
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
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/theme";
import { isValidUrl } from "@/utils/validation";
import { createItemViaAPI } from "@/database/hooks/withItems";
import { useTranslation } from "react-i18next";

export default function AddArticleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // State
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle navigation back
  const handleBack = () => {
    router.back();
  };

  // Handle URL input clear
  const handleClear = () => {
    setUrl("");
  };

  // Handle save article
  const handleSaveArticle = async () => {
    // Validate URL
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    // Add https if not present
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!isValidUrl(formattedUrl)) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }

    try {
      setIsLoading(true);
      // Create item via API
      await createItemViaAPI(formattedUrl);

      // Close the screen after successful save
      handleBack();
    } catch {
      Alert.alert("Error", "There was a problem saving this article. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicStyles: {
    container: ViewStyle;
    headerTitle: TextStyle;
    sectionTitle: TextStyle;
    input: TextStyle;
    cancelButton: TextStyle;
    saveButtonText: TextStyle;
    infoText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.colors.text.primary,
    },
    input: {
      height: 100,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      textAlignVertical: "top",
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.divider,
    },
    cancelButton: {
      fontSize: 16,
      color: theme.colors.primary.main,
      padding: 4,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary.contrast,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: 24,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={dynamicStyles.cancelButton}>{t("common.cancel")}</Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.headerTitle}>{t("addArticle.title")}</Text>

          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={dynamicStyles.sectionTitle}>{t("addArticle.sectionTitle")}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={dynamicStyles.input}
              placeholder={t("addArticle.urlPlaceholder")}
              placeholderTextColor={theme.colors.text.disabled}
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
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary.main },
              { opacity: url.trim().length === 0 || isLoading ? 0.6 : 1 },
            ]}
            onPress={handleSaveArticle}
            disabled={url.trim().length === 0 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.primary.contrast} size="small" />
            ) : (
              <Text style={dynamicStyles.saveButtonText}>{t("common.save")}</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <Text style={dynamicStyles.infoText}>{t("addArticle.infoText")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 24,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  saveButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
});
