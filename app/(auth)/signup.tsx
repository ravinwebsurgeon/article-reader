import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/TextInput/input';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { COLORS, lightColors } from '@/theme';
import { useRegisterMutation } from '@/redux/services/authApi';
import { useTheme } from '@/theme';
import { ThemeText, ThemeView } from '@/components';
import { scaler } from '@/utils';
import { SvgIcon } from '@/components/SvgIcon';

const SignUpScreen = ({ navigation }) => {
  const [loader, setLoader] = useState(false);
  const [register] = useRegisterMutation();

  const theme = useTheme();

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: any) => {
    console.log(data);
    setLoader(true);
    try {
      await register({
        user: {
          username: data.username,
          email: data.email,
          password: data.password,
        },
      }).unwrap();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loader && <ActivityIndicator size="small" color="#007AFF" />}
          <ThemeView style={styles.header}>
            <ThemeView style={styles.logoContainer}>
              <SvgIcon name="pocket-pink" size={48} color={theme.colors.primary.main} />
            </ThemeView>
            <ThemeText variant="h2" style={styles.title}>
              Welcome to Pocket
            </ThemeText>
            <ThemeText style={styles.subtitle}>
              Log in or sign up to start saving articles you’ll actually get back to.
            </ThemeText>
          </ThemeView>

          <View style={styles.formContainer}>
            {/* <Input
              control={control}
              name="userName"
              label="Username"
              rules={{
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                maxLength: {
                  value: 20,
                  message: 'Username must be less than 20 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'Username can only contain letters, numbers, underscores, and hyphens',
                },
              }}
              placeholder="Enter your Username"
              icon={<Ionicons name="person-outline" size={20} color={COLORS.primary.main} />}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              style={styles.input}
            /> */}

            <Input
              control={control}
              name="email"
              // label="Email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              icon={<SvgIcon name="envelope" size={24} color={COLORS.primary.main} />}
              style={styles.input}
            />

            <Input
              control={control}
              name="password"
              // label="Password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    'Password must contain uppercase, lowercase, number and special character',
                },
              }}
              placeholder="Password"
              secureTextEntry
              icon={<SvgIcon name="key" size={24} color={COLORS.primary.main} />}
              style={styles.input}
            />

            <Input
              control={control}
              name="confirmPassword"
              // label="Confirm Password"
              rules={{
                required: 'Please confirm your password',
                validate: (value: string) => value === password || 'Passwords do not match',
              }}
              placeholder="Confirm Password"
              secureTextEntry
              icon={<SvgIcon name="key-renter" size={24} color={COLORS.primary.main} />}
              style={styles.input}
            />

            <Button
              title={loader ? 'Submiting...' : 'Create Account'}
              onPress={handleSubmit(onSubmit)}
              style={styles.signUpButton}
              // leftIcon={<Ionicons name="person-add-outline" size={20} color="white" />}
              rightIcon={null}
            />
          </View>

          <View style={styles.loginContainer}>
            <ThemeText style={styles.loginText}>Already have an account? </ThemeText>
            <ThemeText style={styles.loginLinkText} onPress={navigateToLogin}>
              Sign in
            </ThemeText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background.default,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: scaler(24),
    paddingTop: scaler(40),
    paddingBottom: scaler(24),
    alignItems: 'center',
  },
  header: {
    marginBottom: scaler(15),
    alignItems: 'flex-start',
    marginTop: scaler(20),
  },
  title: {
    fontSize: scaler(28),
    fontWeight: 'bold',
    marginBottom: scaler(8),
  },
  subtitle: {
    fontSize: scaler(16),
    color: lightColors.text.disabled,
    marginBottom: scaler(16),
  },
  logoContainer: {
    marginBottom: scaler(24),
  },
  formContainer: {
    width: '100%',
    marginBottom: scaler(24),
  },
  signUpButton: {
    marginTop: scaler(16),
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaler(16),
  },
  loginText: {
    // color: COLORS.text,
    fontSize: scaler(16),
  },
  loginLinkText: {
    color: COLORS.primary.main,
    fontSize: scaler(16),
    fontWeight: '600',
  },
  input: {
    marginBottom: scaler(16),
  },
});

export default SignUpScreen;
