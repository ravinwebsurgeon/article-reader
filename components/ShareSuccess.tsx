// components/ShareSuccess.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ShareSuccessProps {
  visible: boolean;
  onHide: () => void;
}

export const ShareSuccess: React.FC<ShareSuccessProps> = ({ visible, onHide }) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>❤️</Text>
        <Text style={styles.text}>Saved to Pocket!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  card: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
