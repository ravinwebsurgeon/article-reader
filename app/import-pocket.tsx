import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ThemeText, ThemeView } from "@/components/primitives";
import { Button } from "@/components/shared/button/Button";
import { useColors } from "@/theme/hooks";
import { useAppSelector } from "@/redux/hook";
import { Ionicons } from "@expo/vector-icons";

type ImportStep = "explanation" | "webview" | "success";

export default function ImportPocketScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>("explanation");

  // Get auth token from Redux
  const authToken = useAppSelector((state) => state.auth.token);

  const handleStartImport = useCallback(() => {
    setCurrentStep("webview");
  }, []);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "import-complete") {
        setCurrentStep("success");
      } else if (message.type === "import-error") {
        // Handle error - could show error state or go back
        console.error("Import error:", message.error);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderExplanationStep = () => (
    <ThemeView style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="download-outline" size={64} color={colors.primary.main} />
      </View>

      <ThemeText variant="h3" style={[styles.title, { color: colors.text.primary }]}>
        {t("import.pocket.title")}
      </ThemeText>

      <ThemeText variant="body1" style={[styles.description, { color: colors.text.secondary }]}>
        {t("import.pocket.description")}
      </ThemeText>

      <View style={styles.bulletPoints}>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.importArticles")}
          </ThemeText>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.preserveProgress")}
          </ThemeText>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.keepAccount")}
          </ThemeText>
        </View>
      </View>

      <ThemeText variant="body2" style={[styles.note, { color: colors.text.secondary }]}>
        {t("import.pocket.note")}
      </ThemeText>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="large"
          onPress={handleStartImport}
          buttonStyle={styles.primaryButton}
          title={t("import.pocket.startImport")}
        />
        <Button
          variant="secondary"
          size="large"
          onPress={handleClose}
          buttonStyle={styles.secondaryButton}
          title={t("import.pocket.cancel")}
        />
      </View>
    </ThemeView>
  );

  const renderWebViewStep = () => {
    const importUrl = `https://api.savewithfolio.com/import/pocket/start?auth_token=${authToken}`;

    // JavaScript to inject for communication
    const injectedJavaScript = `
      (function() {
        // Listen for messages from the web page
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'folio-import-complete') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'import-complete'
            }));
          } else if (event.data && event.data.type === 'folio-import-error') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'import-error',
              error: event.data.error
            }));
          }
        });
        
        // Also check for a global function that the web page might call
        window.folioImportComplete = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'import-complete'
          }));
        };
        
        window.folioImportError = function(error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'import-error',
            error: error
          }));
        };
      })();
      true;
    `;

    return (
      <ThemeView style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: importUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={Platform.OS === "android"}
        />
      </ThemeView>
    );
  };

  const renderSuccessStep = () => (
    <ThemeView style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
      </View>

      <ThemeText variant="h3" style={[styles.title, { color: colors.text.primary }]}>
        {t("import.pocket.success.title")}
      </ThemeText>

      <ThemeText variant="body1" style={[styles.description, { color: colors.text.secondary }]}>
        {t("import.pocket.success.description")}
      </ThemeText>

      <ThemeText variant="body2" style={[styles.note, { color: colors.text.secondary }]}>
        {t("import.pocket.success.note")}
      </ThemeText>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="large"
          onPress={handleClose}
          buttonStyle={styles.primaryButton}
          title={t("import.pocket.done")}
        />
      </View>
    </ThemeView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "explanation":
        return renderExplanationStep();
      case "webview":
        return renderWebViewStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderExplanationStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background.paper }]}>
        {/* Modal indicator bar */}
        <View style={styles.topBar}>
          <View style={[styles.topBarIndicator, { backgroundColor: colors.divider }]} />
        </View>

        {/* Header with close button - only show on explanation and success steps */}
        {currentStep !== "webview" && (
          <View style={styles.header}>
            <ThemeText variant="h6" style={[styles.headerTitle, { color: colors.text.primary }]}>
              {t("import.pocket.title")}
            </ThemeText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step content */}
        <View style={styles.content}>{renderCurrentStep()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  topBarIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 24, // Offset for close button
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  bulletPoints: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletText: {
    marginLeft: 12,
    flex: 1,
  },
  note: {
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    fontSize: 14,
  },
  buttonContainer: {
    alignSelf: "stretch",
    gap: 12,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
