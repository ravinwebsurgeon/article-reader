import { StyleSheet, Pressable } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogoutMutation } from "@/redux/services/authApi";

export default function Settings() {
  const [logout] = useLogoutMutation();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          Settings
        </ThemeText>

        <ThemeView style={styles.section} rounded="md">
          <Pressable style={styles.settingItem} onPress={handleSignOut}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <ThemeText style={styles.settingText}>Sign Out</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </Pressable>
        </ThemeView>
      </ThemeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: "#FF3B30",
  },
});
