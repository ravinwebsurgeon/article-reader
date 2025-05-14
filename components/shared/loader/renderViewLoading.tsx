import { ThemeView } from "@/components/primitives";
import { useTheme } from "@/theme";
import { StyleSheet } from "react-native";

export const RenderWebViewLoading = () => {
  const theme = useTheme();
  return (
    <ThemeView
      style={styles.webViewLoadingContainer}
      backgroundColor={theme.colors.background.paper}
    >
      {/* Skeleton for header */}
      <ThemeView style={styles.skeletonHeader} backgroundColor={theme.colors.background.default} />

      {/* Skeleton for content */}
      <ThemeView style={styles.skeletonContentContainer}>
        {/* URL bar skeleton */}
        <ThemeView
          style={styles.skeletonUrlBar}
          backgroundColor={theme.colors.background.default}
        />

        {/* Content lines skeletons */}
        {[...Array(12)].map((_, index) => (
          <ThemeView
            key={`skeleton-line-${index}`}
            style={[styles.skeletonLine, { width: `${Math.floor(Math.random() * 40) + 60}%` }]}
            backgroundColor={theme.colors.background.default}
          />
        ))}
      </ThemeView>
      <ThemeView style={styles.skeletonHeader} backgroundColor={theme.colors.background.default} />


      {/* Loading indicator */}
      {/* <ActivityIndicator
        size="large"
        color={theme.colors.primary.main}
        style={styles.loadingIndicator}
      /> */}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  webViewLoadingContainer: {
    flex: 1,
    marginTop: -800,
    padding: 16,
  },
  skeletonHeader: {
    height: 40,
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonContentContainer: {
    flex: 1,
    gap: 12,
  },
  skeletonUrlBar: {
    height: 36,
    borderRadius: 18,
    marginBottom: 24,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
  },
});
