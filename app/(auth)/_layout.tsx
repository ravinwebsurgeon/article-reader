import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Reset Password',
        }}
      />
      <Stack.Screen
        name="otp-verification"
        options={{
          title: 'Verify Code',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
