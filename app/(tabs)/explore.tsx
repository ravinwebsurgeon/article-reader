import { StyleSheet, Image, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/redux/services/authApi";

export default function TabTwoScreen() {

  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();

  const handleSubmit = async() => {
    // Handle form submission
    try {
      await logout();
    } catch (err) {
      console.error("Login failed", err);
    }
  };
  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">Explore</ThemedText>
      <Button
        title="Sign in"
        onPress={handleSubmit}
        style={styles.signInButton}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
