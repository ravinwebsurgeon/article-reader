import { StyleSheet } from "react-native";
import { ThemeText, ThemeView } from "@/components";

export default function Settings() {
  return (
    <ThemeView style={styles.titleContainer}>
      <ThemeText variant="h2">Explore</ThemeText>
    </ThemeView>
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
