import React, { useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { resetAuthError } from '@/redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '@/components/ui/form/form-input';
import { Button } from '@/components/ui/button';
import { COLORS, lightColors } from '@/theme';
import { useLoginMutation } from '@/redux/services/authApi';
import { useTheme } from '@/theme';
import { ThemeText, ThemeView } from '@/components';
import { scaler } from '@/utils';
import { Input } from '@/components/ui/TextInput/input';

interface LoginFormData {
  email: string;
  password: string;
}

function LoginScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  console.log('theme in login', theme);

  const { error } = useAppSelector((state) => state.auth);
  const [login] = useLoginMutation();
  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        user: {
          email: data.email,
          password: data.password,
        },
      }).unwrap();
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const navigateToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const navigateToForgotPassword = () => {
    // navigation.navigate("ForgotPassword");
  };

  // Show error alert if needed
  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      dispatch(resetAuthError());
    }
  }, [error, dispatch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemeView style={styles.header}>
            <ThemeText variant="h2" style={styles.title}>
              Welcome Back!
            </ThemeText>
            <ThemeText variant="h4" style={styles.subtitle}>
              Let's Make Reading Simple.
            </ThemeText>
          </ThemeView>

          <ThemeView style={styles.formContainer}>
            <Input
              control={control}
              name="email"
              label="Email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              placeholder="Enter your Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              icon={<Ionicons name="mail-outline" size={20} color={COLORS.primary.main} />}
              style={styles.input}
            />
            <Input
              control={control}
              name="password"
              label="Password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              }}
              placeholder="Enter your Password"
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.primary.main} />}
              style={styles.input}
            />
 

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={navigateToForgotPassword}
            >
              <ThemeText style={styles.forgotPasswordText}>Forgot password?</ThemeText>
            </TouchableOpacity>

            <Button
              title="Sign in"
              onPress={handleSubmit(onSubmit)}
              style={styles.signInButton}
              leftIcon={<Ionicons name="log-in-outline" size={20} color={COLORS.white} />}
              rightIcon={null}
            />
          </ThemeView>

          <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>Don't have an account? </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={styles.signUpLinkText}>Sign Up</ThemeText>
            </TouchableOpacity>
          </ThemeView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: scaler(40),
  },
  logoContainer: {
    marginBottom: scaler(24),
  },
  logoCircle: {
    width: scaler(80),
    height: scaler(80),
    borderRadius: scaler(40),
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaler(15),
  },
  logoHeart: {
    width: scaler(30),
    height: scaler(30),
    backgroundColor: COLORS.primary.light,
    borderRadius: scaler(15),
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
  formContainer: {
    width: '100%',
    marginBottom: scaler(24),
  },
  inputContainer: {
    marginBottom: scaler(20),
  },
  iconContainer: {
    position: 'absolute',
    left: scaler(12),
    top: scaler(15),
    zIndex: 1,
  },
  input: {
    marginBottom: scaler(16),
  },
  inputError: {
    borderColor: COLORS.error.main,
  },
  errorText: {
    color: COLORS.error.main,
    fontSize: scaler(12),
    marginTop: scaler(4),
    marginLeft: scaler(12),
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: scaler(24),
  },
  forgotPasswordText: {
    color: COLORS.primary.main,
    fontSize: scaler(14),
  },
  signInButton: {
    backgroundColor: COLORS.primary.main,
    height: scaler(56),
    borderRadius: scaler(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: scaler(0.25),
    shadowRadius: scaler(4),
    elevation: scaler(5),
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: scaler(18),
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaler(24),
  },
  signUpText: {
    fontSize: scaler(16),
  },
  signUpLinkText: {
    color: COLORS.primary.main,
    fontSize: scaler(16),
    fontWeight: '600',
  },
});

export default LoginScreen;
