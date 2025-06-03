import React, { useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";

interface SkeletonProps {
  isDark?: boolean;
}

export const ReaderSkeleton: React.FC<SkeletonProps> = ({ isDark = false }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

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

  const baseColor = isDark ? "#333" : "#E5E5E5";
  const skeletonStyle = [styles.skeletonLine, { backgroundColor: baseColor }, pulseStyle];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#242526" : "#FFFFFF" }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  header: {
    height: 24,
    width: "70%",
    marginBottom: 20,
    borderRadius: 8,
  },
  paragraph: {
    marginBottom: 20,
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
    marginBottom: 20,
    borderRadius: 8,
  },
});

export default ReaderSkeleton;
