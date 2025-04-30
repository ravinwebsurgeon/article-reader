import { ThemeText } from '@/components';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/redux/services/authApi';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const [logout] = useLogoutMutation();

  const handleSubmit = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <ThemedView style={styles.titleContainer}>
      <ThemeText variant="h2">Explore</ThemeText>
      <Button
        title="Sign out"
        onPress={handleSubmit}
        leftIcon={null}
        rightIcon={null}
        style={styles.titleContainer}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -10,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
