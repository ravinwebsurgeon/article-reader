import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, Input } from '@/components/ui/TextInput/input';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';

const SignUpScreen = ({ navigation }) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      zipCode: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');

  const onSubmit = (data) => {
    console.log(data);
    // Handle sign up logic here
  };

  const navigateToLogin = () => {
    // Navigate to login screen
    // navigation.navigate('Login');
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>Sign Up to Connect.</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              control={control}
              name="fullName"
              label="Full Name"
              rules={{ required: 'Full name is required' }}
              placeholder="Enter your Full Name"
              icon={<Ionicons name="person-outline" size={20} color={COLORS.primary} />}
              autoCapitalize="words"
            />

            <Input
              control={control}
              name="email"
              label="Email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              placeholder="Enter your Email"
              keyboardType="email-address"
              icon={<Ionicons name="mail-outline" size={20} color={COLORS.primary} />}
            />

            <Input
              control={control}
              name="phone"
              label="Phone"
              rules={{
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              }}
              placeholder="Enter your Phone"
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={COLORS.primary} />}
            />

            <Input
              control={control}
              name="address"
              label="Address"
              rules={{ required: 'Address is required' }}
              placeholder="Enter your Address"
              icon={<Ionicons name="location-outline" size={20} color={COLORS.primary} />}
              autoCapitalize="words"
            />

            <Input
              control={control}
              name="zipCode"
              label="Zip Code"
              rules={{
                required: 'Zip code is required',
                pattern: {
                  value: /^[0-9]{5}(-[0-9]{4})?$/,
                  message: 'Please enter a valid zip code'
                }
              }}
              placeholder="Enter your Zip Code"
              keyboardType="numeric"
              icon={<Ionicons name="map-outline" size={20} color={COLORS.primary} />}
            />

            <Input
              control={control}
              name="password"
              label="Password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Password must contain uppercase, lowercase, number and special character'
                }
              }}
              placeholder="Enter your Password"
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />}
            />

            <Input
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              rules={{
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              }}
              placeholder="Confirm your Password"
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />}
            />

            <Button
              title="Sign Up"
              onPress={handleSubmit(onSubmit)}
              style={styles.signUpButton}
            />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLinkText} onPress={navigateToLogin}>
              Sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.placeholder,
    marginBottom: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  signUpButton: {
    marginTop: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: COLORS.text,
    fontSize: 16,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignUpScreen;