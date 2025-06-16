import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { close, InitialProps } from "expo-share-extension";

// Component to show when content is being saved
const SavingIndicator = () => (
  <View style={styles.savingContainer}>
    <Text style={styles.savingText}>Saving to Folio...</Text>
  </View>
);

// Component to show success message
const SuccessMessage = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.successContainer}>
    <Text style={styles.successTitle}>✓ Added to Folio</Text>
    <Text style={styles.successSubtitle}>Your content has been saved successfully</Text>
    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
      <Text style={styles.closeButtonText}>Done</Text>
    </TouchableOpacity>
  </View>
);

export default function ShareExtension(props: InitialProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { url, text, images, videos, files } = props;

  useEffect(() => {
    // Simulate saving the shared content
    const saveContent = async () => {
      try {
        // Add your actual save logic here
        // For now, we'll just simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsLoading(false);
        setIsSuccess(true);

        // Auto-close after 2 seconds
        setTimeout(() => {
          close();
        }, 2000);
      } catch (error: unknown) {
        setIsLoading(false);
        Alert.alert("Error", "Failed to save content to Folio " + error);
      }
    };

    saveContent();
  }, []);

  const handleClose = () => {
    close();
  };

  if (isLoading) {
    return <SavingIndicator />;
  }

  if (isSuccess) {
    return <SuccessMessage onClose={handleClose} />;
  }

  console.log("ShareExtension props:", props);

  // Fallback UI (shouldn't normally be reached with current flow)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share to Folio</Text>

      {url && (
        <View style={styles.contentItem}>
          <Text style={styles.label}>URL:</Text>
          <Text style={styles.content} numberOfLines={2}>
            {url}
          </Text>
        </View>
      )}

      {text && (
        <View style={styles.contentItem}>
          <Text style={styles.label}>Text:</Text>
          <Text style={styles.content} numberOfLines={3}>
            {text}
          </Text>
        </View>
      )}

      {images && images.length > 0 && (
        <View style={styles.contentItem}>
          <Text style={styles.label}>Images:</Text>
          <Text style={styles.content}>{images.length} image(s)</Text>
        </View>
      )}

      {videos && videos.length > 0 && (
        <View style={styles.contentItem}>
          <Text style={styles.label}>Videos:</Text>
          <Text style={styles.content}>{videos.length} video(s)</Text>
        </View>
      )}

      {files && files.length > 0 && (
        <View style={styles.contentItem}>
          <Text style={styles.label}>Files:</Text>
          <Text style={styles.content}>{files.length} file(s)</Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  savingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  savingText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  contentItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  content: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
