import { StyleSheet, Image, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemeText } from '@/components';

export default function Settings() {
  return (
      <ThemedView style={styles.titleContainer}>
        <ThemeText variant="h2">Explore</ThemeText>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
