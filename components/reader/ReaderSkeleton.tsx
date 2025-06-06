import React, { useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useTheme, useSpacing } from "@/theme/hooks";

interface SkeletonProps {
  // Removed isDark prop since we'll use theme directly
}

export const ReaderSkeleton: React.FC<SkeletonProps> = () => {
  const theme = useTheme();
  const spacing = useSpacing();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Create styles using theme values
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg - spacing.xs, // 20px equivalent
      backgroundColor: theme.colors.background.paper,
    },
    skeletonLine: {
      height: spacing.md - spacing.xs, // 12px equivalent
      borderRadius: spacing.sm - spacing.xs, // 6px equivalent
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.gray[200],
    },
    header: {
      height: spacing.lg + spacing.sm, // 24px equivalent
      width: "70%",
      marginBottom: spacing.lg - spacing.xs, // 20px equivalent
      borderRadius: spacing.sm,
    },
    paragraph: {
      marginBottom: spacing.lg - spacing.xs, // 20px equivalent
    },
    longLine: {
      width: "100%",
    },
    mediumLine: {
      width: "80%",
    },
    shortLine: {
      width: "60%",
    },
    image: {
      height: 200,
      width: "100%",
      marginBottom: spacing.lg - spacing.xs, // 20px equivalent
      borderRadius: spacing.sm,
    },
  });

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const pulseStyle = {
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  const skeletonStyle = [styles.skeletonLine, pulseStyle];

  return (
    <View style={styles.container}>
      <View style={styles.paragraph}>
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.mediumLine]} />
      </View>
      <View style={styles.paragraph}>
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.shortLine]} />
      </View>
      <View style={styles.paragraph}>
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.longLine]} />
        <Animated.View style={[skeletonStyle, styles.mediumLine]} />
      </View>
    </View>
  );
};

export default ReaderSkeleton;
