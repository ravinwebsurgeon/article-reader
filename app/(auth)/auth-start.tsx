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
import { ThemeButton, ThemeText, ThemeView } from '@/components';
import { scaler } from '@/utils';
import { Input } from '@/components/ui/TextInput/input';
import { SvgIcon } from '@/components/SvgIcon';

interface LoginFormData {
  email: string;
  password: string;
}

function AuthStart() {
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
            <ThemeView style={styles.logoContainer}>
              <SvgIcon name="pocket-pink" size={48} color={theme.colors.primary.main} />
            </ThemeView>
            <ThemeText variant="h2" style={styles.title}>
              How would you like to sign in?
            </ThemeText>
            <ThemeText style={styles.subtitle}>Choose a method to get started.</ThemeText>
          </ThemeView>

          <ThemeView style={styles.buttonContainer}>
            <ThemeButton
              title="Sign in with Google"
              onPress={handleSubmit(onSubmit)}
              style={styles.signInButton}
              leftIcon={<Ionicons name="log-in-outline" size={20} color={COLORS.white} />}
              rightIcon={null}
            />
            <ThemeButton
              title="Sign in with Apple"
              onPress={handleSubmit(onSubmit)}
              style={styles.signInButton}
              leftIcon={<Ionicons name="log-in-outline" size={20} color={COLORS.white} />}
              rightIcon={null}
            />
            <ThemeButton
              title="Sign in with Email"
              onPress={handleSubmit(onSubmit)}
              style={styles.signInButton}
              leftIcon={<Ionicons name="log-in-outline" size={20} color={COLORS.white} />}
              rightIcon={null}
            />
          </ThemeView>

          <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>New Here? </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={styles.signUpLinkText}>Create and account</ThemeText>
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
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: scaler(40),
    marginTop: scaler(20),
  },
  logoContainer: {
    marginBottom: scaler(24),
  },
  title: {
    fontSize: scaler(28),
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: scaler(8),
  },
  subtitle: {
    fontSize: scaler(17),
    lineHeight: scaler(26),
    fontWeight: '400',
    color: lightColors.text.disabled,
    marginBottom: scaler(16),
  },
  buttonContainer: {
    width: '100%',
    marginBottom: scaler(24),
    gap: scaler(16),
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
    color: COLORS.primary.main,
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

export default AuthStart;
