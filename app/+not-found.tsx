import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemeText } from "@/components";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemeText variant="h2">This screen doesn't exist.</ThemeText>
        <Link href="/" style={styles.link}>
          <ThemeText variant="overline">Go to home screen!</ThemeText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
